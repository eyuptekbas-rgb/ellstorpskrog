# Ellstorps Krog — Install local Print Agent as auto-start Scheduled Task
# Run as Administrator on each POS terminal (ZQ-P1088).

param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$TaskName = "EllstorpsPrintAgent"
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "Run this script as Administrator."
}

$NodeExe = (Get-Command node -ErrorAction Stop).Source
$EntryScript = Join-Path $ProjectRoot "tools\print-agent\run.ts"
$LogDir = Join-Path $ProjectRoot "tools\print-agent\logs"
$ConfigPath = Join-Path $ProjectRoot "tools\print-agent\print-agent.config.json"

if (-not (Test-Path -LiteralPath $EntryScript)) {
  throw "Print agent entry not found: $EntryScript"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$WrapperPath = Join-Path $ProjectRoot "tools\print-agent\run-agent.cmd"
$Wrapper = @"
@echo off
cd /d "$ProjectRoot"
set PRINT_AGENT_CONFIG=$ConfigPath
set NODE_ENV=production
"$NodeExe" --import tsx "$EntryScript" >> "$LogDir\agent.log" 2>&1
"@
Set-Content -Path $WrapperPath -Value $Wrapper -Encoding ASCII

$Action = New-ScheduledTaskAction -Execute $WrapperPath -WorkingDirectory $ProjectRoot
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null

Write-Host "Installed scheduled task '$TaskName' (auto-start at boot)." -ForegroundColor Green
Write-Host "Wrapper: $WrapperPath"
Write-Host "Logs:    $LogDir\agent.log"
Write-Host ""
Write-Host "Start now:"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "Verify:"
Write-Host "  Invoke-RestMethod http://127.0.0.1:9211/v1/status"
