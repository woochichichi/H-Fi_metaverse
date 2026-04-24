"""
세션 파일 유효성 검사 — interactive 없이 순수 확인만.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import asyncio
from pyrogram.client import Client
from .config import Env


async def main():
    app = Client(
        name="hwiki_cash",
        api_id=int(Env.TELEGRAM_API_ID),
        api_hash=Env.TELEGRAM_API_HASH,
        workdir=str(Env.ROOT),
        no_updates=True,
    )

    print(f"세션 파일 위치: {Env.ROOT}/hwiki_cash.session")

    try:
        # connect 는 세션 로드만 (인증 안 함). start 는 필요 시 인증 진행.
        await app.connect()
        is_auth = await app.storage.is_bot() is not None
        if not app.me and not (await app.storage.user_id()):
            print("✗ 세션에 사용자 ID 없음 — 인증 안 된 상태")
            return
        me = await app.get_me()
        print(f"✓ 세션 유효 — {me.first_name} (@{me.username or 'N/A'}) · id={me.id}")
    except Exception as e:
        print(f"✗ 세션 로드 실패: {type(e).__name__}: {e}")
    finally:
        try:
            await app.disconnect()
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
