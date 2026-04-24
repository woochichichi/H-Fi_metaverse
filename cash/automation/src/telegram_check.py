"""
텔레그램 봇 폴링 독립 테스트.

확인:
  1. 봇 토큰 유효 여부 (getMe)
  2. webhook 설정 여부 (있으면 getUpdates 불가)
  3. 지금까지 쌓인 update 수
  4. 최근 몇 건의 메시지 메타 (chat_id, date, 본문 길이, sender 매칭 여부, OTP 추출 성공)

로그인 안 함. SMS 발송 안 함. 텔레그램만 순수하게 검사.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import json
import re
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .config import Env

OTP_RE = re.compile(r"\b(\d{6})\b")


def api(method: str, **params) -> dict:
    token = Env.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urlencode(params).encode() if params else None
    req = Request(url, data=data)
    with urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())


def matches_sender(text: str) -> bool:
    filt = Env.SENDER_FILTER.strip()
    if not filt:
        return True
    normalized = re.sub(r"[\s\-]", "", text)
    target = re.sub(r"[\s\-]", "", filt)
    return target in normalized


def main():
    Env.require("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID")
    print("=" * 60)
    print("  텔레그램 봇 폴링 진단")
    print("=" * 60)

    # 1) getMe
    print("\n[1] 봇 신원 확인 (getMe)")
    try:
        me = api("getMe")
        if me.get("ok"):
            u = me["result"]
            print(f"    ✓ id={u.get('id')} username=@{u.get('username')} name={u.get('first_name')}")
        else:
            print(f"    ✗ {me}")
            return
    except Exception as e:
        print(f"    ✗ 호출 실패: {e}")
        return

    # 2) webhook 설정 여부
    print("\n[2] Webhook 상태 (getWebhookInfo)")
    try:
        wh = api("getWebhookInfo")
        info = wh.get("result", {})
        webhook_url = info.get("url", "")
        pending = info.get("pending_update_count", 0)
        last_error = info.get("last_error_message", "")
        print(f"    URL: {webhook_url or '(없음)'}")
        print(f"    Pending updates: {pending}")
        if last_error:
            print(f"    last_error: {last_error}")
        if webhook_url:
            print("    ⚠ webhook 설정돼 있으면 getUpdates 불가!")
            print("      → deleteWebhook 으로 제거 권장")
    except Exception as e:
        print(f"    ✗ {e}")

    # 3) 현재 쌓인 업데이트 스냅샷 (offset=0, timeout=0)
    print("\n[3] 쌓인 업데이트 조회 (getUpdates, offset=0, timeout=0)")
    try:
        res = api("getUpdates", timeout=0)
        updates = res.get("result", [])
        print(f"    총 {len(updates)}건")
    except Exception as e:
        print(f"    ✗ {e}")
        return

    # 4) 마지막 5건 분석
    print("\n[4] 최근 메시지 5건 분석 (chat_id / date / sender / OTP)")
    recent = updates[-5:] if len(updates) > 5 else updates
    expected_chat = str(Env.TELEGRAM_CHAT_ID)
    for i, upd in enumerate(recent, 1):
        msg = upd.get("message") or upd.get("channel_post") or {}
        chat = str((msg.get("chat") or {}).get("id", ""))
        date = msg.get("date", 0)
        age = int(time.time() - date) if date else -1
        text = msg.get("text", "") or msg.get("caption", "") or ""
        chat_ok = (chat == expected_chat)
        sender_ok = matches_sender(text)
        otps = OTP_RE.findall(text)
        otp_first = otps[0] if otps else "(없음)"
        # 본문은 앞 60자만 + 민감정보(6자리)는 마스킹
        safe_preview = re.sub(r"\b\d{6}\b", "******", text[:60])
        print(f"    [{i}] chat_ok={chat_ok} · sender_ok={sender_ok} · otp={otp_first} · age={age}s")
        print(f"        본문: {safe_preview!r}")

    # 5) 5초 long poll 테스트
    print("\n[5] Long poll 테스트 (offset=0, timeout=5)")
    print("    → 새 메시지가 들어오는 중이면 여기서 반환됨")
    try:
        res = api("getUpdates", offset=0, timeout=5)
        new_updates = res.get("result", [])
        print(f"    받음: {len(new_updates)}건")
    except Exception as e:
        print(f"    ✗ {e}")

    print("\n" + "=" * 60)
    print("  진단 완료")
    print("=" * 60)


if __name__ == "__main__":
    main()
