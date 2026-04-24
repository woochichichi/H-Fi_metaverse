"""
최초 1회만 실행 — 텔레그램 사용자 계정 인증 + 세션 파일(.session) 생성.

사용:
  python -m src.tg_login

실행하면:
  1. pyrogram 이 텔레그램 서버에 연결
  2. .env 의 전화번호로 SMS OTP 발송
  3. 콘솔에 OTP 입력 프롬프트 → 받은 6자리 입력
  4. (2단계 인증 있으면 비번도) → 세션 파일 생성
  5. 세션 파일(.session) 은 automation/ 루트에 저장되며 .gitignore 됨

이후 main.py 실행 시 세션 재사용해 로그인 단계 건너뜀.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import asyncio
from pyrogram.client import Client

from .config import Env


async def main():
    Env.require("TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_PHONE")

    app = Client(
        name="hwiki_cash",
        api_id=int(Env.TELEGRAM_API_ID),
        api_hash=Env.TELEGRAM_API_HASH,
        phone_number=Env.TELEGRAM_PHONE,
        workdir=str(Env.ROOT if hasattr(Env, "ROOT") else "."),
    )

    print("=" * 60)
    print("  텔레그램 User API 최초 인증")
    print("=" * 60)
    print(f"  전화번호: {Env.TELEGRAM_PHONE}")
    print("  → 텔레그램에서 SMS 또는 앱 알림으로 OTP가 옵니다")
    print("  → 프롬프트가 뜨면 입력하세요")
    print()

    async with app:
        me = await app.get_me()
        print(f"\n✓ 로그인 성공 — {me.first_name} (@{me.username or 'N/A'}) · id={me.id}")
        print("  세션 파일: hwiki_cash.session")
        print("  이후 main.py 실행 시 자동으로 이 세션 사용.")


if __name__ == "__main__":
    # Env.ROOT 가 config.py 에 없으면 추가
    from pathlib import Path
    if not hasattr(Env, "ROOT"):
        Env.ROOT = Path(__file__).resolve().parent.parent
    asyncio.run(main())
