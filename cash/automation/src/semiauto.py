"""
반자동 E2E — 오타 방지를 위해 ID/PW만 사용자 수동, 나머지는 전부 자동.

플로우:
  1. Chrome 열고 로그인 페이지 이동
  2. 사용자가 ID/PW 입력 후 "로그인" 버튼 클릭 (여기까지만 수동)
  3. 스크립트가 OTP 선택 화면 감지 → 자동으로 SMS 선택 → 요청
  4. 텔레그램에서 OTP 받아 자동 입력 → 확인
  5. SMART ERP 팝업 열기 → 수집 → Supabase 업로드
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import asyncio
import time
import traceback
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

from .config import Env, load_selectors
from .stealth import human_delay
from .scrape import collect_snapshot, save_snapshot
from .card_expense import collect_card_expense, save_card_snapshot
from .uploader import upload_snapshot, upload_card_pending
from .telegram_otp import wait_for_otp

SEL = load_selectors()


async def wait_for_otp_screen(page, timeout_s: int = 180) -> None:
    """
    사용자가 ID/PW 입력 + 로그인 버튼 클릭할 때까지 대기.
    완료 기준: "인증번호" 입력 필드가 등장 (= OTP 선택/입력 화면).
    """
    print()
    print("=" * 60)
    print("  📌 지금 브라우저에서 ID/PW 입력 후 [로그인] 버튼 눌러주세요")
    print(f"  이후는 자동입니다 (OTP 요청·입력·SMART ERP 진입·수집)")
    print(f"  최대 {timeout_s}초 대기...")
    print("=" * 60)

    deadline = asyncio.get_event_loop().time() + timeout_s
    while asyncio.get_event_loop().time() < deadline:
        try:
            # OTP 입력 필드 또는 SMS 선택 텍스트가 뜨면 로그인 성공
            otp_input = await page.get_by_placeholder(SEL["otp"]["input_placeholder"]).count()
            sms_text = await page.get_by_text(SEL["otp"]["method_text"]).count()
            if otp_input > 0 or sms_text > 0:
                print("[semi] ✓ OTP 화면 감지")
                return
        except Exception:
            pass
        await asyncio.sleep(1)

    raise TimeoutError(f"{timeout_s}초 내 OTP 화면 감지 실패 — 로그인이 완료되지 않았을 수 있음")


async def auto_otp_flow(page) -> None:
    """OTP 선택 → 요청 → 텔레그램 수신 → 자동 입력 → 확인."""
    otp_cfg = SEL["otp"]

    # SMS 선택 (이미 선택돼 있으면 스킵)
    try:
        sms_loc = page.get_by_text(otp_cfg["method_text"])
        if await sms_loc.count() > 0:
            await sms_loc.first.click(timeout=5000)
            print("[semi] SMS 방식 선택")
            await human_delay(0.5, 1.0)
    except Exception as e:
        print(f"[semi] SMS 선택 스킵: {type(e).__name__}")

    # 요청하기
    login_started = time.time()
    print("[semi] SMS 요청 클릭")
    try:
        await page.get_by_role("button", name=otp_cfg["request_btn_name"]).first.click(timeout=15000)
    except Exception as e:
        raise RuntimeError(f"SMS 요청 버튼 클릭 실패: {e}")
    await human_delay(1.5, 3.0)

    # OTP 대기
    print("[semi] 텔레그램에서 OTP 수신 대기...")
    otp = await wait_for_otp(login_started)

    await page.get_by_placeholder(otp_cfg["input_placeholder"]).fill(otp)
    await human_delay(0.5, 1.0)
    await page.get_by_role("button", name=otp_cfg["submit_btn_name"]).first.click()
    print("[semi] ✓ OTP 제출")

    # 로그인 완료 대기
    try:
        await page.wait_for_load_state("networkidle", timeout=20000)
    except PWTimeout:
        pass
    await human_delay(1.5, 2.5)


async def open_erp(main_page, context):
    """로그인 후 SMART ERP 팝업 열기 — login.py 의 _open_erp 재사용하지 않고 간소화."""
    print("[semi] SMART ERP 팝업 열기")
    async with main_page.expect_popup(timeout=30000) as popup_info:
        await main_page.get_by_role("button", name=SEL["smart_erp"]["entry_btn_name"]).first.click()
    erp_page = await popup_info.value
    await erp_page.wait_for_load_state("domcontentloaded")
    await human_delay(1.5, 2.5)
    return erp_page


async def main():
    Env.DATA_DIR.mkdir(parents=True, exist_ok=True)
    Env.DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    period_ym = datetime.now().strftime("%Y%m")
    dept_cd = Env.DEPT_CD
    emp_no = Env.EMP_NO
    target_team = Env.TARGET_TEAM

    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(channel="chrome", headless=False)
            print("[browser] 시스템 Chrome 사용")
        except Exception as e:
            browser = await p.chromium.launch(headless=False)
            print(f"[browser] Chromium 폴백: {e}")

        context = await browser.new_context(
            locale="ko-KR",
            timezone_id="Asia/Seoul",
            viewport={"width": 1440, "height": 900},
        )
        page = await context.new_page()
        await page.goto(SEL["login"]["url"])

        try:
            # 1) 사용자 ID/PW 입력 + 로그인 클릭 대기 (OTP 화면이 뜰 때까지)
            await wait_for_otp_screen(page, timeout_s=180)

            # 2) OTP 자동 처리 (SMS 요청 → 텔레그램에서 받아서 입력 → 확인)
            await auto_otp_flow(page)

            # 3) 세션 저장 (다음 시도 세션 재사용)
            try:
                await context.storage_state(path=str(Env.STATE_FILE))
                print(f"[semi] ✓ 세션 저장: {Env.STATE_FILE}")
            except Exception as e:
                print(f"[semi] ⚠ 세션 저장 실패: {e}")

            # 3) SMART ERP 팝업 열기
            erp_page = await open_erp(page, context)

            # 4) 통제예산 수집
            budget_snap = await collect_snapshot(erp_page, dept_cd=dept_cd, period_ym=period_ym)
            budget_path = save_snapshot(budget_snap, Env.DATA_DIR)
            print(f"[semi] ✓ 통제예산 저장: {budget_path}")
            print(f"       계정 {len(budget_snap.accounts)}개 · 거래 {len(budget_snap.transactions)}건")

            if Env.SUPABASE_SERVICE_ROLE_KEY and Env.SUPABASE_URL:
                try:
                    sid = upload_snapshot(budget_snap, team=target_team)
                    print(f"[semi] ✓ Supabase 업로드 · snapshot_id={sid}")
                except Exception as e:
                    print(f"[semi] ⚠ 업로드 실패: {e}")
                    traceback.print_exc()

            # 5) 카드 원본
            if emp_no:
                await human_delay(3.0, 5.0)
                try:
                    card_snap = await collect_card_expense(
                        erp_page, emp_no=emp_no, days_back=60, status="01",
                    )
                    card_path = save_card_snapshot(card_snap, Env.DATA_DIR)
                    print(f"[semi] ✓ 카드 원본 저장: {card_path}")
                    print(f"       미처리 {len(card_snap.rows)}건 (본인)")
                    if Env.SUPABASE_SERVICE_ROLE_KEY:
                        try:
                            n = upload_card_pending(card_snap, team=target_team)
                            print(f"[semi] ✓ 카드 원본 업로드 · {n}건")
                        except Exception as e:
                            print(f"[semi] ⚠ 카드 업로드 실패: {e}")
                except Exception as e:
                    print(f"[semi] ⚠ 카드 원본 수집 실패: {e}")
                    traceback.print_exc()

            print("\n[semi] ✅ 완료 — 대시보드 새로고침하면 실데이터 반영됨")
        except Exception as e:
            print(f"\n[semi] ✗ 실패: {e}", file=sys.stderr)
            traceback.print_exc()
            try:
                for i, pg in enumerate(context.pages):
                    ts = int(asyncio.get_event_loop().time())
                    shot = Env.DEBUG_DIR / f"semi_fail_{ts}_{i}.png"
                    await pg.screenshot(path=str(shot))
                    print(f"[semi] 스크린샷: {shot}")
            except Exception:
                pass
            sys.exit(1)
        finally:
            try:
                await context.close()
            except Exception:
                pass
            try:
                await browser.close()
            except Exception:
                pass


if __name__ == "__main__":
    asyncio.run(main())
