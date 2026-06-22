# Dumps and validates NSSM service configuration for Ellstorps Print Agent.
param(
  [string]$InstallDir = "$env:ProgramFiles\EllstorpsKrog\PrintAgent",
  [string]$ServiceName = "EllstorpsPrintAgent",
  [switch]$Strict
)

$ErrorActionPreference = "Stop"
$Nssm = Join-Path $InstallDir "nssm.exe"

function Get-NssmValue([string]$Parameter) {
  if (-not (Test-Path $Nssm)) { return $null }
  $raw = & $Nssm get $ServiceName $Parameter 2>&1
  if ($LASTEXITCODE -ne 0) { return $null }
  return ($raw | Out-String).Trim()
}

function Get-RegistryValue([string]$Name) {
  $key = "HKLM:\SYSTEM\CurrentControlSet\Services\$ServiceName\Parameters"
  if (-not (Test-Path $key)) { return $null }
  return (Get-ItemProperty -Path $key -Name $Name -ErrorAction SilentlyContinue).$Name
}

$report = [ordered]@{
  ServiceName = $ServiceName
  InstallDir = $InstallDir
  ServiceStatus = (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue).Status
  Application = Get-NssmValue "Application"
  AppParameters = Get-NssmValue "AppParameters"
  AppDirectory = Get-NssmValue "AppDirectory"
  AppEnvironmentExtra = Get-NssmValue "AppEnvironmentExtra"
  RegistryApplication = Get-RegistryValue "Application"
  RegistryAppParameters = Get-RegistryValue "AppParameters"
  RegistryAppDirectory = Get-RegistryValue "AppDirectory"
}

$report | Format-List | Out-String | Write-Host

$issues = @()

if ($report.Application -match "node\.exe") {
  $issues += "Application must NOT be node.exe (paths with spaces break AppParameters)."
}

if ($report.Application -match "run\.cjs") {
  $issues += "Application must NOT be run.cjs."
}

if ($report.AppParameters -match "run\.cjs|node\.exe") {
  $issues += "AppParameters must NOT contain node.exe or run.cjs."
}

if ($report.AppParameters -match 'C:\\Program ') {
  $issues += "AppParameters appear to contain an unquoted path under Program Files."
}

if ($report.Application -and $report.Application -notmatch "EllstorpsPrintAgent\.exe$") {
  $issues += "Application should be EllstorpsPrintAgent.exe (got: $($report.Application))."
}

if ($report.AppParameters -and $report.AppParameters.Trim().Length -gt 0) {
  $issues += "AppParameters should be empty when using EllstorpsPrintAgent.exe (got: $($report.AppParameters))."
}

if ($report.RegistryAppParameters -match '^C:\\Program ') {
  $issues += "Registry AppParameters is unquoted and will split at spaces."
}

if ($issues.Count -gt 0) {
  Write-Host "CONFIGURATION ISSUES:" -ForegroundColor Red
  $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  if ($Strict) { exit 1 }
  exit 2
}

Write-Host "NSSM configuration looks correct." -ForegroundColor Green
if ($Strict) { exit 0 }
