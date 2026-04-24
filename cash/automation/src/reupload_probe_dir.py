"""
probe_live / probe_autologin 디렉토리 전체를 스캔해서
분기별로 BudgetSnapshot 생성 → Supabase 업로드.

사용:
  python -m src.reupload_probe_dir <probe_dir>

예:
  python -m src.reupload_probe_dir debug/probe_20260424_125151

동작:
  - budgetList.do 파일들 → request_body.toDate 기준으로 period_ym 그룹핑
  - budgetHistList.do 파일들 → 같은 period_ym 그룹에 합침 (rtnType=NON/MIS/SIN 태깅)
  - 각 period 마다 upload_snapshot 호출
  - corporationCardExpense.do 있으면 별도 안내 (현재 자동 업로드는 skip —
    CardExpense 스키마 필드 프로빙 필요)

사이트 재접속 없이 이미 캡처한 UI 기반 응답만 사용 → 봇탐지 리스크 0.
"""
from __future__ import annotations
import json
import sys
from datetime import datetime
from pathlib import Path
from collections import defaultdict

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from .config import Env
from .scrape import BudgetRow, BudgetHistRow, BudgetSnapshot
from .uploader import upload_snapshot


def main():
    if len(sys.argv) < 2:
        print("사용: python -m src.reupload_probe_dir <probe_dir>")
        sys.exit(1)

    probe_dir = Path(sys.argv[1])
    if not probe_dir.is_dir():
        print(f"✗ 디렉토리 없음: {probe_dir}")
        sys.exit(1)

    # ─ 그룹: period_ym → { accounts: [], transactions: [] }
    groups: dict[str, dict] = defaultdict(lambda: {"accounts": [], "transactions": [], "dept_cd": None})

    files = sorted(probe_dir.glob("*.json"))
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[skip] {f.name} 파싱실패: {e}")
            continue

        url = data.get("url", "")
        req = data.get("request_body") or {}
        resp = data.get("response_body")

        # request_body 가 URL 인코딩 문자열로 저장된 경우 간단 파싱
        if isinstance(req, str):
            parsed = {}
            for part in req.replace("&", "\n").splitlines():
                if "=" in part:
                    k, v = part.split("=", 1)
                    parsed[k] = v
            req = parsed

        if url.endswith("budgetList.do"):
            if not isinstance(resp, list):
                print(f"[skip] {f.name}: budgetList 응답이 list 아님")
                continue
            period_ym = (req.get("toDate") or "").strip()
            dept_cd = (req.get("deptCd") or "").strip() or Env.DEPT_CD
            if not period_ym:
                print(f"[skip] {f.name}: toDate 없음")
                continue
            accounts = [BudgetRow.from_json(obj) for obj in resp]
            groups[period_ym]["accounts"] = accounts
            groups[period_ym]["dept_cd"] = dept_cd
            print(f"[load] budgetList toDate={period_ym} → 계정 {len(accounts)}건")

        elif url.endswith("budgetHistList.do"):
            if not isinstance(resp, list):
                print(f"[skip] {f.name}: budgetHistList 응답이 list 아님")
                continue
            period_ym = (req.get("toDate") or "").strip()
            rtn_type = (req.get("rtnType") or "").strip()
            if not period_ym:
                print(f"[skip] {f.name}: toDate 없음")
                continue
            txs = [BudgetHistRow.from_json(obj, rtn_type=rtn_type) for obj in resp]
            groups[period_ym]["transactions"].extend(txs)
            print(f"[load] budgetHistList toDate={period_ym} rtnType={rtn_type} → 거래 {len(txs)}건")

    if not groups:
        print("✗ 업로드 대상 없음 — budgetList.do 파일이 1건도 없습니다.")
        sys.exit(1)

    target_team = Env.TARGET_TEAM
    now_iso = datetime.now().isoformat()
    print()

    for period_ym, bundle in sorted(groups.items()):
        accounts = bundle["accounts"]
        transactions = bundle["transactions"]
        dept_cd = bundle["dept_cd"] or Env.DEPT_CD
        if not accounts:
            print(f"[skip] period={period_ym}: budgetList 없음")
            continue

        # 편성 전부 0인 더미 계정 요약
        non_dummy = [a for a in accounts if not (a.baseAmt == 0 and a.sinBdget == 0 and a.misBdget == 0 and a.nonBdget == 0)]

        print(f"─── period {period_ym} (dept={dept_cd}) ───")
        for a in accounts:
            print(f"  {a.acctCode} {a.acctName}: 편성 {a.baseAmt:>11,}  저장 {a.sinBdget:>10,}  처리중 {a.misBdget:>10,}  완료 {a.nonBdget:>10,}  잔여 {a.rstAmt:>10,}")
        print(f"  거래 {len(transactions)}건 (실데이터 계정 {len(non_dummy)}개)")

        snap = BudgetSnapshot(
            captured_at=now_iso,
            dept_cd=dept_cd,
            period_ym=period_ym,
            accounts=accounts,
            transactions=transactions,
        )
        snapshot_id = upload_snapshot(snap, team=target_team)
        print(f"  ✓ 업로드 snapshot_id={snapshot_id}")
        print()

    print("전체 완료.")


if __name__ == "__main__":
    main()
