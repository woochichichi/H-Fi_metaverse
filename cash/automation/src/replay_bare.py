"""
녹화된 코드를 거의 그대로 재생 — stealth/UA 설정 없이, 최소 코드로.
이게 되면 = 우리 main.py 의 추가 설정이 방해
이게 안 되면 = Playwright 재생 자체가 서버 차단 대상
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import asyncio
from playwright.async_api import async_playwright
from .config import Env


async def main():
    async with async_playwright() as p:
        # 녹화 그대로 + 최소 조건
        browser = await p.chromium.launch(channel="chrome", headless=False)
        context = await browser.new_context()  # 아무 설정 없이
        page = await context.new_page()

        # 네트워크 가로채기
        responses = []
        def on_resp(r):
            if "login" in r.url.lower() or "auth" in r.url.lower():
                responses.append({"url": r.url, "status": r.status})
        page.on("response", on_resp)

        print("[bare] 로그인 페이지 이동")
        await page.goto("https://hsi.cleverse.kr/auth/login/login?reUrl=/")

        print("[bare] 아이디 입력")
        await page.get_by_placeholder("아이디").click()
        await page.get_by_placeholder("아이디").fill(Env.USER_ID)

        print("[bare] 비번 입력")
        await page.get_by_placeholder("비밀번호").click()
        await page.get_by_placeholder("비밀번호").fill(Env.USER_PW)

        print("[bare] 로그인 버튼 클릭")
        await page.get_by_role("button", name="로그인").click()

        # 4초 대기 — 서버 응답 + 페이지 전환
        await asyncio.sleep(4)

        print(f"\n[bare] 최종 URL: {page.url}")
        print(f"[bare] 로그인 관련 네트워크 응답 {len(responses)}건:")
        for r in responses:
            print(f"   {r['status']} {r['url']}")

        # 화면에 "잘못된" 문구가 있는지
        err = await page.evaluate("""
          () => {
            const texts = [...document.querySelectorAll('*')]
              .map(e => (e.innerText || e.textContent || '').trim())
              .filter(t => t && /잘못|일치|실패|오류|잠|차단|인증/.test(t));
            return [...new Set(texts)].slice(0, 3);
          }
        """)
        print(f"[bare] 화면 경고: {err}")

        # OTP 화면인지 확인
        has_otp_field = await page.locator('input[placeholder="인증번호"]').count()
        print(f"[bare] OTP 입력 필드 발견: {has_otp_field > 0}")

        print("\n창 X로 닫으면 종료")
        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
