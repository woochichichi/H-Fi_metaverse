"""
수동 로그인 진단 도구.

목적: Playwright 가 띄운 바로 그 브라우저에서 사용자가 직접 ID/PW 입력해 로그인.
    - 수동 로그인이 잘 된다 → Playwright 브라우저 자체는 정상, 문제는 자동 입력 쪽
    - 수동 로그인도 안 된다 → 계정/비번 또는 회사 보안 차단 문제

실행:
  python -m src.manual_login_debug
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import asyncio
from playwright.async_api import async_playwright

from .config import Env, load_selectors
from .stealth import apply_stealth, REAL_CHROME_UA

SEL = load_selectors()


async def main() -> None:
    print("=" * 60)
    print("  수동 로그인 진단")
    print("=" * 60)
    print("  1. 띄워진 Chrome 에서 직접 ID/PW 입력해 로그인 해보세요")
    print("  2. 성공하면 → 같은 브라우저에서 자동화도 돼야 하는데 안 되는 것 확인")
    print("     실패하면 → 계정/비번 문제, 또는 Playwright 차단")
    print("  3. 결과 확인 후 창 X로 닫기")
    print("=" * 60)
    print()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent=REAL_CHROME_UA,
            locale="ko-KR",
            timezone_id="Asia/Seoul",
            viewport={"width": 1440, "height": 900},
        )
        await apply_stealth(context)
        page = await context.new_page()
        await page.goto(SEL["login"]["url"])

        print(f"[manual] 로그인 페이지 이동 완료: {page.url}")
        print("[manual] 창 닫을 때까지 대기 중...")
        print("[manual] 닫으면 최종 URL/쿠키 개수 출력.")

        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass

        try:
            final_url = page.url
        except Exception:
            final_url = "(unknown)"
        print(f"\n[manual] 최종 URL: {final_url}")

        try:
            cookies = await context.cookies()
            print(f"[manual] 보유 쿠키 개수: {len(cookies)}")
            for c in cookies[:5]:
                name = c.get("name", "")
                print(f"         - {name} (domain={c.get('domain')})")
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

    print("\n[manual] 진단 완료.")
    print("  → 수동 로그인 성공했는데 왜 자동은 안 될까? 다음 후보:")
    print("    (a) fill() 이 뭔가 JS 검증에 안 먹힘 → keyboard.press 로 변경")
    print("    (b) 서버가 Playwright 의 TLS/HTTP 시그니처 감지")
    print("    (c) ID/PW가 .env 와 실제 값이 다름 (오타)")


if __name__ == "__main__":
    asyncio.run(main())
