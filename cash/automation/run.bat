@echo off
REM Windows 작업 스케줄러용 실행 스크립트.
REM 트리거: 매일 07:00 (등록 방법은 README 참조)

setlocal
cd /d "%~dp0"

REM 로그 파일 (날짜별)
set LOGDIR=%~dp0logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
for /f "tokens=1-3 delims=-. " %%a in ("%date%") do set TODAY=%%a%%b%%c
set LOGFILE=%LOGDIR%\run_%TODAY%.log

echo ======================================= >> "%LOGFILE%" 2>&1
echo [%date% %time%] RUN START >> "%LOGFILE%" 2>&1

call ".venv\Scripts\activate.bat"
python -m src.main >> "%LOGFILE%" 2>&1
set EXITCODE=%errorlevel%

echo [%date% %time%] RUN END (exit=%EXITCODE%) >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%" 2>&1

exit /b %EXITCODE%
