# 법인카드 대시보드 자동화

사내시스템(hsi.cleverse.kr) → 로그인 → OTP 인증 → SMART ERP → 통계예산 조회 → 데이터 수집.

## 최초 세팅

```bash
cd cash/automation
py -3.12 -m venv .venv
.venv/Scripts/activate      # Windows bash
pip install -r requirements.txt
python -m playwright install chromium
cp .env.example .env        # 값 채우기
```

## 녹화 (Phase 2 — 플로우 캐치용)

사용자 행동을 Python 코드로 녹화:

```bash
python -m playwright codegen --target python-async --output recordings/flow.py https://hsi.cleverse.kr/
```

- 띄워진 크롬에서 평소처럼 **로그인 → OTP 인증 → SMART ERP → 통계예산 조회**까지 수동 진행
- 창 닫으면 `recordings/flow.py`에 각 단계의 셀렉터·클릭이 기록됨
- 그 파일을 Claude가 읽고 `src/login.py`/`src/scrape.py`로 정제

## 실행

```bash
python src/login.py       # Phase 2: 로그인 + OTP 화면 도달
python src/main.py        # Phase 4 이후: 전체 플로우
```

## 폴더

```
src/          — 본 실행 코드
config/       — selectors.yaml (사이트 셀렉터)
recordings/   — codegen 산출물 (원본, gitignore)
debug/        — 실패 시 스크린샷
data/         — 수집한 엑셀/CSV (gitignore)
```
