"""
텔레그램 OTP 발송만 수행 — phone_code_hash 를 .tg_auth_tmp.json 에 저장.

사용:
  python -m src.tg_send_code

이후 사용자가 받은 OTP 로 tg_signin.py 실행.
"""
from __future__ import annotations
import sys
import json
import asyncio
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from pyrogram.client import Client
from .config import Env


TMP_FILE = Path(__file__).resolve().parent.parent / ".tg_auth_tmp.json"


async def main():
    Env.require("TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_PHONE")

    app = Client(
        name="hwiki_cash",
        api_id=int(Env.TELEGRAM_API_ID),
        api_hash=Env.TELEGRAM_API_HASH,
        phone_number=Env.TELEGRAM_PHONE,
        workdir=str(Env.ROOT),
    )

    print(f"전화번호: {Env.TELEGRAM_PHONE}")
    print("OTP 발송 중...")

    await app.connect()
    try:
        sent = await app.send_code(Env.TELEGRAM_PHONE)
        TMP_FILE.write_text(json.dumps({
            "phone_code_hash": sent.phone_code_hash,
            "type": str(sent.type) if hasattr(sent, "type") else "",
        }), encoding="utf-8")
        print(f"✓ OTP 발송 완료 — 텔레그램 앱에서 6자리 코드 확인하세요")
        print(f"  phone_code_hash 저장: {TMP_FILE.name}")
    finally:
        await app.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
