"""
Phase 2.5 — 네트워크 프로빙 (민감정보 무저장 모드 + 타겟 API 값 저장).

목적: 통제예산조회 관련 4개 API(budget*)의 request body 값만 실측하고,
      나머지 전부는 스키마만 남긴다.

저장 정책:
  - 타겟 URL (TARGET_URL에 매칭): request body 값 저장, response는 스키마만.
  - 그 외 URL: request/response 모두 스키마만(키 이름·타입·크기).
  - ID/PW/OTP/인증 관련 키는 키 이름도 "***"로 마스킹.
  - 잡음 URL(이미지·JS·CSS·분석도구)은 완전 제외.

결과물: debug/schema.<ts>.jsonl + summary.txt
"""
from __future__ import annotations
import asyncio
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit, parse_qsl
from playwright.async_api import async_playwright, Request, Response

ROOT = Path(__file__).resolve().parent.parent
DEBUG = ROOT / "debug"
DEBUG.mkdir(exist_ok=True)

LOG_FILE = DEBUG / f"schema.{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
SUMMARY_FILE = DEBUG / f"schema.{datetime.now().strftime('%Y%m%d_%H%M%S')}.summary.txt"

# 타겟 URL — 이 경로에 매칭되는 요청만 body 값을 저장한다.
# (통제예산조회 플로우의 핵심 API만. 사용자/토큰/메일 등은 제외.)
TARGET_URL = re.compile(r"smarthcps\.hsnc\.co\.kr/FW/(cmmn/budget|account/corporationCard)", re.IGNORECASE)

SENSITIVE_KEY = re.compile(
    r"(password|passwd|pwd|otp|auth|token|cookie|session|jwt|인증)",
    re.IGNORECASE,
)

IGNORE_URL = re.compile(
    r"(\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|css|js|map|html)(\?|$))"
    r"|(google-analytics|doubleclick|googletagmanager|beacon|hotjar|mixpanel)",
    re.IGNORECASE,
)

INTERESTING = re.compile(r"(budget|예산|grid|query|search|inquiry|corporationCard)", re.IGNORECASE)


def strip_url(url: str) -> tuple[str, list[str]]:
    sp = urlsplit(url)
    base = f"{sp.scheme}://{sp.netloc}{sp.path}"
    keys = [k for k, _ in parse_qsl(sp.query, keep_blank_values=True)]
    return base, keys


def schema_of(obj, depth: int = 0, max_depth: int = 4):
    if depth > max_depth:
        return "..."
    if isinstance(obj, dict):
        return {
            ("***" if SENSITIVE_KEY.search(str(k)) else str(k)): schema_of(v, depth + 1, max_depth)
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        if not obj:
            return []
        return [schema_of(obj[0], depth + 1, max_depth), f"...×{len(obj)}"]
    return type(obj).__name__


def schema_of_form(text: str) -> list[str]:
    keys = []
    for m in re.finditer(r"([A-Za-z0-9_\-.\[\]]+)=", text):
        k = m.group(1)
        keys.append("***" if SENSITIVE_KEY.search(k) else k)
    return keys


def _mask_values(obj):
    """민감 키의 값을 ***로 교체. 값은 보존 (타겟 API 전용)."""
    if isinstance(obj, dict):
        return {k: ("***" if SENSITIVE_KEY.search(str(k)) else _mask_values(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_mask_values(x) for x in obj]
    return obj


def _parse_form(text: str) -> dict:
    """폼 데이터 → dict. 민감 키는 값 마스킹."""
    out: dict = {}
    for pair in text.split("&"):
        if "=" not in pair:
            continue
        k, v = pair.split("=", 1)
        from urllib.parse import unquote_plus
        k = unquote_plus(k)
        v = unquote_plus(v)
        out[k] = "***" if SENSITIVE_KEY.search(k) else v
    return out


def _write(entry: dict) -> None:
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")


API_STATS = defaultdict(lambda: {"count": 0, "sample_req": None, "sample_schema": None, "interesting": False})


async def log_request(req: Request):
    if IGNORE_URL.search(req.url):
        return
    base, query_keys = strip_url(req.url)
    is_target = bool(TARGET_URL.search(req.url))

    req_body = None
    try:
        raw = req.post_data
        if raw:
            if is_target:
                # 타겟 API: 값까지 저장 (민감키는 마스킹)
                try:
                    req_body = _mask_values(json.loads(raw))
                except Exception:
                    req_body = _parse_form(raw[:3000])
            else:
                # 비-타겟: 키 이름/타입만
                try:
                    req_body = schema_of(json.loads(raw))
                except Exception:
                    req_body = schema_of_form(raw[:3000])
    except Exception:
        pass

    entry = {
        "kind": "req",
        "ts": datetime.now().strftime("%H:%M:%S.%f")[:-3],
        "method": req.method,
        "url": base,
        "query_keys": query_keys,
        "target": is_target,
        "body": req_body if is_target else None,
        "body_schema": req_body if not is_target else None,
        "interesting": bool(INTERESTING.search(base)),
    }
    _write(entry)

    key = f"{req.method} {base}"
    st = API_STATS[key]
    if is_target and st["sample_req"] is None:
        st["sample_req"] = req_body
    if entry["interesting"]:
        st["interesting"] = True


async def log_response(resp: Response):
    url = resp.url
    if IGNORE_URL.search(url):
        return
    base, _ = strip_url(url)
    ct = resp.headers.get("content-type", "").lower()
    entry = {
        "kind": "resp",
        "ts": datetime.now().strftime("%H:%M:%S.%f")[:-3],
        "status": resp.status,
        "url": base,
        "content_type": ct.split(";")[0],
        "interesting": bool(INTERESTING.search(base)),
    }
    schema = None
    size = 0
    if "json" in ct:
        try:
            text = await resp.text()
            size = len(text)
            schema = schema_of(json.loads(text))
        except Exception as e:
            entry["parse_error"] = str(e)[:80]
    elif any(t in ct for t in ("xml", "text/plain")):
        try:
            text = await resp.text()
            size = len(text)
        except Exception:
            pass
    entry["body_size"] = size
    entry["schema"] = schema
    _write(entry)

    key = f"{resp.request.method} {base}"
    st = API_STATS[key]
    st["count"] += 1
    if schema and st["sample_schema"] is None:
        st["sample_schema"] = schema
    if entry["interesting"]:
        st["interesting"] = True


def write_summary():
    lines = []
    lines.append(f"# 네트워크 프로빙 요약 — {datetime.now()}")
    lines.append(f"총 고유 API: {len(API_STATS)}\n")

    targets = [(k, v) for k, v in API_STATS.items() if TARGET_URL.search(k)]
    lines.append(f"## 🎯 타겟 API — request body 값 실측 ({len(targets)}개)")
    for key, st in sorted(targets, key=lambda x: -x[1]["count"]):
        lines.append(f"  ⭐ {key}  ×{st['count']}")
        if st["sample_req"]:
            lines.append("     request body:")
            preview = json.dumps(st["sample_req"], ensure_ascii=False, indent=2)
            lines.append("     " + preview.replace("\n", "\n     "))
        if st["sample_schema"]:
            lines.append("     response schema: (첫 호출 기준)")
            preview = json.dumps(st["sample_schema"], ensure_ascii=False, indent=2)
            if len(preview) > 1500:
                preview = preview[:1500] + "\n  ...(truncated)"
            lines.append("     " + preview.replace("\n", "\n     "))
        lines.append("")

    others = sorted(
        [(k, v) for k, v in API_STATS.items() if not TARGET_URL.search(k)],
        key=lambda x: (not x[1]["interesting"], -x[1]["count"]),
    )
    lines.append("\n## 기타 흥미로운 API (참고)")
    for key, st in others:
        if not st["interesting"]:
            continue
        lines.append(f"  {key}  ×{st['count']}")

    SUMMARY_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n[probe] 요약 파일: {SUMMARY_FILE}")


async def main():
    print(f"[probe] 스키마 로그: {LOG_FILE}")
    print("[probe] 저장 정책: 타겟 API(budget*)만 request body 값 저장. 응답은 모두 스키마만.")
    print()
    print("[probe] 브라우저에서 천천히 진행 (봇 탐지 회피):")
    print("        1. 로그인 → OTP")
    print("        2. SMART ERP → 회계관리 → 통제예산조회")
    print("        3. 조회 버튼")
    print("        4. 첫 행 '저장금액(B)' 돋보기 클릭 → 팝업 확인 → 닫기")
    print("        5. 첫 행 '처리중 금액(C)' 돋보기 클릭 → 팝업 확인 → 닫기")
    print("        6. 첫 행 '처리완료 금액(D)' 돋보기 클릭 → 팝업 확인 → 닫기")
    print("        (각 클릭 사이 2~3초 여유)")
    print("        7. 크롬 X로 닫기")
    print()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        page.on("request", lambda req: asyncio.create_task(log_request(req)))
        page.on("response", lambda resp: asyncio.create_task(log_response(resp)))

        def attach(popup):
            print(f"[probe] 새 팝업 감지")
            popup.on("request", lambda req: asyncio.create_task(log_request(req)))
            popup.on("response", lambda resp: asyncio.create_task(log_response(resp)))
        context.on("page", attach)

        await page.goto("https://hsi.cleverse.kr/")

        print("[probe] 대기 중...")
        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass
        try:
            await context.close()
        except Exception:
            pass
        try:
            await browser.close()
        except Exception:
            pass

    write_summary()
    print("[probe] 완료.")


if __name__ == "__main__":
    asyncio.run(main())
