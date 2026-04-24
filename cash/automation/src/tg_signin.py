"""
tg_send_code.py 실행 후, 받은 OTP 로 사인인.

사용:
  python -m src.tg_signin 123456
  python -m src.tg_signin 123456 "2FA-password"
"""
from __future__ import annotations
import sys
import json
import asyncio
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from pyrogram.client import Client
from pyrogram.errors import SessionPasswordNeeded
from .config import Env


TMP_FILE = Path(__file__).resolve().parent.parent / ".tg_auth_tmp.json"


async def main():
    if len(sys.argv) < 2:
        print("사용: python -m src.tg_signin <OTP> [2FA_password]")
        sys.exit(1)

    otp = sys.argv[1].strip()
    password = sys.argv[2] if len(sys.argv) >= 3 else None

    if not TMP_FILE.exists():
        print(f"✗ {TMP_FILE.name} 없음 — tg_send_code.py 먼저 실행 필요")
        sys.exit(1)

    data = json.loads(TMP_FILE.read_text(encoding="utf-8"))
    phone_code_hash = data["phone_code_hash"]

    Env.require("TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_PHONE")

    app = Client(
        name="hwiki_cash",
        api_id=int(Env.TELEGRAM_API_ID),
        api_hash=Env.TELEGRAM_API_HASH,
        phone_number=Env.TELEGRAM_PHONE,
        workdir=str(Env.ROOT),
    )

    await app.connect()
    try:
        try:
            user = await app.sign_in(Env.TELEGRAM_PHONE, phone_code_hash, otp)
            print(f"✓ 로그인 성공 (1단계) — {user.first_name} (id={user.id})")
        except SessionPasswordNeeded:
            if not password:
                print("✗ 2단계 인증 필요 — 비밀번호를 두 번째 인자로 넘겨주세요")
                print("  사용: python -m src.tg_signin <OTP> <2FA_password>")
                sys.exit(2)
            user = await app.check_password(password)
            print(f"✓ 로그인 성공 (2단계 인증 통과) — {user.first_name} (id={user.id})")

        me = await app.get_me()
        print(f"  me: {me.first_name} (@{me.username or 'N/A'}) · id={me.id}")
        print(f"  세션 파일: hwiki_cash.session")
    finally:
        await app.disconnect()
        # 임시 파일 정리
        try:
            TMP_FILE.unlink()
            print(f"  {TMP_FILE.name} 삭제 완료")
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
