"""
Vue SPA 로그인 — fill() + 강한 이벤트 발사 + 긴 대기 조합 테스트.
로그인 버튼 1회만 눌러봄. 실패 시 원인 분석.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import asyncio
import time
from playwright.async_api import async_playwright
from .config import Env, load_selectors
from .stealth import apply_stealth, REAL_CHROME_UA

SEL = load_selectors()


async def main():
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=False, channel="chrome")
        except Exception:
            browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent=REAL_CHROME_UA, locale="ko-KR", timezone_id="Asia/Seoul",
            viewport={"width": 1440, "height": 900}
        )
        await apply_stealth(context)
        page = await context.new_page()
        await page.goto(SEL["login"]["url"])
        await page.wait_for_load_state("networkidle", timeout=15000)

        # Vue는 input 이벤트에 반응. fill() + 명시적 input 이벤트로 state 갱신.
        id_sel = 'input[placeholder="아이디"]'
        pw_sel = 'input[placeholder="비밀번호"]'

        print("[v] ID 입력 (fill + input event)")
        await page.locator(id_sel).click()
        await page.locator(id_sel).fill(Env.USER_ID)
        await page.evaluate(f"""() => {{
          const el = document.querySelector('{id_sel}');
          el.dispatchEvent(new Event('input', {{bubbles:true}}));
          el.dispatchEvent(new Event('change', {{bubbles:true}}));
          el.dispatchEvent(new Event('blur', {{bubbles:true}}));
        }}""")
        await asyncio.sleep(0.8)

        print("[v] PW 입력 (fill + input event)")
        await page.locator(pw_sel).click()
        await page.locator(pw_sel).fill(Env.USER_PW)
        await page.evaluate(f"""() => {{
          const el = document.querySelector('{pw_sel}');
          el.dispatchEvent(new Event('input', {{bubbles:true}}));
          el.dispatchEvent(new Event('change', {{bubbles:true}}));
          el.dispatchEvent(new Event('blur', {{bubbles:true}}));
        }}""")
        await asyncio.sleep(1.2)

        # 값 확인
        id_val = await page.locator(id_sel).input_value()
        pw_val = await page.locator(pw_sel).input_value()
        print(f"[v] 최종 필드값 · ID={len(id_val)}자 · PW={len(pw_val)}자")

        # 네트워크 요청 가로채기 — 로그인 API 호출 시 body 확인
        login_requests = []
        def on_request(req):
            if req.method == "POST" and ("auth" in req.url or "login" in req.url):
                login_requests.append({
                    "url": req.url,
                    "body": req.post_data,
                })
        page.on("request", on_request)

        print("[v] 로그인 버튼 클릭")
        await page.get_by_role("button", name=SEL["login"]["submit_btn_name"]).click()
        await asyncio.sleep(4)  # API 응답 충분히 대기

        print(f"[v] 로그인 API 호출 {len(login_requests)}건:")
        for r in login_requests:
            print(f"   URL: {r['url']}")
            body = r.get("body") or ""
            # 민감 정보 마스킹해서 출력
            import re
            safe = re.sub(r'(password|pwd|pw)"?\s*[:=]\s*"?[^",&\s]+', r'\1="***"', body, flags=re.I)
            print(f"   Body (민감 마스킹): {safe[:500]}")

        print(f"\n[v] 최종 URL: {page.url}")
        err = await page.evaluate("""
          () => [...document.querySelectorAll('*')]
            .map(e => e.textContent?.trim())
            .filter(t => t && /잘못|일치|오류|실패|잠/.test(t))
            .slice(0, 3)
        """)
        print(f"[v] 에러 메시지: {err}")

        print("\n창 닫으면 종료")
        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
