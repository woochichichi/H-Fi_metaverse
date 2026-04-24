# Windows 작업 스케줄러 등록 — 평일(월~금) 07:00 run.bat 실행
#
# 실행 (관리자 권한 불필요, 본인 계정 태스크):
#   powershell -ExecutionPolicy Bypass -File install_schedule.ps1
#
# 제거:
#   Unregister-ScheduledTask -TaskName "LawinCashDaily" -Confirm:$false

$ErrorActionPreference = "Stop"

$taskName = "LawinCashDaily"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$batPath = Join-Path $scriptRoot "run.bat"

if (-not (Test-Path $batPath)) {
    Write-Error "run.bat not found: $batPath"
    exit 1
}

# 기존 태스크 있으면 제거 후 재등록
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $scriptRoot
# 평일(월~금) 07:00 — 주말 실행 안 함
$trigger = New-ScheduledTaskTrigger -Weekly `
    -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday `
    -At "07:00"
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

# 로그인된 사용자 컨텍스트에서 실행. 암호 없이 등록.
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

Register-ScheduledTask -TaskName $taskName `
    -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
    -Description "법인카드 대시보드 수집 (매일 07:00)"

Write-Host ""
Write-Host "✓ Registered: $taskName" -ForegroundColor Green
Write-Host "  trigger  : Weekly Mon-Fri 07:00"
Write-Host "  command  : $batPath"
Write-Host "  logs     : $scriptRoot\logs\"
Write-Host ""
Write-Host "Test run now:"
Write-Host "  Start-ScheduledTask -TaskName $taskName"
