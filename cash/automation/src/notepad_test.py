"""
Windows 메모장(notepad) 에 Playwright 와 동일한 방식으로 입력해
한/영 모드 영향을 육안으로 검증.

Playwright 는 브라우저 전용이라 메모장 입력은 안 됨.
대신: PowerShell 의 SendKeys API 로 같은 효과 흉내 + Python 의 ctypes + SendInput.

간단히: pyautogui 로 하자.
"""
from __future__ import annotations
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import subprocess
import time

from .config import Env

def main():
    print("=" * 60)
    print("  메모장 입력 테스트")
    print("=" * 60)
    print("  1. 메모장이 곧 열립니다")
    print("  2. 3초 후 자동으로 ID/PW 를 순서대로 타이핑")
    print("  3. 화면에 뭐가 찍혔는지 보면 한/영 모드 영향 확인 가능")
    print()

    try:
        import pyautogui
    except ImportError:
        print("pyautogui 미설치. pip install pyautogui 필요")
        print("대신: 수동 테스트 — 메모장 열고 직접 자판으로")
        print(f"  ID 예상: {Env.USER_ID}")
        print(f"  PW 예상: {Env.USER_PW}")
        return

    # 메모장 실행
    print("[test] 메모장 실행...")
    subprocess.Popen(["notepad.exe"])
    time.sleep(2)

    # 메모장 포커스 확보용 짧은 대기
    print("[test] 3초 후 타이핑 시작 — 메모장 포커스 유지하세요")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)

    pyautogui.write(f"=== INPUT_VERIFY_TEST ===\n", interval=0.03)
    pyautogui.write(f"USER_ID ({len(Env.USER_ID)}): ", interval=0.03)
    pyautogui.write(Env.USER_ID, interval=0.05)
    pyautogui.write(f"\nUSER_PW ({len(Env.USER_PW)}): ", interval=0.03)
    pyautogui.write(Env.USER_PW, interval=0.07)
    pyautogui.write(f"\n=== END ===\n", interval=0.03)

    print("[test] 완료. 메모장에 찍힌 글자와 아래 비교:")
    print(f"  기대 ID: {Env.USER_ID}")
    print(f"  기대 PW: {Env.USER_PW}")


if __name__ == "__main__":
    main()
