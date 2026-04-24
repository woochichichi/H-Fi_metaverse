"""
전체 플로우 엔트리.

실행:
  python -m src.main                     # 기본: 현재 월, 카드 원본 포함
  python -m src.main --ym 202604         # 특정 YYYYMM
  python -m src.main --no-card           # 카드 원본 수집 생략 (통제예산만)
  python -m src.main --card-days 30      # 카드 원본 조회 기간 (기본 60일)

출력:
  data/raw/budget_<deptCd>_<YYYYMM>_<ts>.json  — 통제예산 + EA 거래 상세 (팀 전체)
  data/raw/card_<empNo>_<ts>.json              — 본인 카드 원본 (EA 미생성 건)

폴백:
  - 로그인 실패 시 debug/에 스크린샷
  - 카드 원본 수집 실패해도 통제예산 수집은 살려서 저장
"""
from __future__ import annotations
# Windows 콘솔(CP949) 유니코드 깨짐 방지 — import 전에 reconfigure
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import argparse
import asyncio
import os
import traceback
from datetime import datetime
from pathlib import Path

from .config import Env
from .login import login_and_open_erp
from .scrape import collect_snapshot, save_snapshot
from .card_expense import collect_card_expense, save_card_snapshot
from .stealth import human_delay
from .uploader import upload_snapshot, upload_card_pending


async def run(period_ym: str, collect_card: bool, card_days: int,
              dept_cd: str, emp_no: str) -> int:
    Env.DATA_DIR.mkdir(parents=True, exist_ok=True)
    Env.DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    context = None
    p_mgr = None
    try:
        context, main_page, erp_page, p_mgr = await login_and_open_erp()

        # ─── 1. 통제예산조회 (팀 전체 EA 기반) ───
        budget_snap = await collect_snapshot(erp_page, dept_cd=dept_cd, period_ym=period_ym)
        budget_path = save_snapshot(budget_snap, Env.DATA_DIR)
        print(f"\n[main] ✓ 통제예산 저장: {budget_path}")
        print(f"       계정 {len(budget_snap.accounts)}개 · 거래 {len(budget_snap.transactions)}건")

        # ─── 1-b. Supabase 업로드 (대시보드 반영) ───
        target_team = Env.TARGET_TEAM
        if Env.SUPABASE_SERVICE_ROLE_KEY and Env.SUPABASE_URL:
            try:
                snapshot_id = upload_snapshot(budget_snap, team=target_team)
                print(f"[main] ✓ Supabase 업로드 · snapshot_id={snapshot_id}")
            except Exception as e:
                print(f"[main] ⚠ Supabase 업로드 실패 (로컬 JSON은 저장됨): {e}", file=sys.stderr)
                traceback.print_exc()
        else:
            print("[main] ⚠ SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 미설정 — 업로드 생략")

        # ─── 2. 카드 원본 (본인, 미처리 = 실시간) ───
        if collect_card:
            if not emp_no:
                print("[main] ⚠ EMP_NO 미설정 — 카드 원본 수집 생략")
            else:
                try:
                    await human_delay(3.0, 5.0)   # 메뉴 전환 사이 여유
                    card_snap = await collect_card_expense(
                        erp_page, emp_no=emp_no, days_back=card_days, status="01",
                    )
                    card_path = save_card_snapshot(card_snap, Env.DATA_DIR)
                    print(f"[main] ✓ 카드 원본 저장: {card_path}")
                    print(f"       미처리 {len(card_snap.rows)}건 (본인)")

                    if Env.SUPABASE_SERVICE_ROLE_KEY and Env.SUPABASE_URL:
                        try:
                            n = upload_card_pending(card_snap, team=target_team)
                            print(f"[main] ✓ 카드 원본 업로드 · {n}건")
                        except Exception as e:
                            print(f"[main] ⚠ 카드 원본 업로드 실패: {e}", file=sys.stderr)
                            traceback.print_exc()
                except Exception as e:
                    print(f"[main] ⚠ 카드 원본 수집 실패 (통제예산은 저장됨): {e}", file=sys.stderr)
                    traceback.print_exc()
        return 0

    except Exception as e:
        print(f"[main] ✗ 실패: {e}", file=sys.stderr)
        traceback.print_exc()
        try:
            if context:
                for i, pg in enumerate(context.pages):
                    path = Env.DEBUG_DIR / f"fail_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i}.png"
                    await pg.screenshot(path=str(path))
                    print(f"[main] 스크린샷: {path}", file=sys.stderr)
        except Exception:
            pass
        # 실패 시 브라우저 창 유지 — KEEP_OPEN_SECS 환경변수
        keep = int(os.environ.get("KEEP_OPEN_SECS", "0"))
        if keep > 0:
            print(f"[main] 브라우저 창 {keep}s 유지 (KEEP_OPEN_SECS) — 상태 확인하세요")
            try:
                await asyncio.sleep(keep)
            except KeyboardInterrupt:
                pass
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
    ap.add_argument("--ym", default=datetime.now().strftime("%Y%m"),
                    help="통제예산 YYYYMM (기본: 오늘 기준)")
    ap.add_argument("--no-card", action="store_true",
                    help="카드 원본 수집 생략")
    ap.add_argument("--card-days", type=int, default=60,
                    help="카드 원본 조회 기간 일수 (기본 60)")
    ap.add_argument("--dept", default=None,
                    help="부서 코드 (기본: .env DEPT_CD)")
    ap.add_argument("--emp", default=None,
                    help="본인 사번 (기본: .env EMP_NO)")
    args = ap.parse_args()

    dept_cd = args.dept or Env.DEPT_CD
    emp_no = args.emp or Env.EMP_NO

    if not dept_cd:
        print("DEPT_CD 미설정 (.env 확인)", file=sys.stderr)
        sys.exit(2)

    exit_code = asyncio.run(run(
        period_ym=args.ym,
        collect_card=not args.no_card,
        card_days=args.card_days,
        dept_cd=dept_cd,
        emp_no=emp_no,
    ))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
