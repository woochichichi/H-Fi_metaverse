"""
probe_live.py 로 캡처한 실제 API 응답을 (수정된 파서로) 재파싱해서 Supabase 재업로드.

사용:
  python -m src.reupload_from_probe <probe_json_path>

예:
  python -m src.reupload_from_probe debug/probe_20260424_123459/0211_POST_200_FW_cmmn_budgetList.do.json

사이트 재접속 없이 로컬 파일만으로 업로드. API 호출 순서 원칙 준수
(파일은 사용자가 실제 UI 클릭으로 받은 응답).
"""
from __future__ import annotations
import json
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from .config import Env
from .scrape import BudgetRow, BudgetSnapshot
from .uploader import upload_snapshot


def main():
    if len(sys.argv) < 2:
        print("사용: python -m src.reupload_from_probe <probe_budgetList_json>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"✗ 파일 없음: {path}")
        sys.exit(1)

    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("url", "").endswith("budgetList.do"):
        response = data["response_body"]
    else:
        print(f"⚠ budgetList.do 응답이 아닙니다: {data.get('url')}")
        sys.exit(1)

    if not isinstance(response, list):
        print(f"✗ response_body 형식 이상: type={type(response).__name__}")
        sys.exit(1)

    print(f"[reupload] 로드 {len(response)}건 from {path.name}")
    accounts = [BudgetRow.from_json(obj) for obj in response]

    # 파싱 결과 미리보기
    for a in accounts:
        print(f"  - {a.acctCode} {a.acctName}: 편성={a.baseAmt:,} 저장={a.sinBdget:,} 처리중={a.misBdget:,} 완료={a.nonBdget:,} 잔여={a.rstAmt:,}")

    # 편성 0 전부인 더미 제외 (uploader 내부에서도 하지만 미리 확인)
    real = [a for a in accounts if not (a.baseAmt == 0 and a.sinBdget == 0 and a.misBdget == 0 and a.nonBdget == 0)]
    print(f"\n실데이터 {len(real)}건 업로드 대상 (편성 0 전부 더미 제외)")
    if not real:
        print("✗ 업로드 대상 0건 — 파싱 결과가 여전히 빈값입니다. 파서 점검 필요.")
        sys.exit(1)

    # request_body 에서 period_ym 추출 (예: toDate=202604)
    req = data.get("request_body") or {}
    period_ym = req.get("toDate") if isinstance(req, dict) else None
    dept_cd = req.get("deptCd") if isinstance(req, dict) else None

    if not period_ym:
        period_ym = datetime.now().strftime("%Y%m")
    if not dept_cd:
        dept_cd = Env.DEPT_CD

    snap = BudgetSnapshot(
        captured_at=datetime.now().isoformat(),
        dept_cd=dept_cd,
        period_ym=period_ym,
        accounts=accounts,
        transactions=[],   # 이번 probe 에는 거래 이력 미포함
    )

    target_team = Env.TARGET_TEAM
    print(f"\n업로드: dept={dept_cd} period={period_ym} team={target_team}")
    snapshot_id = upload_snapshot(snap, team=target_team)
    print(f"✓ Supabase 업로드 완료 · snapshot_id={snapshot_id}")
    print("  (거래 이력은 다음 정상 스크래핑 때 복구 예정)")


if __name__ == "__main__":
    main()
