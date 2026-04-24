"""
Phase 3 — 텔레그램 봇에서 OTP(6자리) 수신 대기.

보안:
  - login_initiated_at 이후 메시지만 유효 (옛 OTP 재사용 방지)
  - SENDER_FILTER 설정 시 본문에 해당 번호 포함된 메시지만 OTP 추출
    (OTP 스푸핑 방지 — 공격자가 텔레그램 방에 가짜 6자리 숫자 흘려보내도 무시)
  - 로그에는 "수신 성공/실패"만. OTP 숫자 자체는 출력·파일에 기록 금지.
"""
from __future__ import annotations
import asyncio
import json
import re
import time
from typing import Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .config import Env

OTP_REGEX = re.compile(r"\b(\d{6})\b")


def _api(method: str, **params) -> dict:
    token = Env.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urlencode(params).encode()
    req = Request(url, data=data)
    with urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def _matches_sender(text: str) -> bool:
    """SENDER_FILTER가 설정돼 있으면 본문에 해당 번호가 포함돼야만 OTP 후보로 인정."""
    filt = Env.SENDER_FILTER.strip()
    if not filt:
        return True
    # 공백/하이픈 제거 후 검사
    normalized = re.sub(r"[\s\-]", "", text)
    target = re.sub(r"[\s\-]", "", filt)
    return target in normalized


async def wait_for_otp(login_initiated_at: float,
                      poll_interval: Optional[int] = None,
                      timeout: Optional[int] = None) -> str:
    """
    Returns: 6자리 OTP (문자열)
    Raises: TimeoutError
    """
    Env.require("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID")
    poll_interval = poll_interval or Env.OTP_POLL_INTERVAL
    timeout = timeout or Env.OTP_POLL_TIMEOUT
    chat_id = str(Env.TELEGRAM_CHAT_ID)
    deadline = time.time() + timeout
    # offset=0 으로 시작 — date 기반 필터(login_initiated_at 이후)만 믿는다.
    # 이전에는 시작 시점에 offset을 최신으로 당겼는데, 그러면 "방금 도착한 OTP"도 소진돼 못 받음.
    offset = 0

    print(f"[otp] 텔레그램 대기 중 (최대 {timeout}s, 발신필터={'on' if Env.SENDER_FILTER else 'off'})")

    seen_samples: list[str] = []  # 디버그: 스킵된 메시지 샘플 (민감정보는 찍지 않음, 길이/스킵사유만)

    while time.time() < deadline:
        try:
            resp = _api("getUpdates", offset=offset, timeout=poll_interval)
            if resp.get("ok"):
                for upd in resp.get("result", []):
                    offset = max(offset, upd["update_id"] + 1)
                    msg = upd.get("message") or upd.get("channel_post") or {}
                    date = msg.get("date", 0)
                    chat = str((msg.get("chat") or {}).get("id", ""))
                    text = msg.get("text", "") or msg.get("caption", "") or ""

                    if chat != chat_id:
                        seen_samples.append(f"chat_mismatch(date={date})")
                        continue
                    if date < login_initiated_at - 5:  # 5초 여유 (시계 오차 대비)
                        seen_samples.append(f"too_old(date={date}, start={int(login_initiated_at)})")
                        continue
                    if not _matches_sender(text):
                        seen_samples.append(f"sender_mismatch(len={len(text)})")
                        continue
                    matches = OTP_REGEX.findall(text)
                    if matches:
                        print("[otp] ✓ 수신")
                        return matches[-1]
                    else:
                        seen_samples.append(f"no_6digit(len={len(text)})")
        except Exception as e:
            print(f"[otp] 폴링 재시도: {type(e).__name__}")

        await asyncio.sleep(poll_interval)

    if seen_samples:
        print(f"[otp] 놓친 메시지들({len(seen_samples)}): {seen_samples[-5:]}")
    raise TimeoutError(f"OTP {timeout}초 내 수신 실패")
