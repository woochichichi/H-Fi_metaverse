"""
봇 탐지 회피 — 최소한의 시그널 제거.

- navigator.webdriver 플래그 제거
- User-Agent 정돈 (HeadlessChrome → Chrome)
- 각 동작 사이 랜덤 지연 (human_delay)
"""
from __future__ import annotations
import asyncio
import random
from playwright.async_api import BrowserContext, Page


REAL_CHROME_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/129.0.0.0 Safari/537.36"
)


async def apply_stealth(context: BrowserContext) -> None:
    """새 컨텍스트에 init script 주입 — webdriver 탐지 우회."""
    await context.add_init_script(
        """
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        window.chrome = { runtime: {} };
        """
    )


async def human_delay(min_s: float = 0.8, max_s: float = 2.2) -> None:
    """랜덤 지연 — 요청 간격 패턴을 인간처럼."""
    await asyncio.sleep(random.uniform(min_s, max_s))


async def goto_human(page: Page, url: str) -> None:
    """페이지 이동 + 소폭 지연."""
    await page.goto(url)
    await human_delay(0.5, 1.5)
