"""
입력값 검증 전용 — 로그인 버튼 안 누름. 계정 잠금 회피.

fill() / keyboard.type() / press_sequentially() 각각 시도해보고
실제 필드 value 가 .env 값과 charCode 까지 일치하는지 확인.
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


async def test_input_method(page, method: str, value: str, field_placeholder: str, field_label: str) -> dict:
    """한 가지 방법으로 입력 시도 후 value 비교."""
    loc = page.get_by_placeholder(field_placeholder)
    await loc.click()
    await loc.fill("")  # 비우기

    if method == "fill":
        await loc.fill(value)
    elif method == "keyboard_type":
        await page.keyboard.type(value, delay=50)
    elif method == "press_sequentially":
        await loc.press_sequentially(value, delay=50)

    # 실제 value 추출
    result = await loc.evaluate(
        "el => ({ len: el.value.length, codes: [...el.value].map(c => c.charCodeAt(0)), sample: el.value.slice(0, 3) })"
    )
    expected_codes = [ord(c) for c in value]
    match = result["codes"] == expected_codes

    print(f"  [{method:20}] {field_label}: len={result['len']} match={match}")
    if not match:
        print(f"    기대: {expected_codes[:5]}...")
        print(f"    실제: {result['codes'][:5]}...")
        print(f"    샘플: {repr(result['sample'])}")
    return {"method": method, "match": match, "result": result}


async def main():
    print("=" * 60)
    print("  입력값 검증 — 로그인 버튼 안 누름 (계정 안전)")
    print("=" * 60)

    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=False, channel="chrome")
            print("[browser] 시스템 Chrome 사용\n")
        except Exception as e:
            browser = await p.chromium.launch(headless=False)
            print(f"[browser] Chromium 폴백: {e}\n")

        context = await browser.new_context(
            user_agent=REAL_CHROME_UA,
            locale="ko-KR",
            timezone_id="Asia/Seoul",
            viewport={"width": 1440, "height": 900},
        )
        await apply_stealth(context)
        page = await context.new_page()
        await page.goto(SEL["login"]["url"])
        await page.wait_for_load_state("networkidle", timeout=15000)

        print("각 입력 방법으로 ID/PW 테스트:\n")
        for method in ["fill", "keyboard_type", "press_sequentially"]:
            print(f"\n--- 방법: {method} ---")
            await test_input_method(page, method, Env.USER_ID, SEL["login"]["id_input_placeholder"], "ID")
            await test_input_method(page, method, Env.USER_PW, SEL["login"]["pw_input_placeholder"], "PW")

        print("\n" + "=" * 60)
        print("  완료. Chrome 창 X로 닫아주세요.")
        print("=" * 60)

        try:
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass
        try:
            await context.close()
            await browser.close()
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
