"""
tg_login.py 의 비대화형 버전 — OTP/비번을 환경변수로 받음.

사용:
  TG_OTP=123456 python -m src.tg_login_auto
  TG_OTP=123456 TG_2FA_PASSWORD=xxx python -m src.tg_login_auto

pyrogram 의 ainput 을 monkey-patch 해서 stdin 프롬프트 대신 env 를 읽게 함.
"""
from __future__ import annotations
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import asyncio
import pyrogram.utils as _pyro_utils
import pyrogram.client as _pyro_client


async def _patched_ainput(prompt: str = "") -> str:
    p = (prompt or "").lower()
    if "confirmation code" in p or "code" in p:
        code = os.environ.get("TG_OTP", "").strip()
        if not code:
            raise RuntimeError("TG_OTP 환경변수 미설정 — OTP 코드 필요")
        print(f"{prompt}[auto:TG_OTP]")
        return code
    if "password" in p:
        pw = os.environ.get("TG_2FA_PASSWORD", "")
        if not pw:
            raise RuntimeError("TG_2FA_PASSWORD 환경변수 미설정 — 2단계 인증 비번 필요")
        print(f"{prompt}[auto:TG_2FA_PASSWORD]")
        return pw
    if "y/n" in p or "correct" in p:
        print(f"{prompt}y [auto]")
        return "y"
    raise RuntimeError(f"예상치 못한 프롬프트: {prompt!r}")


# monkey-patch
_pyro_utils.ainput = _patched_ainput
_pyro_client.ainput = _patched_ainput

from pyrogram.client import Client
from .config import Env


async def main():
    Env.require("TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_PHONE")

    app = Client(
        name="hwiki_cash",
        api_id=int(Env.TELEGRAM_API_ID),
        api_hash=Env.TELEGRAM_API_HASH,
        phone_number=Env.TELEGRAM_PHONE,
        workdir=str(Env.ROOT),
    )

    print("=" * 60)
    print("  텔레그램 User API 비대화형 인증")
    print("=" * 60)
    print(f"  전화번호: {Env.TELEGRAM_PHONE}")
    print(f"  TG_OTP: {'설정됨' if os.environ.get('TG_OTP') else '미설정'}")
    print(f"  TG_2FA_PASSWORD: {'설정됨' if os.environ.get('TG_2FA_PASSWORD') else '미설정'}")
    print()

    async with app:
        me = await app.get_me()
        print(f"\n✓ 로그인 성공 — {me.first_name} (@{me.username or 'N/A'}) · id={me.id}")
        print("  세션 파일: hwiki_cash.session")


if __name__ == "__main__":
    asyncio.run(main())
