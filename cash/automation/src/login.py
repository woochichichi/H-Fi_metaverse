"""
Phase 2+4 — 로그인 + OTP + SMART ERP 진입, 세션 저장.

반환값: (context, main_page, erp_page)
  - main_page: hsi.cleverse.kr (로그인된 메인)
  - erp_page: SMART ERP 팝업 (통제예산조회가 있는 창)

세션 재사용:
  - state.json 존재 시 먼저 로드 → 로그인 페이지로 튕기면 만료로 판단하고 풀 로그인.
"""
from __future__ import annotations
import asyncio
import time
from pathlib import Path
from playwright.async_api import async_playwright, BrowserContext, Page, TimeoutError as PWTimeout

from .config import Env, load_selectors
from .stealth import human_delay
from .telegram_user import wait_for_otp   # User API (pyrogram) 기반

SEL = load_selectors()


async def _new_context(p) -> tuple[BrowserContext, bool]:
    """
    시스템 Chrome(channel=chrome) 을 사용.

    주의: apply_stealth 는 쓰지 않는다.
      - 이 사이트(Vue SPA)는 stealth 가 덮어쓴 navigator.webdriver/plugins/chrome 때문에
        Vue 내부 JS 에서 예외 발생 → 로그인 폼 제출이 빈 비번으로 처리되는 증상 확인됨.
      - 시스템 Chrome 자체만으로 충분히 "정상 Chrome" 지문이라 stealth 불필요.

    Returns: (context, used_saved_state)
    """
    try:
        browser = await p.chromium.launch(headless=Env.HEADLESS, channel="chrome")
        print("[browser] 시스템 Chrome 사용")
    except Exception as e:
        print(f"[browser] 시스템 Chrome 실패, Chromium 폴백: {e}")
        browser = await p.chromium.launch(headless=Env.HEADLESS)

    ctx_kwargs = {
        "locale": "ko-KR",
        "timezone_id": "Asia/Seoul",
        "viewport": {"width": 1440, "height": 900},
    }
    used_saved = False
    if Env.STATE_FILE.exists():
        ctx_kwargs["storage_state"] = str(Env.STATE_FILE)
        used_saved = True
    context = await browser.new_context(**ctx_kwargs)
    return context, used_saved


async def _is_logged_in(page: Page) -> bool:
    """
    세션 유효성 판정.
    URL 체크만으론 부족(서버 렌더링이 같은 URL 유지한 채 로그인 폼만 바꿀 수 있음).
    → URL + 실제 DOM (로그인 폼 존재 여부) 둘 다 확인.
    """
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_load_state("networkidle", timeout=10000)
    except PWTimeout:
        pass

    # URL 기반 1차 판정
    if "/auth/login" in page.url:
        return False

    # DOM 기반 2차 판정 — 아이디/비밀번호 입력 필드가 보이면 로그인 만료로 간주
    try:
        id_input = page.get_by_placeholder("아이디")
        pw_input = page.get_by_placeholder("비밀번호")
        if (await id_input.count()) > 0 or (await pw_input.count()) > 0:
            return False
    except Exception:
        pass
    return True


async def _full_login(page: Page) -> None:
    """ID/PW/OTP 풀 로그인."""
    Env.require("USER_ID", "USER_PW")

    login_cfg = SEL["login"]
    otp_cfg = SEL["otp"]

    print("[login] 로그인 페이지 이동")
    await page.goto(login_cfg["url"])
    await human_delay()

    # 입력 — replay_bare 에서 성공한 최소 코드 그대로. 추가 처리 금지.
    #   (앞서 fill("")+dispatchEvent+press Tab 조합이 오히려 Vue v-model 상태를 꼬이게 함)
    print("[login] ID 입력")
    await page.get_by_placeholder(login_cfg["id_input_placeholder"]).click()
    await page.get_by_placeholder(login_cfg["id_input_placeholder"]).fill(Env.USER_ID)
    await human_delay(0.3, 0.6)

    print("[login] PW 입력")
    await page.get_by_placeholder(login_cfg["pw_input_placeholder"]).click()
    await page.get_by_placeholder(login_cfg["pw_input_placeholder"]).fill(Env.USER_PW)
    await human_delay(0.3, 0.6)

    # 입력 직후 필드 value 검증 — fill() 이 진짜 들어갔는지 확인
    try:
        id_len = await id_loc.evaluate("el => el.value.length")
        pw_len = await pw_loc.evaluate("el => el.value.length")
        print(f"[login] 입력된 필드 길이 · ID={id_len} · PW={pw_len} (.env 비교: ID={len(Env.USER_ID)}, PW={len(Env.USER_PW)})")
    except Exception:
        pass

    print("[login] 로그인 버튼")
    await page.get_by_role("button", name=login_cfg["submit_btn_name"]).click()
    # 페이지 전환 여유 — 네트워크·렌더 양쪽 대기
    await human_delay(2.0, 3.5)
    try:
        await page.wait_for_load_state("networkidle", timeout=20000)
    except PWTimeout:
        pass

    # 로그인 실패 감지 & 원인 진단
    if "/auth/login" in page.url:
        pw_still_there = await page.get_by_placeholder(login_cfg["pw_input_placeholder"]).count()
        if pw_still_there > 0:
            # 실패 원인 진단 — 에러 메시지 텍스트 추출
            try:
                import time as _t
                ts = int(_t.time())
                shot = Env.DEBUG_DIR / f"login_fail_{ts}.png"
                await page.screenshot(path=str(shot))
                print(f"[login] 실패 스크린샷: {shot}")
                # 에러/경고 문구 후보 태그에서 텍스트 수집
                err_texts = await page.evaluate(
                    "() => [...document.querySelectorAll('[class*=error], [class*=alert], [class*=warning], [role=alert], .message, .msg, p, span, div')]"
                    ".map(e => (e.innerText||e.textContent||'').trim())"
                    ".filter(t => t && t.length > 2 && t.length < 100 && /(잘못|일치|오류|실패|잠|차단|시도|맞지|확인|인증)/.test(t))"
                    ".slice(0, 10)"
                )
                print(f"[login] 페이지 경고성 텍스트: {err_texts}")
                # 현재 URL
                print(f"[login] 실패 시점 URL: {page.url}")
            except Exception:
                pass
            raise RuntimeError("로그인 실패 — 스크린샷·메시지로 원인 확인 필요")

    # OTP 단계 — OTP 화면 렌더까지 대기 (최소)
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
    except PWTimeout:
        pass

    # 세션 살아있으면 SMS OTP 단계 자체를 건너뛰고 바로 메인 진입하는 경우가 있음.
    # → SMART ERP 버튼이 이미 보이면 OTP 스킵하고 성공 처리.
    erp_btn_name = SEL["smart_erp"]["entry_btn_name"]
    async def _erp_visible() -> bool:
        try:
            for kind in ("button", "link"):
                loc = page.get_by_role(kind, name=erp_btn_name)
                if await loc.count() > 0 and await loc.first.is_visible():
                    return True
            loc = page.get_by_text(erp_btn_name, exact=False)
            if await loc.count() > 0 and await loc.first.is_visible():
                return True
        except Exception:
            pass
        return False

    # 로그인 직후 ~3s 동안 OTP 화면/메인 화면 둘 중 어느 쪽으로 갔는지 polling
    otp_needed = True
    for _ in range(6):
        if await _erp_visible():
            print("[login] ✓ OTP 생략 로그인 (세션 재사용) — SMART ERP 버튼 visible")
            otp_needed = False
            break
        await asyncio.sleep(0.5)

    if not otp_needed:
        return  # OTP 단계 전부 스킵

    login_started = time.time()

    # SMS 선택 + 요청하기 — 연속 호출 (지연 최소, locator.or_ 로 한 번에)
    print("[login] SMS 선택 + 요청 클릭 (연속)")
    try:
        sms_loc = page.get_by_text(otp_cfg["method_text"])
        if (await sms_loc.count()) > 0:
            await sms_loc.first.click(timeout=5000)
    except Exception as e:
        print(f"[login] SMS 선택 스킵: {type(e).__name__}")

    try:
        req_btn = page.get_by_role("button", name=otp_cfg["request_btn_name"])
        await req_btn.first.click(timeout=10000)
    except Exception as e:
        try:
            ts = int(time.time())
            shot = Env.DEBUG_DIR / f"request_btn_fail_{ts}.png"
            await page.screenshot(path=str(shot))
            print(f"[login] 요청하기 실패 스크린샷: {shot}")
        except Exception:
            pass
        raise e

    print("[login] 텔레그램 OTP 대기")
    otp_code = await wait_for_otp(login_started)
    print(f"[login] OTP 수신: {otp_code[:2]}***{otp_code[-1:]} (길이={len(otp_code)})")

    otp_input = page.get_by_placeholder(otp_cfg["input_placeholder"])
    await otp_input.click()
    await otp_input.fill(otp_code)
    await human_delay(0.4, 0.7)

    # 입력 검증 — fill 이 실제로 반영됐는지
    try:
        val = await otp_input.evaluate("el => el.value")
        match = "OK" if val == otp_code else f"MISMATCH(got={val!r})"
        print(f"[login] OTP 필드 검증: 길이={len(val)} {match}")
    except Exception as e:
        print(f"[login] OTP 검증 스킵: {type(e).__name__}")

    # Playwright click 이 Vue 버튼에서 무시되는 케이스 확인됨 (사용자 수동 click 은 성공).
    # → input 에서 Enter 로 form submit 트리거. 실패 시 button.click() 폴백.
    print(f"[login] OTP Enter 제출 · URL={page.url}")
    await otp_input.press("Enter")
    try:
        await page.wait_for_load_state("networkidle", timeout=10000)
    except PWTimeout:
        pass

    # Enter 가 먹지 않았으면(여전히 OTP 화면) button click 폴백
    still_otp = await otp_input.count() > 0
    if still_otp:
        try:
            visible = await otp_input.first.is_visible()
        except Exception:
            visible = True
        if visible:
            print("[login] Enter 미반응 → button click 폴백")
            await page.get_by_role("button", name=otp_cfg["submit_btn_name"]).click()
    print("[login] OTP 제출 — 전환 대기")

    try:
        await page.wait_for_load_state("networkidle", timeout=30000)
    except PWTimeout:
        print("[login] networkidle 타임아웃 (무시하고 진행)")

    print(f"[login] 제출 후 URL: {page.url}")

    # SPA 라우팅이라 URL·DOM count 기반 판정 모두 오탐(폼이 display:none 으로 잔존).
    # → SMART ERP 버튼이 visible 될 때까지 최대 60s polling.
    erp_btn_name = SEL["smart_erp"]["entry_btn_name"]

    async def _erp_btn_visible() -> bool:
        try:
            for kind in ("button", "link"):
                loc = page.get_by_role(kind, name=erp_btn_name)
                if await loc.count() > 0:
                    try:
                        if await loc.first.is_visible():
                            return True
                    except Exception:
                        pass
            loc = page.get_by_text(erp_btn_name, exact=False)
            if await loc.count() > 0:
                try:
                    return await loc.first.is_visible()
                except Exception:
                    return False
        except Exception:
            pass
        return False

    logged_in = False
    for waited in range(60):
        if await _erp_btn_visible():
            logged_in = True
            print(f"[login] 로그인 상태 판정(SMART ERP visible): True ({waited+1}s)")
            break
        await asyncio.sleep(1)
    if not logged_in:
        print(f"[login] 로그인 상태 판정(SMART ERP visible): False (60s 타임아웃)")
    if not logged_in:
        try:
            err_texts = await page.evaluate(
                "() => [...document.querySelectorAll('[class*=error], [class*=alert], [class*=warning], [role=alert], .message, .msg, p, span, div')]"
                ".map(e => (e.innerText||e.textContent||'').trim())"
                ".filter(t => t && t.length > 2 && t.length < 120 && /(잘못|일치|오류|실패|잠|차단|시도|맞지|확인|인증|만료|유효|invalid|expired)/i.test(t))"
                ".slice(0, 10)"
            )
            print(f"[login] 경고 문구: {err_texts}")
        except Exception:
            pass
        try:
            ts = int(time.time())
            shot = Env.DEBUG_DIR / f"otp_fail_{ts}.png"
            await page.screenshot(path=str(shot))
            print(f"[login] OTP 실패 스크린샷: {shot}")
        except Exception:
            pass
        raise RuntimeError(f"OTP 제출 후 로그인 상태 아님 (DOM에 로그인 폼 잔존)")


async def _open_erp(main_page: Page, context: BrowserContext) -> Page:
    """SMART ERP 버튼 클릭 → 새 팝업 페이지 반환."""
    erp_cfg = SEL["smart_erp"]
    btn_name = erp_cfg["entry_btn_name"]
    print(f"[erp] SMART ERP 진입 시도 · 현재 URL: {main_page.url}")

    # 네트워크 안정화까지 대기 (세션 복원 후 포털 로딩 시간 여유)
    try:
        await main_page.wait_for_load_state("networkidle", timeout=20000)
    except Exception:
        pass

    # 여러 셀렉터 후보 — button role 우선, text·link 폴백
    async def _try_click() -> None:
        # 1) role=button
        try:
            loc = main_page.get_by_role("button", name=btn_name)
            if await loc.count() > 0:
                await loc.first.click(timeout=10000)
                return
        except Exception:
            pass
        # 2) role=link
        try:
            loc = main_page.get_by_role("link", name=btn_name)
            if await loc.count() > 0:
                await loc.first.click(timeout=10000)
                return
        except Exception:
            pass
        # 3) text 매칭 (strict=False 동등)
        try:
            loc = main_page.get_by_text(btn_name, exact=False)
            if await loc.count() > 0:
                await loc.first.click(timeout=10000)
                return
        except Exception:
            pass
        raise RuntimeError(f"'{btn_name}' 버튼을 찾지 못함 (role/button/link/text 전부 실패)")

    try:
        async with main_page.expect_popup(timeout=45000) as popup_info:
            await _try_click()
        erp_page = await popup_info.value
    except Exception as e:
        # 진단용 스크린샷
        try:
            import time
            ts = int(time.time())
            shot = Env.DEBUG_DIR / f"erp_entry_fail_{ts}.png"
            await main_page.screenshot(path=str(shot))
            print(f"[erp] 실패 스크린샷: {shot}")
            # 모든 버튼/링크 텍스트 덤프 (다음 번 셀렉터 수정용)
            texts = await main_page.evaluate(
                "() => [...document.querySelectorAll('button, a, [role=button], [role=link]')]"
                ".map(e => (e.innerText||e.textContent||'').trim()).filter(t => t && t.length < 40).slice(0, 80)"
            )
            print(f"[erp] 감지된 버튼/링크 텍스트 (최대 80개): {texts}")
        except Exception:
            pass
        raise e

    await erp_page.wait_for_load_state("domcontentloaded")
    await human_delay(1.5, 2.5)
    return erp_page


async def login_and_open_erp() -> tuple[BrowserContext, Page, Page, object]:
    """
    Returns: (context, main_page, erp_page, playwright_manager)
    caller가 finally에서 playwright_manager.__aexit__ 책임.
    """
    p_mgr = async_playwright()
    p = await p_mgr.__aenter__()

    context, used_saved = await _new_context(p)
    page = await context.new_page()

    if used_saved:
        print("[login] 저장된 세션으로 시도")
        await page.goto("https://hsi.cleverse.kr/")
        if not await _is_logged_in(page):
            print("[login] 세션 만료 → 풀 로그인")
            await _full_login(page)
        else:
            print("[login] ✓ 세션 재사용")
    else:
        await _full_login(page)

    await context.storage_state(path=str(Env.STATE_FILE))
    erp_page = await _open_erp(page, context)

    return context, page, erp_page, p_mgr
