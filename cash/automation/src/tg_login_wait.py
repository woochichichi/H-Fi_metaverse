"""
한 프로세스 내에서 send_code + sign_in 수행.
OTP/2FA 는 파일 폴링으로 외부에서 주입.

사용 흐름:
  1. (background) python -m src.tg_login_wait
  2. 사용자 텔레그램 앱에 코드 도착
  3. echo "12345" > .tg_otp.txt   (2FA 있으면 .tg_2fa.txt 도)
  4. 프로세스가 파일 읽고 sign_in → 세션 저장 → 종료
"""
from __future__ import annotations
import sys
import asyncio
import os
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pyrogram.utils as _pyro_utils
import pyrogram.client as _pyro_client

ROOT = Path(__file__).resolve().parent.parent
OTP_FILE = ROOT / ".tg_otp.txt"
PW_FILE = ROOT / ".tg_2fa.txt"
MAX_WAIT = 600  # 10분


async def _file_ainput(prompt: str = "") -> str:
    """pyrogram ainput 대체 — 파일 폴링으로 입력."""
    p = (prompt or "").lower()

    # 전화번호 확인 프롬프트
    if "correct" in p or "y/n" in p:
        print(f"[auto] {prompt.rstrip()} → y")
        return "y"

    # 코드 프롬프트
    if "code" in p and "password" not in p:
        target = OTP_FILE
        kind = "OTP"
    elif "password" in p:
        target = PW_FILE
        kind = "2FA_PASSWORD"
    else:
        raise RuntimeError(f"예상치 못한 프롬프트: {prompt!r}")

    print(f"[wait] {kind} 파일 대기 중: {target.name} (최대 {MAX_WAIT}s)")
    waited = 0
    while not target.exists():
        await asyncio.sleep(1)
        waited += 1
        if waited >= MAX_WAIT:
            raise TimeoutError(f"{kind} 파일 대기 타임아웃")
        if waited % 15 == 0:
            print(f"[wait] ... {waited}s 경과")

    content = target.read_text(encoding="utf-8").strip()
    try:
        target.unlink()
    except Exception:
        pass
    print(f"[wait] ✓ {kind} 읽음 (길이={len(content)})")
    return content


# monkey-patch
_pyro_utils.ainput = _file_ainput
_pyro_client.ainput = _file_ainput

from pyrogram.client import Client
from .config import Env


async def main():
    Env.require("TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_PHONE")

    # 기존 tmp/otp 파일 청소
    for f in [OTP_FILE, PW_FILE, ROOT / ".tg_auth_tmp.json"]:
        if f.exists():
            try:
                f.unlink()
                print(f"[init] {f.name} 삭제")
            except Exception:
                pass

    app = Client(
        name="hwiki_cash",
        api_id=int(Env.TELEGRAM_API_ID),
        api_hash=Env.TELEGRAM_API_HASH,
        phone_number=Env.TELEGRAM_PHONE,
        workdir=str(ROOT),
    )

    print("=" * 60)
    print(f"  텔레그램 비대화형 로그인 (파일 폴링)")
    print(f"  전화번호: {Env.TELEGRAM_PHONE}")
    print(f"  OTP 파일: {OTP_FILE.name}")
    print(f"  2FA 파일: {PW_FILE.name}")
    print("=" * 60)

    async with app:
        me = await app.get_me()
        print(f"\n✓ 로그인 성공 — {me.first_name} (@{me.username or 'N/A'}) · id={me.id}")
        print(f"  세션 파일: hwiki_cash.session")


if __name__ == "__main__":
    asyncio.run(main())
