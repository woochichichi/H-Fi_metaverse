"""거래 0건인 빈 2분기 snapshot 정리 — 프론트가 빈 데이터 보는 것 방지.

토큰·프로젝트 ref 는 환경변수에서만 읽음.
"""
import json, os, sys, urllib.request
from pathlib import Path
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT.parent.parent / ".env.local")

TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
SUPA_URL = os.environ.get("SUPABASE_URL", "")
if not TOKEN or not SUPA_URL:
    print("✗ SUPABASE_ACCESS_TOKEN / SUPABASE_URL 환경변수 필요", file=sys.stderr)
    sys.exit(2)
PROJECT_REF = SUPA_URL.replace("https://", "").split(".", 1)[0]
URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def q(sql):
    req = urllib.request.Request(URL, data=json.dumps({"query": sql}).encode("utf-8"),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "curl/8"})
    return json.loads(urllib.request.urlopen(req).read().decode("utf-8"))

# 거래 0건 snapshot 찾아서 삭제 (최근 1시간 내 올라간 것 중)
print("=== 최근 2분기 snapshot + 거래 수 ===")
rows = q("""SELECT s.id, s.captured_at, s.period_ym, COUNT(t.slip_no) as tx_count
            FROM corp_card_snapshots s LEFT JOIN corp_card_transactions t ON t.snapshot_id = s.id
            WHERE s.team = '증권ITO' AND s.period_ym = '202604'
            GROUP BY s.id, s.captured_at, s.period_ym
            ORDER BY s.captured_at DESC LIMIT 10""")
for r in rows:
    mark = " [EMPTY]" if r['tx_count'] == 0 else ""
    print(f"  {r['captured_at']}  period={r['period_ym']}  거래={r['tx_count']}{mark}  id={r['id'][:8]}")

# 거래 0건인 것만 삭제 (FK CASCADE 로 accounts 도 같이 삭제)
deleted = q("""DELETE FROM corp_card_snapshots
               WHERE team = '증권ITO' AND period_ym = '202604'
               AND id IN (
                 SELECT s.id FROM corp_card_snapshots s
                 LEFT JOIN corp_card_transactions t ON t.snapshot_id = s.id
                 WHERE s.team = '증권ITO' AND s.period_ym = '202604'
                 GROUP BY s.id HAVING COUNT(t.slip_no) = 0
               )
               RETURNING id""")
print(f"\n삭제됨: {len(deleted)}건")
for r in deleted:
    print(f"  - {r['id']}")
