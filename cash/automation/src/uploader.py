"""
Supabase 업로드 — 수집 직후 main.py에서 호출.

동작:
  1. corp_card_snapshots INSERT (1행) → snapshot_id 회수
  2. corp_card_accounts INSERT (N행, bulk)
  3. corp_card_transactions INSERT (M행, bulk)

인증: service_role 키 (RLS 우회). .env에만 존재.
프론트(anon key)는 INSERT 불가, SELECT만 같은 팀 스냅샷에 대해 가능.
"""
from __future__ import annotations
import json
from typing import Any
import requests

from .config import Env
from .scrape import BudgetSnapshot
from .card_expense import CardExpenseSnapshot


def _service_headers() -> dict:
    Env.require("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    key = Env.SUPABASE_SERVICE_ROLE_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _supabase_url() -> str:
    return Env.SUPABASE_URL.rstrip("/")


def _post(path: str, payload: Any) -> list[dict]:
    url = f"{_supabase_url()}/rest/v1/{path}"
    r = requests.post(url, headers=_service_headers(), data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase {path} {r.status_code}: {r.text[:300]}")
    try:
        return r.json()
    except Exception:
        return []


def _coerce_date(s: str | None) -> str | None:
    """2026/04/07 또는 2026-04-07 → YYYY-MM-DD. 빈값/이상치면 None."""
    if not s:
        return None
    s = s.replace("/", "-")
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    return None


def upload_snapshot(snap: BudgetSnapshot, team: str) -> str:
    """Returns: snapshot_id"""
    # 1. snapshot row
    snap_rows = _post("corp_card_snapshots", {
        "captured_at": snap.captured_at,
        "period_ym": snap.period_ym,
        "dept_cd": snap.dept_cd,
        "team": team,
    })
    if not snap_rows:
        raise RuntimeError("snapshot INSERT 응답이 비어 있음")
    snapshot_id = snap_rows[0]["id"]

    # 2. accounts — 편성 0인 더미 행은 제외
    account_rows = []
    for a in snap.accounts:
        if a.baseAmt == 0 and a.sinBdget == 0 and a.misBdget == 0 and a.nonBdget == 0:
            continue
        account_rows.append({
            "snapshot_id": snapshot_id,
            "acct_code": a.acctCode,
            "acct_name": a.acctName,
            "base_amt": a.baseAmt,
            "sin_bdget": a.sinBdget,
            "mis_bdget": a.misBdget,
            "non_bdget": a.nonBdget,
            "rst_amt": a.rstAmt,
        })
    if account_rows:
        _post("corp_card_accounts", account_rows)

    # 3. transactions
    tx_rows = []
    for t in snap.transactions:
        tx_rows.append({
            "snapshot_id": snapshot_id,
            "slip_no": t.slipNo or None,
            "rtn_type": t.rtnType or None,
            "acct_code": t.acctCode or None,
            "add_date": _coerce_date(t.addDate),
            "posting_date": _coerce_date(t.postingDate),
            "user_nm": t.userNm or None,
            "real_user_name": t.realUserName or None,
            "store_name": t.storeName or None,
            "t_text": t.tText or None,
            "status_nm": t.statusNm or None,
            "blart_nm": t.blartNm or None,
            "belnr": t.belnr or None,
            "amount": t.amount,
        })
    if tx_rows:
        # 배치 인서트 (500개 단위)
        for i in range(0, len(tx_rows), 500):
            _post("corp_card_transactions", tx_rows[i:i + 500])

    return snapshot_id


def upload_card_pending(snap: CardExpenseSnapshot, team: str) -> int:
    """본인 카드 원본 업로드. Returns: 저장된 건수."""
    if not snap.rows:
        # 0건이어도 "이 시점에 조회했는데 없었음"을 남기고 싶으면 placeholder 가능.
        # 지금은 0건이면 INSERT 생략 (대시보드는 최신 captured_at 기준으로 조회).
        return 0

    rows = []
    for r in snap.rows:
        # cardNoMasked 에서 뒤 4자리만 추출
        import re
        m = re.search(r"(\d{4})\s*$", r.cardNoMasked)
        last4 = m.group(1) if m else ""
        rows.append({
            "captured_at": snap.captured_at,
            "emp_no": snap.emp_no,
            "team": team,
            "date_from": snap.date_from,
            "date_to": snap.date_to,
            "status_filter": snap.status_filter,
            "add_date": _coerce_date(r.addDate),
            "card_last4": last4 or None,
            "store_name": r.storeName or None,
            "amount": r.amount,
            "appr_no": r.apprNo or None,
            "status_nm": r.statusNm or None,
        })
    _post("corp_card_personal_pending", rows)
    return len(rows)
