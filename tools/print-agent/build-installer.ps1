# Builds EllstorpsPrintAgentSetup.exe (standalone POS installer).
# Requires: Node.js, npm, Inno Setup 6 (ISCC.exe on PATH or default location).
param(
  [switch]$SkipNodeDownload,
  [switch]$SkipNssmDownload
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$AgentDir = Join-Path $Root "tools\print-agent"
$Staging = Join-Path $AgentDir "dist\staging"
$OutDir = Join-Path $Root "dist"
$NodeVersion = "20.18.1"
$NodeZip = "node-v$NodeVersion-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/v$NodeVersion/$NodeZip"
$NssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
$CacheDir = Join-Path $AgentDir "installer\cache"

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function Download-File([string]$Url, [string]$Dest) {
  if (Test-Path $Dest) { return }
  Write-Host "Downloading $Url ..."
  Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing
}

Write-Host "=== Ellstorps Print Agent - build installer ==="
Ensure-Dir $Staging
Ensure-Dir $OutDir
Ensure-Dir $CacheDir

Get-ChildItem $Staging -ErrorAction SilentlyContinue | ForEach-Object {
  try { Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop } catch {
    Write-Host "Warning: could not remove $($_.FullName) (in use). Continuing..."
  }
}

Write-Host "Bundling agent with esbuild..."
Push-Location $Root
npx --yes esbuild "$AgentDir\run.ts" `
  --bundle `
  --platform=node `
  --target=node20 `
  --format=cjs `
  --outfile="$Staging\run.cjs" `
  --external:node:* `
  --banner:js="/* Ellstorps Print Agent */"
Pop-Location

Write-Host "Copying UI and PowerShell scripts..."
Ensure-Dir (Join-Path $Staging "ui")
Ensure-Dir (Join-Path $Staging "scripts")
Ensure-Dir (Join-Path $Staging "installer")
Copy-Item (Join-Path $AgentDir "ui\*") (Join-Path $Staging "ui") -Recurse -Force
Copy-Item (Join-Path $AgentDir "raw-spooler.ps1") (Join-Path $Staging "scripts") -Force
Copy-Item (Join-Path $AgentDir "open-printer-test.ps1") (Join-Path $Staging "scripts") -Force
Copy-Item (Join-Path $AgentDir "run-agent.cmd") (Join-Path $Staging "run-agent.cmd") -Force
Copy-Item (Join-Path $AgentDir "installer\install-service.ps1") (Join-Path $Staging "installer") -Force
Copy-Item (Join-Path $AgentDir "installer\uninstall-service.ps1") (Join-Path $Staging "installer") -Force
Copy-Item (Join-Path $AgentDir "installer\inspect-service-config.ps1") (Join-Path $Staging "installer") -Force

Write-Host "Compiling EllstorpsPrintAgent.exe launcher..."
$LauncherCs = Join-Path $AgentDir "installer\PrintAgentLauncher.cs"
$LauncherExe = Join-Path $Staging "EllstorpsPrintAgent.exe"
$Csc = $null
foreach ($candidate in @(
  "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
  "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)) {
  if (Test-Path $candidate) { $Csc = $candidate; break }
}
if (-not $Csc) {
  throw "C# compiler (csc.exe) not found. Install .NET Framework developer pack."
}
& $Csc /nologo /target:exe /out:$LauncherExe $LauncherCs
if (-not (Test-Path $LauncherExe)) {
  throw "Failed to compile EllstorpsPrintAgent.exe"
}
Unblock-File -Path $LauncherExe -ErrorAction SilentlyContinue

if (-not $SkipNodeDownload) {
  $NodeZipPath = Join-Path $CacheDir $NodeZip
  Download-File $NodeUrl $NodeZipPath
  $NodeExtract = Join-Path $CacheDir "node-v$NodeVersion-win-x64"
  if (-not (Test-Path $NodeExtract)) {
    Expand-Archive -Path $NodeZipPath -DestinationPath $CacheDir -Force
  }
  Ensure-Dir (Join-Path $Staging "node")
  Copy-Item (Join-Path $NodeExtract "node.exe") (Join-Path $Staging "node") -Force
  Get-ChildItem (Join-Path $NodeExtract "*.dll") -ErrorAction SilentlyContinue |
    Copy-Item -Destination (Join-Path $Staging "node") -Force
}

if (-not $SkipNssmDownload) {
  $NssmZip = Join-Path $CacheDir "nssm-2.24.zip"
  Download-File $NssmUrl $NssmZip
  $NssmExtract = Join-Path $CacheDir "nssm-2.24"
  if (-not (Test-Path $NssmExtract)) {
    Expand-Archive -Path $NssmZip -DestinationPath $CacheDir -Force
  }
  $NssmExe = Join-Path $NssmExtract "nssm-2.24\win64\nssm.exe"
  if (-not (Test-Path $NssmExe)) {
    $found = Get-ChildItem -Path $CacheDir -Filter "nssm.exe" -Recurse | Select-Object -First 1
    if ($found) { $NssmExe = $found.FullName }
  }
  Copy-Item $NssmExe (Join-Path $Staging "nssm.exe") -Force
}

$DefaultConfig = @{
  host = "127.0.0.1"
  port = 9211
  autoDetectPrinter = $true
  maxRetries = 3
  retryDelayMs = 1500
  logLevel = "info"
} | ConvertTo-Json -Depth 4
Set-Content -Path (Join-Path $Staging "default-config.json") -Value $DefaultConfig -Encoding UTF8

Write-Host "Compiling Inno Setup installer..."
$Iscc = $null
$candidates = @(
  "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
  "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
  "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
)
foreach ($candidate in $candidates) {
  if (Test-Path $candidate) {
    $Iscc = $candidate
    break
  }
}
if (-not $Iscc) {
  $cmd = Get-Command ISCC.exe -ErrorAction SilentlyContinue
  if ($cmd) { $Iscc = $cmd.Source }
}
if (-not $Iscc) {
  Write-Host "Inno Setup not found. Using IExpress fallback..."
  $SetupExe = Join-Path $OutDir "EllstorpsPrintAgentSetup.exe"
  if (Test-Path $SetupExe) { Remove-Item $SetupExe -Force }
  . (Join-Path $AgentDir "installer\iexpress-build.ps1")
  Build-IExpressInstaller -Staging $Staging -OutExe $SetupExe -AgentDir $AgentDir
} else {
  $SetupExe = Join-Path $OutDir "EllstorpsPrintAgentSetup.exe"
  if (Test-Path $SetupExe) { Remove-Item $SetupExe -Force }
  & $Iscc (Join-Path $AgentDir "installer\EllstorpsPrintAgent.iss")
  if (-not (Test-Path $SetupExe)) {
    Write-Host "Inno Setup compile did not produce output. Falling back to IExpress..."
    . (Join-Path $AgentDir "installer\iexpress-build.ps1")
    Build-IExpressInstaller -Staging $Staging -OutExe $SetupExe -AgentDir $AgentDir
  }
}
if (-not (Test-Path $SetupExe)) {
  throw "Installer build failed: $SetupExe not created."
}

Write-Host ""
Write-Host "SUCCESS: $SetupExe"
Write-Host "Copy this file to any ZQ-P1088 POS terminal and run as Administrator."
