"""
login.py 의 login_and_open_erp 로 자동 로그인·ERP 진입 → 이후 사용자 조작 대기.
응답은 probe_live 와 동일 정책으로 캡처 (민감정보 차단/마스킹).

사용:
  python -m src.probe_autologin

동작:
  1. login_and_open_erp() → 세션 재사용 or 풀 로그인 (텔레그램 OTP 자동 수신)
     → SMART ERP 팝업까지 자동 진입
  2. context 에 response listener 부착 (모든 페이지/팝업)
  3. 사용자가 직접 분기 전환, 조회, 돋보기, 카드 원본 등 조작
  4. 브라우저 창 닫으면 종료 (state.json 갱신 + 처리 건수 출력)
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

from playwright.async_api import Response

from .config import Env
from .login import login_and_open_erp

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "debug" / f"probe_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
OUT_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE = OUT_DIR / "index.log"

TARGET_PATH = re.compile(
    r"(budget(List|HistList|Query|Inquiry)|corporationCardExpense|cardUse|cardExpenseList)",
    re.IGNORECASE,
)
BLOCK_PATH = re.compile(
    r"(login|logout|auth|otp|sso|token|session|password|profile|user|member|account/get|user/get|me\b)",
    re.IGNORECASE,
)
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
    if depth > 8: return "..."
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if isinstance(k, str) and SENSITIVE_KEY.search(k): out[k] = "***"
            else: out[k] = redact(v, depth + 1)
        return out
    if isinstance(obj, list):
        return [redact(x, depth + 1) for x in obj[:500]]
    return obj


counter = {"n": 0, "saved": 0}


def log_index(line: str):
    try:
        with INDEX_FILE.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception: pass


async def on_response(resp: Response):
    url = resp.url
    if IGNORE.search(url): return

    counter["n"] += 1
    seq = counter["n"]
    method = resp.request.method
    status = resp.status

    if BLOCK_PATH.search(url):
        log_index(f"#{seq:04d} [blocked] {method} {status} {url[:140]}")
        return

    if not TARGET_PATH.search(url):
        log_index(f"#{seq:04d} [skip] {method} {status} {url[:140]}")
        return

    try:
        path_part = sanitize(url.split("://", 1)[-1].split("?", 1)[0].split("/", 1)[-1])
    except Exception:
        path_part = f"resp_{seq}"

    req_body = None
    try:
        body_text = resp.request.post_data or ""
        if body_text:
            try: req_body = redact(json.loads(body_text))
            except Exception: req_body = body_text[:1000]
    except Exception: pass

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
    print(f"출력: {OUT_DIR}")
    print("자동 로그인 → ERP 진입까지 수행. 이후 사용자 조작.")
    print()

    context, main_page, erp_page, p_mgr = await login_and_open_erp()

    # context 내 모든 페이지(현재/팝업)에 listener 부착
    def attach(page):
        page.on("response", lambda r: asyncio.create_task(on_response(r)))
    context.on("page", attach)
    for p in context.pages:
        attach(p)

    print()
    print("=" * 60)
    print("ERP 팝업이 열려 있습니다. 지금부터 조작하세요:")
    print("  · 통제예산조회 2분기 → 각 계정 돋보기 3개 클릭")
    print("  · 1분기(202603)로 변경 → 동일 반복")
    print("  · (옵션) 카드 원본 조회")
    print("다 하면 브라우저 창 닫기.")
    print("=" * 60)
    print()

    closed = asyncio.Event()
    context.on("close", lambda: closed.set())
    try:
        browser = context.browser
        if browser is not None:
            browser.on("disconnected", lambda: closed.set())
    except Exception:
        pass

    try:
        await closed.wait()
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n총 처리 {counter['n']}건, 저장 {counter['saved']}건")
        print(f"출력: {OUT_DIR}")
        try:
            await context.storage_state(path=str(Env.STATE_FILE))
            print("[finalize] state.json 갱신")
        except Exception as e:
            print(f"[finalize] state.json 저장 실패 (무시): {e}")
        try:
            await p_mgr.__aexit__(None, None, None)
        except Exception:
            pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n중단")
