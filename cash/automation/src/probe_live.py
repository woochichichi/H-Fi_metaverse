"""
Playwright 로 브라우저 띄우고 사용자 조작을 추적.

보안 정책 (중요 — 민감정보 저장 금지):
  - 타겟 API (TARGET_PATH 매칭: budgetList/budgetHistList/corporationCardExpense 등)
    응답만 body 저장. 그 외는 URL·method·status 만 로깅.
  - 로그인/인증/토큰/세션 관련 경로는 어떤 body 도 저장 안 함.
  - 저장하는 body 에서도 재귀적으로 민감 키(password/token/jwt/session/cookie/
    authorization/accessToken/refreshToken/email/ssn/resident) 는 '***' 로 치환.
  - debug/ 는 .gitignore 에 포함 — 로컬 파일은 외부 업로드 없음.

사용:
  python -m src.probe_live

동작:
  1. Chrome 실행 (headless=false). state.json 있으면 세션 재사용.
  2. 사용자가 SMART ERP → 통제예산조회 → 조회 버튼 클릭.
  3. 타겟 응답은 debug/probe_<ts>/ 에 저장, 나머지는 index.log 에 URL/상태만.
  4. 사용자가 브라우저 창 닫으면 종료.
"""
from __future__ import annotations
import asyncio
import json
import re
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.async_api import async_playwright, Response

ROOT = Path(__file__).resolve().parent.parent
STATE_FILE = ROOT / "state.json"
OUT_DIR = ROOT / "debug" / f"probe_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
OUT_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE = OUT_DIR / "index.log"

# 저장 허용 — 통제예산/카드 관련 핵심 API 만 body 덤프
TARGET_PATH = re.compile(
    r"(budget(List|HistList|Query|Inquiry)|corporationCardExpense|cardUse|cardExpenseList)",
    re.IGNORECASE,
)

# 완전 차단 — 어떤 body 도 저장 안 함
BLOCK_PATH = re.compile(
    r"(login|logout|auth|otp|sso|token|session|password|profile|user|member|account/get|user/get|me\b)",
    re.IGNORECASE,
)

# 리소스 파일 / 분석 도구 — 로깅조차 생략
IGNORE = re.compile(
    r"(\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|css|js|map|html|webp|mp4|wasm)(\?|$))"
    r"|(google-analytics|doubleclick|googletagmanager|beacon|hotjar|mixpanel|sentry|newrelic)",
    re.IGNORECASE,
)

SENSITIVE_KEY = re.compile(
    r"(password|passwd|pwd|otp|auth|token|jwt|cookie|session|authorization|"
    r"access[_-]?token|refresh[_-]?token|secret|bearer|credential|"
    r"email|mobile|phone|tel|ssn|resident|jumin|id[_-]?card)",
    re.IGNORECASE,
)


def sanitize(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", name)[:60]


def redact(obj, depth: int = 0):
    """재귀적으로 민감 키/값 마스킹."""
    if depth > 8:
        return "..."
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if isinstance(k, str) and SENSITIVE_KEY.search(k):
                out[k] = "***"
            else:
                out[k] = redact(v, depth + 1)
        return out
    if isinstance(obj, list):
        return [redact(x, depth + 1) for x in obj[:500]]  # 최대 500건
    return obj


counter = {"n": 0, "saved": 0}


def log_index(line: str):
    try:
        with INDEX_FILE.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


async def on_response(resp: Response):
    url = resp.url
    if IGNORE.search(url):
        return

    counter["n"] += 1
    seq = counter["n"]
    method = resp.request.method
    status = resp.status

    # 차단 경로 → URL·상태만 기록
    if BLOCK_PATH.search(url):
        log_index(f"#{seq:04d} [blocked] {method} {status} {url[:140]}")
        return

    is_target = TARGET_PATH.search(url) is not None
    if not is_target:
        log_index(f"#{seq:04d} [skip] {method} {status} {url[:140]}")
        return

    # 타겟만 저장
    try:
        path_part = sanitize(url.split("://", 1)[-1].split("?", 1)[0].split("/", 1)[-1])
    except Exception:
        path_part = f"resp_{seq}"

    # 요청 body (민감 키 마스킹)
    req_body = None
    try:
        body_text = resp.request.post_data or ""
        if body_text:
            try:
                req_body = redact(json.loads(body_text))
            except Exception:
                req_body = body_text[:1000]
    except Exception:
        pass

    # 응답 body — 실제 데이터 구조 확인용 (민감 키 있으면 마스킹)
    resp_body = None
    try:
        ct = (resp.headers.get("content-type") or "").lower()
        if "json" in ct:
            resp_body = redact(await resp.json())
        else:
            txt = await resp.text()
            resp_body = {"_non_json_preview": txt[:500]}
    except Exception as e:
        resp_body = {"_parse_error": str(e)}

    out = {
        "seq": seq,
        "method": method,
        "url": url,
        "status": status,
        "request_body": req_body,
        "response_body": resp_body,
    }
    fname = f"{seq:04d}_{method}_{status}_{path_part}.json"
    try:
        (OUT_DIR / fname).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        counter["saved"] += 1
        log_index(f"#{seq:04d} [SAVED*] {method} {status} → {fname}")
        print(f"[probe] ✓ 저장 #{seq:04d} {method} {status} {path_part}")
    except Exception as e:
        log_index(f"#{seq:04d} [save-fail] {e}")


async def main():
    print(f"출력 디렉토리: {OUT_DIR}")
    print("보안: 로그인/프로필/토큰 등은 저장 안 됨. 통제예산/카드 응답만 덤프.")
    print("절차:")
    print("  1) 브라우저가 뜨면 직접 조작 (필요 시 로그인)")
    print("  2) SMART ERP → 회계관리 → 통제예산조회 → 조회")
    print("  3) 화면에 실제 숫자가 보이는지 확인 (보이면 파싱 버그, 안보이면 시스템 빈값)")
    print("  4) 다 되면 브라우저 창 닫기")
    print()

    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=False, channel="chrome")
        except Exception:
            browser = await p.chromium.launch(headless=False)

        ctx_kwargs = {"locale": "ko-KR", "timezone_id": "Asia/Seoul", "viewport": {"width": 1440, "height": 900}}
        if STATE_FILE.exists():
            ctx_kwargs["storage_state"] = str(STATE_FILE)
            print("[init] state.json 세션 재사용")

        context = await browser.new_context(**ctx_kwargs)

        def attach(page):
            page.on("response", lambda r: asyncio.create_task(on_response(r)))
        context.on("page", attach)

        page = await context.new_page()
        attach(page)
        await page.goto("https://hsi.cleverse.kr/")

        closed = asyncio.Event()
        context.on("close", lambda: closed.set())
        browser.on("disconnected", lambda: closed.set())

        try:
            await closed.wait()
        except KeyboardInterrupt:
            pass
        finally:
            print(f"\n총 처리 {counter['n']}건, 저장 {counter['saved']}건")
            print(f"출력: {OUT_DIR}")
            print(f"index: {INDEX_FILE}")
            try:
                await context.storage_state(path=str(STATE_FILE))
                print("[finalize] state.json 갱신")
            except Exception:
                pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n중단됨")
