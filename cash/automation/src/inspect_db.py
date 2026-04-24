"""Supabase 실제 데이터 상태 진단 — 어느 snapshot 이 최신인지·계정 금액이 실제로 들어갔는지 확인.

토큰·프로젝트 ref 는 환경변수에서만 읽음 (루트 .env.local 에 SUPABASE_ACCESS_TOKEN,
automation/.env 에 SUPABASE_URL 필요).
"""
import json, os, sys, urllib.request
from pathlib import Path
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")
# 루트 .env.local (Management API 토큰 위치)
load_dotenv(_ROOT.parent.parent / ".env.local")

TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
SUPA_URL = os.environ.get("SUPABASE_URL", "")
if not TOKEN or not SUPA_URL:
    print("✗ SUPABASE_ACCESS_TOKEN / SUPABASE_URL 환경변수 필요 (.env / .env.local 확인)", file=sys.stderr)
    sys.exit(2)
PROJECT_REF = SUPA_URL.replace("https://", "").split(".", 1)[0]
URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def q(sql):
    req = urllib.request.Request(URL, data=json.dumps({"query": sql}).encode("utf-8"),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "curl/8"})
    try:
        return json.loads(urllib.request.urlopen(req).read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode("utf-8", errors="replace")[:500], file=sys.stderr)
        raise

print("=== snapshots (최신 10) ===")
for r in q("SELECT id, period_ym, captured_at, team, dept_cd FROM corp_card_snapshots ORDER BY captured_at DESC LIMIT 10"):
    print(f"  {r['captured_at']}  period={r['period_ym']}  team={r['team']}  id={r['id'][:8]}")

print("\n=== 가장 최신 snapshot 의 accounts ===")
rows = q("SELECT s.period_ym, s.captured_at, a.acct_code, a.acct_name, a.base_amt, a.sin_bdget, a.mis_bdget, a.non_bdget, a.rst_amt "
         "FROM corp_card_snapshots s JOIN corp_card_accounts a ON a.snapshot_id = s.id "
         "WHERE s.id = (SELECT id FROM corp_card_snapshots ORDER BY captured_at DESC LIMIT 1)")
for r in rows:
    print(f"  {r['acct_code']} {r['acct_name']:30s}  편성 {r['base_amt']:>12}  저장 {r['sin_bdget']:>10}  처리중 {r['mis_bdget']:>10}  완료 {r['non_bdget']:>10}  잔여 {r['rst_amt']:>10}")

print("\n=== 거래 건수 (최신 snapshot) ===")
cnt = q("SELECT COUNT(*) as c FROM corp_card_transactions WHERE snapshot_id = (SELECT id FROM corp_card_snapshots ORDER BY captured_at DESC LIMIT 1)")
print(f"  {cnt[0]['c']}건")
