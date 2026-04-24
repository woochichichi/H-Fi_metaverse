"""
로그인 페이지 보안 모듈 탐지.

검사:
  1. 외부 스크립트 URL — 키보드 보안 모듈 패턴 (touchen/xecure/nxKey/raon/ahnlab 등)
  2. 비번 필드 주변 hidden input 존재 여부
  3. 전역 window.* 객체에 보안 모듈 노출 여부
  4. 비번 필드의 이벤트 리스너 개수
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import asyncio
import re
from playwright.async_api import async_playwright

from .config import load_selectors
from .stealth import apply_stealth, REAL_CHROME_UA

SEL = load_selectors()

# 한국에서 흔한 키보드 보안 모듈 키워드
SECURITY_MODULE_PATTERNS = [
    r"touchen", r"nxkey", r"nxpkixcert", r"xecure", r"xeplayer",
    r"raon", r"raonsecure", r"onlinesecurity", r"ahnlab",
    r"softforum", r"secuplugin", r"magickeyboard",
    r"initech", r"e2kb", r"mvkp", r"tkplus",
]
PATTERN_RE = re.compile("|".join(SECURITY_MODULE_PATTERNS), re.IGNORECASE)


async def main():
    print("=" * 60)
    print("  보안 모듈 탐지")
    print("=" * 60)

    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=False, channel="chrome")
            print("[browser] 시스템 Chrome 사용\n")
        except Exception:
            browser = await p.chromium.launch(headless=False)
            print("[browser] Chromium 폴백\n")

        context = await browser.new_context(
            user_agent=REAL_CHROME_UA,
            locale="ko-KR",
            timezone_id="Asia/Seoul",
        )
        await apply_stealth(context)
        page = await context.new_page()

        loaded_scripts: list[str] = []

        def on_response(resp):
            url = resp.url
            if url.endswith(".js") or "javascript" in (resp.headers.get("content-type", "") or ""):
                loaded_scripts.append(url)

        page.on("response", on_response)

        await page.goto(SEL["login"]["url"])
        await page.wait_for_load_state("networkidle", timeout=20000)
        await asyncio.sleep(2)  # 늦게 로드되는 JS 대비

        # 1) 외부 스크립트 URL 패턴 검사
        print("\n--- 1. 외부 JS 스크립트 URL ---")
        suspicious = [u for u in loaded_scripts if PATTERN_RE.search(u)]
        print(f"총 로드된 JS: {len(loaded_scripts)}")
        if suspicious:
            print(f"🚨 보안 모듈 의심 스크립트 {len(suspicious)}개:")
            for u in suspicious:
                print(f"   {u}")
        else:
            print("(키워드 매칭 JS 없음 — 내장형이거나 이름 난독화 가능성)")

        # 의심되는 것과 무관하게 전체 JS 도메인 요약
        from urllib.parse import urlsplit
        domains = {}
        for u in loaded_scripts:
            d = urlsplit(u).netloc
            domains[d] = domains.get(d, 0) + 1
        print(f"JS 로드 도메인: {dict(sorted(domains.items(), key=lambda x: -x[1]))}")

        # 2) 비번 필드 주변 hidden input
        print("\n--- 2. 비번 필드 주변 DOM ---")
        pw_info = await page.evaluate("""
        () => {
          const pw = document.querySelector('input[type=password], input[placeholder=비밀번호]');
          if (!pw) return { found: false };
          const form = pw.closest('form');
          const hidden = form
            ? [...form.querySelectorAll('input[type=hidden]')].map(h => ({
                name: h.name || '(no-name)',
                id: h.id || '(no-id)',
                value_len: (h.value || '').length
              }))
            : [];
          return {
            found: true,
            pw_name: pw.name,
            pw_id: pw.id,
            pw_autocomplete: pw.getAttribute('autocomplete'),
            pw_readonly: pw.readOnly,
            pw_data_attrs: [...pw.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name + '=' + a.value),
            hidden_inputs: hidden,
            form_action: form ? form.action : null,
          };
        }
        """)
        if pw_info.get("found"):
            print(f"비번 필드: name={pw_info['pw_name']} id={pw_info['pw_id']}")
            print(f"  autocomplete={pw_info.get('pw_autocomplete')} readonly={pw_info.get('pw_readonly')}")
            if pw_info.get('pw_data_attrs'):
                print(f"  data-*: {pw_info['pw_data_attrs']}")
            print(f"폼 action: {pw_info.get('form_action')}")
            print(f"폼 내 hidden input {len(pw_info['hidden_inputs'])}개:")
            for h in pw_info['hidden_inputs']:
                print(f"   name={h['name']} id={h['id']} value_len={h['value_len']}")
        else:
            print("비번 필드를 찾지 못함")

        # 3) window 전역에서 보안 모듈 흔적
        print("\n--- 3. window.* 전역 객체 흔적 ---")
        globals_hit = await page.evaluate("""
        () => {
          const keys = Object.keys(window);
          const patterns = /touchen|nxkey|xecure|raon|ahnlab|softforum|secure|plugin|encrypt|key|nxp|tkplus/i;
          return keys.filter(k => patterns.test(k)).slice(0, 30);
        }
        """)
        if globals_hit:
            print(f"의심 키 {len(globals_hit)}개: {globals_hit}")
        else:
            print("(특이 전역 객체 없음)")

        # 4) 비번 필드의 이벤트 리스너 개수 (getEventListeners는 DevTools 전용이라 간접 확인)
        print("\n--- 4. 비번 필드 inline 이벤트 핸들러 ---")
        handlers = await page.evaluate("""
        () => {
          const pw = document.querySelector('input[type=password], input[placeholder=비밀번호]');
          if (!pw) return null;
          const ev = ['onkeydown','onkeyup','onkeypress','oninput','onchange','onfocus','onblur','onclick','onpaste'];
          return ev.filter(e => pw[e] != null);
        }
        """)
        print(f"inline 핸들러: {handlers}")

        # 5) 로그인 버튼 클릭 직전 hidden 값 변화 추적 (버튼은 안 누름)
        print("\n--- 5. (참고) 수동으로 비번 한 글자 입력해보세요 ---")
        print("    Chrome 창에서 비번 필드에 1글자만 입력 → hidden 필드에 뭐가 찍히는지 확인")
        print("    창 닫으면 스크립트 종료")

        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass
        try:
            await context.close()
            await browser.close()
        except Exception:
            pass

    print("\n=" * 60)
    print("  종료.")


if __name__ == "__main__":
    asyncio.run(main())
