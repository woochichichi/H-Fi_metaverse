"""
한 번의 로그인으로 여러 분기 연속 스크래핑 + Supabase 업로드.

사용:
  python -m src.main_dual 202604 202601
  python -m src.main_dual 202604 202601 --no-card

main.py 가 한 분기만 처리하는 것의 확장. 로그인·ERP 팝업 진입은 1회만 —
봇탐지 리스크 최소화.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import argparse
import asyncio
import os
import traceback
from datetime import datetime

from .config import Env
from .login import login_and_open_erp
from .scrape import collect_snapshot, save_snapshot
from .card_expense import collect_card_expense, save_card_snapshot
from .stealth import human_delay
from .uploader import upload_snapshot, upload_card_pending


async def run(periods: list[str], collect_card: bool, card_days: int,
              dept_cd: str, emp_no: str) -> int:
    Env.DATA_DIR.mkdir(parents=True, exist_ok=True)
    Env.DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    context = None
    p_mgr = None
    try:
        context, main_page, erp_page, p_mgr = await login_and_open_erp()

        target_team = Env.TARGET_TEAM
        results: list[tuple[str, str]] = []

        for i, period_ym in enumerate(periods):
            print(f"\n======== [{i+1}/{len(periods)}] period={period_ym} ========")
            if i > 0:
                await human_delay(3.0, 5.0)  # 분기 전환 사이 여유
            budget_snap = await collect_snapshot(erp_page, dept_cd=dept_cd, period_ym=period_ym)
            save_snapshot(budget_snap, Env.DATA_DIR)
            print(f"[dual] ✓ 통제예산 저장 {period_ym} · 계정 {len(budget_snap.accounts)}개 · 거래 {len(budget_snap.transactions)}건")

            if Env.SUPABASE_SERVICE_ROLE_KEY and Env.SUPABASE_URL:
                try:
                    snapshot_id = upload_snapshot(budget_snap, team=target_team)
                    results.append((period_ym, snapshot_id))
                    print(f"[dual] ✓ Supabase 업로드 {period_ym} · snapshot_id={snapshot_id}")
                except Exception as e:
                    print(f"[dual] ⚠ Supabase 업로드 실패 {period_ym}: {e}", file=sys.stderr)
                    traceback.print_exc()

        # 카드 원본 (마지막에 1회)
        if collect_card and emp_no:
            print(f"\n======== 카드 원본 (emp={emp_no}) ========")
            try:
                await human_delay(3.0, 5.0)
                card_snap = await collect_card_expense(
                    erp_page, emp_no=emp_no, days_back=card_days, status="01",
                )
                card_path = save_card_snapshot(card_snap, Env.DATA_DIR)
                print(f"[dual] ✓ 카드 원본 저장: {card_path}")
                if Env.SUPABASE_SERVICE_ROLE_KEY and Env.SUPABASE_URL:
                    n = upload_card_pending(card_snap, team=target_team)
                    print(f"[dual] ✓ 카드 원본 업로드 · {n}건")
            except Exception as e:
                print(f"[dual] ⚠ 카드 원본 실패 (통제예산은 저장됨): {e}", file=sys.stderr)
                traceback.print_exc()

        print(f"\n======== 전체 완료: {len(results)} snapshot 업로드 ========")
        for p, sid in results:
            print(f"  {p} → {sid}")
        return 0

    except Exception as e:
        print(f"[dual] ✗ 실패: {e}", file=sys.stderr)
        traceback.print_exc()
        try:
            if context:
                for i, pg in enumerate(context.pages):
                    path = Env.DEBUG_DIR / f"dual_fail_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i}.png"
                    await pg.screenshot(path=str(path))
                    print(f"[dual] 스크린샷: {path}", file=sys.stderr)
        except Exception:
            pass
        keep = int(os.environ.get("KEEP_OPEN_SECS", "0"))
        if keep > 0:
            print(f"[dual] 브라우저 창 {keep}s 유지")
            try: await asyncio.sleep(keep)
            except KeyboardInterrupt: pass
        return 1
    finally:
        try:
            if context: await context.close()
        except Exception: pass
        try:
            if p_mgr: await p_mgr.__aexit__(None, None, None)
        except Exception: pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("periods", nargs="+", help="YYYYMM 분기 여러 개 (예: 202604 202601)")
    ap.add_argument("--no-card", action="store_true")
    ap.add_argument("--card-days", type=int, default=60)
    ap.add_argument("--dept", default=None)
    ap.add_argument("--emp", default=None)
    args = ap.parse_args()

    dept_cd = args.dept or Env.DEPT_CD
    emp_no = args.emp or Env.EMP_NO
    if not dept_cd:
        print("DEPT_CD 미설정 (.env)", file=sys.stderr)
        sys.exit(2)

    exit_code = asyncio.run(run(
        periods=args.periods,
        collect_card=not args.no_card,
        card_days=args.card_days,
        dept_cd=dept_cd,
        emp_no=emp_no,
    ))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
