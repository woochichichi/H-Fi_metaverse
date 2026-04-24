"""환경변수 + 셀렉터 YAML 로더."""
from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


# 외부 접근용 (tg_login 등)
_PROJECT_ROOT = ROOT


def load_selectors() -> dict:
    import yaml
    with open(ROOT / "config" / "selectors.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


class Env:
    LOGIN_URL = os.getenv("LOGIN_URL", "https://hsi.cleverse.kr/auth/login/login?reUrl=/")
    USER_ID = os.getenv("USER_ID", "")
    USER_PW = os.getenv("USER_PW", "")
    HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"

    DEPT_CD = os.getenv("DEPT_CD", "M110301")
    EMP_NO = os.getenv("EMP_NO", "")

    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    SENDER_FILTER = os.getenv("SENDER_FILTER", "")   # OTP SMS 발신번호 필터
    OTP_POLL_INTERVAL = int(os.getenv("OTP_POLL_INTERVAL", "5"))
    OTP_POLL_TIMEOUT = int(os.getenv("OTP_POLL_TIMEOUT", "120"))

    # MTProto User API (pyrogram) — SMS 포워딩 메시지 수신용
    TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID", "")
    TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "")
    TELEGRAM_PHONE = os.getenv("TELEGRAM_PHONE", "")

    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    TARGET_TEAM = os.getenv("TARGET_TEAM", "증권ITO")

    STATE_FILE = ROOT / "state.json"
    DATA_DIR = ROOT / "data" / "raw"
    DEBUG_DIR = ROOT / "debug"
    LOG_DIR = ROOT / "logs"
    ROOT = ROOT

    @classmethod
    def require(cls, *keys: str) -> None:
        missing = [k for k in keys if not getattr(cls, k)]
        if missing:
            raise RuntimeError(f".env 미설정: {', '.join(missing)}")
