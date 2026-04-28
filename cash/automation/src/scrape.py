"""
Phase 5 — 통제예산조회 데이터 수집.

원칙 (사용자 확정):
  "실제 UI 버튼을 눌렀을 때와 동일한 API 호출 순서"
  → 직접 URL 치기 X. 버튼이 유발하는 Pop + List 연쇄를 그대로 재현.

수집 순서 (실제 사용자 클릭 타임라인과 동일):
  1. 회계관리 아이콘 클릭          — UI
  2. 통제예산조회 메뉴 클릭         — UI (budgetListPop.do 자동 발생)
  3. dialog 안의 "조회" 버튼 클릭   — UI (budgetList.do → 4행)
  4. 각 계정 × 각 rtnType (SIN/MIS/NON) = 최대 12회:
       - budgetHistListPop.do     — fetch (isAuth 등 부가 키 포함)
       - 50~120ms 간격
       - budgetHistList.do        — fetch (본 데이터)
     = 돋보기 1회 클릭이 일으키는 연쇄를 그대로 재생

각 rtnType 사이 human_delay(2~4s) — 봇 탐지 시그널 최소화.
"""
from __future__ import annotations
import asyncio
import json
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional
from playwright.async_api import Page, Response, Locator

KST = timezone(timedelta(hours=9))

from .config import load_selectors, Env
from .stealth import human_delay

SEL = load_selectors()
BUDGET_LIST_PATH = "/FW/cmmn/budgetList.do"
BUDGET_HIST_POP_PATH = "/FW/cmmn/budgetHistListPop.do"
BUDGET_HIST_PATH = "/FW/cmmn/budgetHistList.do"

# 한 행의 "저장/처리중/처리완료" 돋보기가 화면 좌우로 배치.
# rtnType 순서대로 클릭하기 위한 컬럼 식별자.
RTN_TYPES = [
    ("SIN", "저장금액(B)"),
    ("MIS", "처리중금액(C)"),
    ("NON", "처리완료금액(D)"),
]


@dataclass
class BudgetRow:
    """budgetList.do 응답의 한 행 — 계정 1개."""
    acctCode: str
    acctName: str
    baseAmt: int          # 편성예산(A)
    sinBdget: int         # 저장(B)
    misBdget: int         # 처리중(C)
    nonBdget: int         # 완료(D)
    rstAmt: int           # 잔여
    raw: dict = field(default_factory=dict)

    @staticmethod
    def from_json(obj: dict) -> "BudgetRow":
        def _i(v):
            # API 가 소수점 포함 문자열 반환(예: "5835815.000") → float 거쳐 int.
            try:
                s = str(v).replace(",", "").strip()
                if not s: return 0
                return int(float(s))
            except Exception:
                return 0
        return BudgetRow(
            acctCode=obj.get("acctCode", ""),
            acctName=obj.get("acctName", ""),
            baseAmt=_i(obj.get("baseAmt")),
            sinBdget=_i(obj.get("sinBdget")),
            misBdget=_i(obj.get("misBdget")),
            nonBdget=_i(obj.get("nonBdget")),
            rstAmt=_i(obj.get("rstAmt")),
            raw=obj,
        )


@dataclass
class BudgetHistRow:
    """budgetHistList.do 응답의 한 거래."""
    slipNo: str           # EA관리번호 (XP...)
    slipTypenm: str       # EA유형 (법인카드)
    addDate: str
    postingDate: str
    userNm: str           # 작성자
    storeName: str        # 지급처
    realUserName: str     # 실사용자
    tText: str            # 적요
    statusNm: str         # 처리상태 텍스트
    acctCode: str
    blartNm: str          # 관리항목
    belnr: str            # 전표번호
    amount: int           # realTAmt
    rtnType: str = ""     # SIN/MIS/NON — 어느 컬럼 돋보기에서 나왔는지
    raw: dict = field(default_factory=dict)

    @staticmethod
    def from_json(obj: dict, rtn_type: str = "") -> "BudgetHistRow":
        def _i(v):
            try:
                s = str(v).replace(",", "").strip()
                if not s: return 0
                return int(float(s))
            except Exception:
                return 0
        return BudgetHistRow(
            slipNo=obj.get("slipNo") or "",
            slipTypenm=obj.get("slipTypenm") or "",
            addDate=obj.get("addDate") or "",
            postingDate=obj.get("postingDate") or "",
            userNm=obj.get("userNm") or "",
            storeName=obj.get("storeName") or "",
            realUserName=obj.get("realUserName") or "",
            tText=obj.get("tText") or "",
            statusNm=obj.get("statusNm") or "",
            acctCode=obj.get("acctCode") or "",
            blartNm=obj.get("blartNm") or "",
            belnr=obj.get("belnr") or "",
            amount=_i(obj.get("realTAmt")),
            rtnType=rtn_type,
            raw=obj,
        )


@dataclass
class BudgetSnapshot:
    captured_at: str
    dept_cd: str
    period_ym: str
    accounts: list[BudgetRow]
    transactions: list[BudgetHistRow]


class ResponseWaiter:
    """
    특정 URL 경로의 JSON 응답을 asyncio.Future로 대기.
    클릭 전에 대기를 걸어두고, 클릭 후 응답 한 건을 받으면 완료.
    """
    def __init__(self, page: Page, path_substr: str):
        self.page = page
        self.path_substr = path_substr
        self._future: Optional[asyncio.Future] = None

    def arm(self) -> None:
        loop = asyncio.get_event_loop()
        self._future = loop.create_future()

        async def handler(resp: Response):
            if self._future and not self._future.done() and self.path_substr in resp.url and resp.status == 200:
                try:
                    data = await resp.json()
                    self._future.set_result(data)
                except Exception as e:
                    self._future.set_exception(e)

        self._handler = lambda resp: asyncio.create_task(handler(resp))
        self.page.on("response", self._handler)

    async def wait(self, timeout: float = 15.0):
        try:
            return await asyncio.wait_for(self._future, timeout=timeout)
        finally:
            try:
                self.page.remove_listener("response", self._handler)
            except Exception:
                pass


async def _enter_budget_menu(erp_page: Page) -> None:
    """회계관리 → 통제예산조회 메뉴 진입. 이미 활성이면 스킵 (탭 중복 방지)."""
    cfg = SEL["budget_query"]
    # 이미 통제예산조회 dialog 가 떠있고 '조회' 버튼이 visible 이면 재진입 스킵.
    try:
        search_btn_name = cfg["search_btn_name"]
        dlg = erp_page.get_by_role("dialog").get_by_role("button", name=search_btn_name)
        if await dlg.count() > 0 and await dlg.first.is_visible():
            print("[scrape] 통제예산조회 이미 활성 — 메뉴 재진입 스킵")
            return
    except Exception:
        pass

    print("[scrape] 회계관리 메뉴")
    await erp_page.get_by_role("img", name=cfg["accounting_menu_img_alt"]).click()
    await human_delay(1.5, 2.5)

    print("[scrape] 통제예산조회 메뉴")
    await erp_page.get_by_role("button", name=cfg["menu_btn_name"]).click()
    await human_delay(2.0, 3.5)


async def _click_search(erp_page: Page) -> list[dict]:
    """dialog 안의 조회 버튼 클릭 + budgetList.do 응답 캡처."""
    cfg = SEL["budget_query"]
    waiter = ResponseWaiter(erp_page, BUDGET_LIST_PATH)
    waiter.arm()
    print("[scrape] 조회 버튼 클릭")
    # dialog 안에 '조회' 라벨 버튼이 2개(기본+툴바 등) 매칭되는 경우 — 첫 번째 사용.
    await erp_page.get_by_role("dialog").get_by_role("button", name=cfg["search_btn_name"]).first.click()
    data = await waiter.wait(timeout=20.0)
    await human_delay(1.5, 3.0)
    return data if isinstance(data, list) else []


def _magnifier_positions(row_index: int) -> list[tuple[int, int, str]]:
    """
    row_index(0-based) 의 돋보기 3개 (SIN/MIS/NON) 좌표 반환.

    WARNING: 이 함수는 실패 대비 폴백용. 1차 시도는 본문에서 API 직접 응답 캡처로 처리.
    좌표는 config/selectors.yaml의 grid 값에서 가져와야 하지만, 현재는 API 방식을
    우선 쓰므로 좌표는 사용하지 않는다.
    """
    # 현재는 좌표 기반 클릭을 제거. API가 쿠키·세션으로 직접 호출 가능하면 그렇게.
    return []


async def _trigger_hist_api(erp_page: Page, dept_cd: str, period_ym: str,
                            acct_code: str, rtn_type: str) -> list[dict]:
    """
    돋보기 클릭과 동일한 API 연쇄를 같은 세션에서 재현한다.

    사용자 원칙: "실제 버튼 눌렀을 때와 동일한 API 호출 순서"
    → 3차 프로빙 타임라인:
         ① POST budgetHistListPop.do  (사전: 권한/토큰 발급, body에 isAuth + menulink 포함)
         ② POST budgetHistList.do     (본조회: 같은 yymm/acctCode/rtnType)
       두 호출 사이 ~15~70ms 간격. 여기서는 50~120ms로 두되 사람처럼 살짝 흔듦.

    주의: isAuth 값은 프로빙에서 마스킹 저장했지만 실제로는 브라우저 쿠키/세션으로
          재현되는 값. 원본 페이지에서 popup이 발급한 토큰을 그대로 재사용.
    """
    import random
    host = SEL["api"]["host"]

    # Budget 분기 — period_ym 끝 월로 Q1(1)~Q4(4) 판단
    month = int(period_ym[4:6])
    quarter = (month - 1) // 3 + 1

    # List 요청 (JSON) — 조회 조건 실데이터
    common = {
        "yymm": period_ym[:4],
        "rtnType": rtn_type,
        "zuonr": dept_cd,
        "acctCode": acct_code,
        "budgetGbn": str(quarter),   # 1/2/3/4 분기
        "accountflag": "Y",
        "toDate": period_ym,
    }

    # Pop 요청 (form-urlencoded) — probe 로 확인된 실제 포맷.
    # 최소 payload: isAuth/menulink/prtmenuseq. JSON 으로 보내면 400.
    pop_form = {
        "isAuth": "true",
        "menulink": "/cmmn/budgetHistListPop.do",
        "prtmenuseq": "MN3",
    }

    result = await erp_page.evaluate(
        """async ({host, popPath, listPath, popForm, listBody, gapMs}) => {
            // Pop: form-urlencoded (실제 브라우저 동작과 동일)
            const popParams = new URLSearchParams();
            for (const [k, v] of Object.entries(popForm)) popParams.set(k, v);
            const pop = await fetch(host + popPath, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                body: popParams.toString()
            });
            await new Promise(r => setTimeout(r, gapMs));
            // List: JSON
            const list = await fetch(host + listPath, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                body: JSON.stringify(listBody)
            });
            const listText = await list.text();
            let listData = null;
            try { listData = JSON.parse(listText); } catch(e) {}
            return {
                popOk: pop.ok, popStatus: pop.status,
                listOk: list.ok, listStatus: list.status,
                data: listData,
                listTextHead: listData ? null : listText.slice(0, 300)
            };
        }""",
        {
            "host": host,
            "popPath": BUDGET_HIST_POP_PATH,
            "listPath": BUDGET_HIST_PATH,
            "popForm": pop_form,
            "listBody": common,
            "gapMs": random.randint(50, 120),
        },
    )
    # Pop 은 서버 상태 준비 호출로 추정 — 400 이어도 List 가 성공하는 경우 있음.
    # List 결과가 핵심이므로 List 상태만 엄격히 판정.
    if not result.get("popOk"):
        print(f"  [warn] Pop status={result.get('popStatus')} — List 로 직접 시도")
    if not result.get("listOk"):
        raise RuntimeError(
            f"budgetHistList 실패: status={result.get('listStatus')} "
            f"head={result.get('listTextHead')}"
        )
    return result.get("data") or []


async def collect_snapshot(erp_page: Page, *, dept_cd: str = "M110301",
                           period_ym: Optional[str] = None) -> BudgetSnapshot:
    """전체 수집: 메뉴 진입 → 조회 → 행별 SIN/MIS/NON 상세."""
    if period_ym is None:
        period_ym = datetime.now().strftime("%Y%m")

    await _enter_budget_menu(erp_page)
    rows_json = await _click_search(erp_page)
    accounts = [BudgetRow.from_json(r) for r in rows_json]
    print(f"[scrape] 계정 {len(accounts)}개 수집")

    transactions: list[BudgetHistRow] = []
    for acct in accounts:
        if acct.baseAmt == 0 and acct.sinBdget == 0 and acct.misBdget == 0 and acct.nonBdget == 0:
            continue  # 편성 0이면 상세도 없음
        for rtn, label in RTN_TYPES:
            await human_delay(2.0, 4.0)   # 봇 탐지 회피
            try:
                hist = await _trigger_hist_api(erp_page, dept_cd, period_ym, acct.acctCode, rtn)
            except Exception as e:
                print(f"[scrape] ⚠ {acct.acctCode}/{rtn} 실패: {e}")
                continue
            count = len(hist) if isinstance(hist, list) else 0
            print(f"[scrape]   {acct.acctCode} {label}: {count}건")
            if isinstance(hist, list):
                for item in hist:
                    transactions.append(BudgetHistRow.from_json(item, rtn))

    return BudgetSnapshot(
        captured_at=datetime.now(KST).isoformat(),
        dept_cd=dept_cd,
        period_ym=period_ym,
        accounts=accounts,
        transactions=transactions,
    )


def save_snapshot(snapshot: BudgetSnapshot, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"budget_{snapshot.dept_cd}_{snapshot.period_ym}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    path = out_dir / fname
    payload = {
        "captured_at": snapshot.captured_at,
        "dept_cd": snapshot.dept_cd,
        "period_ym": snapshot.period_ym,
        "accounts": [asdict(a) for a in snapshot.accounts],
        "transactions": [asdict(t) for t in snapshot.transactions],
    }
    # raw 필드는 내부 디버깅용 — 저장 시 제외
    for a in payload["accounts"]:
        a.pop("raw", None)
    for t in payload["transactions"]:
        t.pop("raw", None)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path
