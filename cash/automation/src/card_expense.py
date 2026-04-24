"""
Phase 5-b — 본인 법인카드 원본 승인내역 수집.

용도:
  통제예산조회(EA 기반)는 팀 전체 데이터지만 '팀원이 EA 등록한 후'에만 보인다.
  카드 원본은 승인 즉시 내려온다 — 단, 서버 정책상 empNo = 본인 사번만 조회 가능.
  따라서 본인 것만 수집한다.

호출 순서 (사용자 원칙: "버튼 눌렀을 때와 동일한 API 순서"):
  ① POST corporationCardExpense.do       — 메뉴 진입 (menuseq=MN3)
  ② POST corporationCardExpenseList.do   — 본조회 (empNo·기간 등)

status 필터:
  "01" = 미처리 (EA 아직 안 올린 것) — 실시간성 핵심
  "" 또는 다른 값 = 전체 — 필요 시 수집
"""
from __future__ import annotations
import asyncio
import json
import random
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from playwright.async_api import Page

from .config import load_selectors, Env

SEL = load_selectors()
MENU_OPEN_PATH = "/FW/account/corporationCardExpense.do"
CARD_LIST_PATH = "/FW/account/corporationCardExpenseList.do"


@dataclass
class CardExpenseRow:
    """corporationCardExpenseList.do 응답의 한 건 — 카드 승인 원본."""
    addDate: str                   # 등록일자 (승인일)
    cardNoMasked: str              # 카드번호 — 뒤 4자리만 보이도록 마스킹된 값
    storeName: str                 # 가맹점
    amount: int                    # 승인금액
    statusNm: str = ""             # 처리상태 (미처리/처리중/완료)
    empNo: str = ""                # 사번 (본인만)
    userNm: str = ""               # 이름
    apprNo: str = ""               # 승인번호
    raw: dict = field(default_factory=dict)

    @staticmethod
    def from_json(obj: dict) -> "CardExpenseRow":
        def _i(v):
            try: return int(str(v).replace(",", "").strip() or 0)
            except: return 0
        # 응답 스키마는 프로빙 시 0건이라 미확인.
        # 실행 시 실제 필드명으로 보강 필요. 여기서는 추정 기반 + raw 보존.
        card_no = obj.get("cardNo") or obj.get("cardNum") or ""
        return CardExpenseRow(
            addDate=obj.get("addDate") or obj.get("apprDate") or "",
            cardNoMasked=_mask_card(card_no),
            storeName=obj.get("storeName") or obj.get("merchantName") or "",
            amount=_i(obj.get("amount") or obj.get("apprAmt") or obj.get("realTAmt")),
            statusNm=obj.get("statusNm") or "",
            empNo=obj.get("empNo") or "",
            userNm=obj.get("userNm") or "",
            apprNo=obj.get("apprNo") or "",
            raw=obj,
        )


def _mask_card(card_no: str) -> str:
    """카드번호를 '**** **** **** 1234' 형태로 마스킹. 보안 필수."""
    if not card_no:
        return ""
    digits = re.sub(r"\D", "", card_no)
    if len(digits) < 4:
        return "****"
    return "**** **** **** " + digits[-4:]


@dataclass
class CardExpenseSnapshot:
    captured_at: str
    emp_no: str
    date_from: str                 # YYYY-MM-DD
    date_to: str
    status_filter: str
    rows: list[CardExpenseRow]


async def _open_menu(erp_page: Page) -> None:
    """메뉴 진입 호출 — 본조회 전 선행."""
    host = SEL["api"]["host"]
    result = await erp_page.evaluate(
        """async ({host, path}) => {
            const r = await fetch(host + path, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                body: JSON.stringify({menuseq: "MN3"})
            });
            return {ok: r.ok, status: r.status};
        }""",
        {"host": host, "path": MENU_OPEN_PATH},
    )
    if not result.get("ok"):
        raise RuntimeError(f"카드메뉴 진입 실패: status={result.get('status')}")


async def _fetch_list(erp_page: Page, emp_no: str, date_from: str, date_to: str,
                      status: str = "01") -> list[dict]:
    host = SEL["api"]["host"]
    body = {
        "empNo": emp_no,
        "status": status,
        "cardNo": " ",
        "apprNo": "",
        "addDateStart": date_from,
        "addDateEnd": date_to,
        "aiYn": "on",
        "useType": " ",
    }
    result = await erp_page.evaluate(
        """async ({host, path, body}) => {
            const r = await fetch(host + path, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                body: JSON.stringify(body)
            });
            const text = await r.text();
            try { return {ok: r.ok, status: r.status, data: JSON.parse(text)}; }
            catch(e) { return {ok: r.ok, status: r.status, data: null, text: text.slice(0, 300)}; }
        }""",
        {"host": host, "path": CARD_LIST_PATH, "body": body},
    )
    if not result.get("ok"):
        raise RuntimeError(
            f"카드원본 조회 실패: status={result.get('status')} head={result.get('text')}"
        )
    return result.get("data") or []


async def collect_card_expense(erp_page: Page, *, emp_no: str,
                               date_from: str | None = None,
                               date_to: str | None = None,
                               status: str = "01",
                               days_back: int = 60) -> CardExpenseSnapshot:
    """
    본인 카드 원본 수집. 기본: 오늘 기준 60일 전 ~ 오늘, status=01(미처리).

    사용자 원칙 준수:
      - empNo는 호출자(env)에서 주입된 본인 사번만 사용. 다른 사번 값 금지.
    """
    if not emp_no:
        raise ValueError("EMP_NO 미설정 (.env 확인)")

    today = datetime.now().date()
    if not date_to:
        date_to = today.strftime("%Y-%m-%d")
    if not date_from:
        date_from = (today - timedelta(days=days_back)).strftime("%Y-%m-%d")

    print(f"[card] 메뉴 진입")
    await _open_menu(erp_page)

    # 사람 클릭 간격 재현: 녹화에서 진입 → 조회 사이 ~2.6s
    await asyncio.sleep(random.uniform(2.0, 3.5))

    print(f"[card] 조회 {date_from} ~ {date_to} (empNo={emp_no}, status={status or '전체'})")
    rows_json = await _fetch_list(erp_page, emp_no, date_from, date_to, status)
    count = len(rows_json) if isinstance(rows_json, list) else 0
    print(f"[card]   {count}건 수집")

    rows = [CardExpenseRow.from_json(r) for r in (rows_json or [])]
    return CardExpenseSnapshot(
        captured_at=datetime.now().isoformat(),
        emp_no=emp_no,
        date_from=date_from,
        date_to=date_to,
        status_filter=status,
        rows=rows,
    )


def save_card_snapshot(snap: CardExpenseSnapshot, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"card_{snap.emp_no}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    path = out_dir / fname
    payload = {
        "captured_at": snap.captured_at,
        "emp_no": snap.emp_no,
        "date_from": snap.date_from,
        "date_to": snap.date_to,
        "status_filter": snap.status_filter,
        "count": len(snap.rows),
        "rows": [asdict(r) for r in snap.rows],
    }
    for r in payload["rows"]:
        r.pop("raw", None)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path
