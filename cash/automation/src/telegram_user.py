"""
Phase 3 — MTProto User API (pyrogram) 기반 OTP 수신.

기존 telegram_otp.py(Bot API) 대체:
  - Bot API의 "자기 메시지 못 봄" 제약 우회
  - 사용자 계정이 그룹 멤버이므로 봇이 보낸 SMS 포워딩도 그대로 읽음

세션:
  - 최초 1회 src/tg_login.py 로 생성 (hwiki_cash.session)
  - 이후 자동 재사용
"""
from __future__ import annotations
import asyncio
import re
import time
from typing import Optional
from pyrogram.client import Client

from .config import Env

OTP_REGEX = re.compile(r"\b(\d{6})\b")


def _matches_sender(text: str) -> bool:
    """SENDER_FILTER 에 설정된 번호가 본문에 포함돼야만 OTP 후보로 인정."""
    filt = Env.SENDER_FILTER.strip()
    if not filt:
        return True
    normalized = re.sub(r"[\s\-]", "", text or "")
    target = re.sub(r"[\s\-]", "", filt)
    return target in normalized


_client: Optional[Client] = None
_peers_loaded: bool = False


def _get_client() -> Client:
    """모듈 전역 Client — 프로세스 내 재사용."""
    global _client
    if _client is None:
        Env.require("TELEGRAM_API_ID", "TELEGRAM_API_HASH")
        _client = Client(
            name="hwiki_cash",
            api_id=int(Env.TELEGRAM_API_ID),
            api_hash=Env.TELEGRAM_API_HASH,
            # session 파일 위치: automation/ 루트
            workdir=str(Env.ROOT),
            # phone 은 세션 재사용 시 필요 없음 (세션 파일로 인증)
        )
    return _client


async def wait_for_otp(login_initiated_at: float,
                      poll_interval: Optional[int] = None,
                      timeout: Optional[int] = None) -> str:
    """
    텔레그램 SMS 포워딩 메시지에서 6자리 OTP 추출.

    login_initiated_at: time.time() — 이 시각 이후 메시지만 유효 (옛 OTP 재사용 방지)
    """
    poll_interval = poll_interval or Env.OTP_POLL_INTERVAL
    timeout = timeout or Env.OTP_POLL_TIMEOUT
    chat_id = int(Env.TELEGRAM_CHAT_ID)   # -5196639522 (그룹)

    deadline = time.time() + timeout
    app = _get_client()
    seen: list[str] = []

    print(f"[otp] 텔레그램 User API 대기 중 (최대 {timeout}s, chat_id={chat_id})")

    # Client 시작 — 세션 있으면 즉시, 없으면 에러 (tg_login.py 로 세션 먼저 생성해야)
    if not app.is_connected:
        try:
            await app.start()
        except Exception as e:
            raise RuntimeError(
                f"텔레그램 User API 로그인 실패 — 최초 1회 'python -m src.tg_login_wait' 실행 필요: {e}"
            )

    # 갓 생성된 세션은 peer 캐시가 비어 있어 get_chat_history(chat_id) 가 실패.
    # 프로세스 내 1회만 dialogs 순회해 peer 테이블 로드.
    global _peers_loaded
    if not _peers_loaded:
        count = 0
        async for _ in app.get_dialogs():
            count += 1
        print(f"[otp] peer 캐시 로드: {count} dialogs")
        _peers_loaded = True

    try:
        while time.time() < deadline:
            # 최근 15건 조회, login_initiated_at 이후 + 발신번호 매칭 + 6자리 OTP 추출
            async for msg in app.get_chat_history(chat_id, limit=15):
                msg_ts = msg.date.timestamp() if msg.date else 0
                if msg_ts < login_initiated_at - 5:
                    # 더 옛 메시지 — 멈춰서 다음 폴링 사이클
                    break
                text = msg.text or msg.caption or ""
                if not _matches_sender(text):
                    seen.append(f"sender_miss(len={len(text)})")
                    continue
                m = OTP_REGEX.search(text)
                if m:
                    print("[otp] ✓ 수신")
                    return m.group(1)
                seen.append(f"no_6digit(len={len(text)})")
            await asyncio.sleep(poll_interval)
    finally:
        # Client 는 프로세스 종료까지 유지. main.py 끝에서 정리.
        pass

    if seen:
        print(f"[otp] 놓친 메시지 {len(seen)}건: {seen[-5:]}")
    raise TimeoutError(f"OTP {timeout}초 내 수신 실패")


async def shutdown_client():
    """프로그램 종료 시 호출 — Client stop."""
    global _client
    if _client is not None and _client.is_connected:
        try:
            await _client.stop()
        except Exception:
            pass
        _client = None
