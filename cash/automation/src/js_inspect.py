"""
로그인 페이지의 JS 17개 이름만 나열 + 비번 필드 동작 분석.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import asyncio
from playwright.async_api import async_playwright
from .config import load_selectors
from .stealth import apply_stealth, REAL_CHROME_UA

SEL = load_selectors()


async def main():
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=False, channel="chrome")
        except Exception:
            browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(user_agent=REAL_CHROME_UA, locale="ko-KR")
        await apply_stealth(context)
        page = await context.new_page()

        scripts = []
        page.on("response", lambda r: scripts.append(r.url) if r.url.endswith('.js') else None)

        await page.goto(SEL["login"]["url"])
        await page.wait_for_load_state("networkidle", timeout=20000)
        await asyncio.sleep(2)

        print("\n--- 로드된 JS 파일 (전체) ---")
        for s in scripts:
            # 쿼리스트링 잘라서 깔끔하게
            cleaned = s.split('?')[0]
            print(f"  {cleaned}")

        # 비번 필드의 모든 속성 + 부모 몇 단계
        print("\n--- 비번 필드 상세 ---")
        info = await page.evaluate("""
        () => {
          const pw = document.querySelector('input[type=password], input[placeholder=비밀번호]');
          if (!pw) return null;
          const attrs = {};
          for (const a of pw.attributes) attrs[a.name] = a.value;
          // 부모 3단계 outerHTML (첫 200자만)
          let el = pw;
          const parents = [];
          for (let i = 0; i < 4 && el.parentElement; i++) {
            el = el.parentElement;
            parents.push({
              tag: el.tagName,
              class: el.className,
              id: el.id,
            });
          }
          return { attrs, parents };
        }
        """)
        print(f"속성: {info.get('attrs')}")
        print(f"부모 체인: {info.get('parents')}")

        # 폼 제출 시 일어나는 일 — onsubmit handler 코드 덤프
        print("\n--- 폼 onsubmit 핸들러 ---")
        submit_info = await page.evaluate("""
        () => {
          const form = document.querySelector('form');
          if (!form) return null;
          return {
            action: form.action,
            method: form.method,
            onsubmit: form.getAttribute('onsubmit'),
            onsubmit_fn: form.onsubmit ? form.onsubmit.toString().slice(0, 500) : null,
          };
        }
        """)
        print(submit_info)

        # body에 붙은 모든 script 태그 inline 내용 (처음 300자씩)
        print("\n--- inline <script> 내용 샘플 ---")
        inline_scripts = await page.evaluate("""
        () => [...document.querySelectorAll('script:not([src])')]
          .map(s => s.textContent.trim())
          .filter(t => t.length > 20)
          .map(t => t.slice(0, 400))
          .slice(0, 5)
        """)
        for i, src in enumerate(inline_scripts):
            print(f"\n  [{i}] {src}\n")

        print("\n창 X로 닫으면 종료")
        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
