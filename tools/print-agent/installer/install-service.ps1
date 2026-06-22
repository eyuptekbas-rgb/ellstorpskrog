# Installs Ellstorps Print Agent as a Windows Service (NSSM) with auto-restart.
param(
  [string]$InstallDir = "$env:ProgramFiles\EllstorpsKrog\PrintAgent",
  [string]$DataDir = "$env:ProgramData\EllstorpsKrog\PrintAgent"
)

$ErrorActionPreference = "Stop"
$ServiceName = "EllstorpsPrintAgent"
$Nssm = Join-Path $InstallDir "nssm.exe"
$AgentExe = Join-Path $InstallDir "EllstorpsPrintAgent.exe"
$LogDir = Join-Path $DataDir "logs"
$InspectScript = Join-Path $InstallDir "installer\inspect-service-config.ps1"

function Invoke-Nssm {
  param([Parameter(Mandatory = $true)][string[]]$Args)
  $proc = Start-Process -FilePath $Nssm -ArgumentList $Args -Wait -PassThru -NoNewWindow
  if ($proc.ExitCode -ne 0) {
    throw "NSSM failed: $($Args -join ' ') (exit $($proc.ExitCode))"
  }
}

function Get-NssmValue {
  param([string]$Parameter)
  $raw = & $Nssm get $ServiceName $Parameter 2>&1
  if ($LASTEXITCODE -ne 0) { return $null }
  return ($raw | Out-String).Trim()
}

if (-not (Test-Path $Nssm)) { throw "NSSM missing: $Nssm" }
if (-not (Test-Path $AgentExe)) { throw "Agent launcher missing: $AgentExe" }
Unblock-File -Path $AgentExe -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$ConfigPath = Join-Path $DataDir "config.json"
if (-not (Test-Path $ConfigPath)) {
  $DefaultConfig = Join-Path $InstallDir "default-config.json"
  if (Test-Path $DefaultConfig) {
    Copy-Item $DefaultConfig $ConfigPath -Force
  }
}

Write-Host "Verifying launcher (optional preflight)..."
try {
  $testProc = Start-Process -FilePath $AgentExe -WorkingDirectory $InstallDir -PassThru -WindowStyle Hidden
  Start-Sleep -Seconds 2
  $probe = Invoke-WebRequest -Uri "http://127.0.0.1:9211/health" -UseBasicParsing -TimeoutSec 5
  if ($probe.StatusCode -ne 200) {
    throw "Launcher health probe returned HTTP $($probe.StatusCode)"
  }
  Write-Host "Launcher probe OK (HTTP 200)."
  Stop-Process -Id $testProc.Id -Force -ErrorAction SilentlyContinue
  Get-Process -Name node -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -like "$InstallDir*" } |
    Stop-Process -Force -ErrorAction SilentlyContinue
} catch {
  Write-Host "Launcher preflight skipped: $($_.Exception.Message)"
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  try { Invoke-Nssm @("stop", $ServiceName) } catch { }
  Start-Sleep -Seconds 2
  try { Invoke-Nssm @("remove", $ServiceName, "confirm") } catch { }
  Start-Sleep -Seconds 2
}

# NSSM Application = single bundled launcher exe. No AppParameters. No node.exe path.
Invoke-Nssm @("install", $ServiceName, $AgentExe)
Invoke-Nssm @("set", $ServiceName, "DisplayName", "Ellstorps Krog Print Agent")
Invoke-Nssm @("set", $ServiceName, "Description", "Local ESC/POS print agent for Ellstorps Krog POS terminals (127.0.0.1:9211).")
Invoke-Nssm @("set", $ServiceName, "Application", $AgentExe)
Invoke-Nssm @("reset", $ServiceName, "AppParameters")
Invoke-Nssm @("set", $ServiceName, "AppDirectory", $InstallDir)
Invoke-Nssm @(
  "set", $ServiceName, "AppEnvironmentExtra",
  "ELLSTORPS_PRINT_AGENT_HOME=$InstallDir",
  "ELLSTORPS_PRINT_AGENT_DATA=$DataDir"
)
Invoke-Nssm @("set", $ServiceName, "AppStdout", (Join-Path $LogDir "service-stdout.log"))
Invoke-Nssm @("set", $ServiceName, "AppStderr", (Join-Path $LogDir "service-stderr.log"))
Invoke-Nssm @("set", $ServiceName, "AppRotateFiles", "1")
Invoke-Nssm @("set", $ServiceName, "AppRotateBytes", "1048576")
Invoke-Nssm @("set", $ServiceName, "AppNoConsole", "1")
Invoke-Nssm @("set", $ServiceName, "Start", "SERVICE_AUTO_START")
Invoke-Nssm @("set", $ServiceName, "AppExit", "Default", "Restart")
Invoke-Nssm @("set", $ServiceName, "AppRestartDelay", "5000")

$app = Get-NssmValue "Application"
$params = Get-NssmValue "AppParameters"
$appDir = Get-NssmValue "AppDirectory"

Write-Host "NSSM Application: $app"
Write-Host "NSSM AppParameters: '$params'"
Write-Host "NSSM AppDirectory: $appDir"

if ($app -ne $AgentExe) {
  throw "NSSM Application mismatch. Expected: $AgentExe Got: $app"
}
if ($app -match "node\.exe|run\.cjs") {
  throw "NSSM Application must not reference node.exe or run.cjs."
}
if ($params -and $params.Trim().Length -gt 0) {
  throw "NSSM AppParameters must be empty (got: $params)."
}
if ($params -match 'C:\\Program ') {
  throw "NSSM AppParameters contains unquoted Program Files path: $params"
}

if (Test-Path $InspectScript) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $InspectScript -InstallDir $InstallDir -Strict
}

Invoke-Nssm @("start", $ServiceName)
Start-Sleep -Seconds 4

$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $svc -or $svc.Status -ne "Running") {
  $stderr = Join-Path $LogDir "service-stderr.log"
  $crash = Join-Path $DataDir "crash.log"
  $details = @()
  if (Test-Path $stderr) { $details += Get-Content $stderr -Tail 30 }
  if (Test-Path $crash) { $details += Get-Content $crash -Tail 30 }
  throw "Service failed to stay running.`n$($details -join [Environment]::NewLine)"
}

$health = Invoke-WebRequest -Uri "http://127.0.0.1:9211/health" -UseBasicParsing -TimeoutSec 10
if ($health.StatusCode -ne 200) {
  throw "Health check returned HTTP $($health.StatusCode)"
}

Write-Host "Service $ServiceName installed and running. Health check HTTP 200."
