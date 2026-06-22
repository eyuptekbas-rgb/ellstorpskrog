# Full install logic for Ellstorps Print Agent (used by Inno Setup and IExpress fallback).
param(
  [string]$SourceDir = $PSScriptRoot,
  [string]$InstallDir = "$env:ProgramFiles\EllstorpsKrog\PrintAgent",
  [string]$DataDir = "$env:ProgramData\EllstorpsKrog\PrintAgent"
)

$ErrorActionPreference = "Stop"

function Copy-Tree([string]$From, [string]$To) {
  New-Item -ItemType Directory -Force -Path $To | Out-Null
  Copy-Item -Path (Join-Path $From "*") -Destination $To -Recurse -Force
}

Write-Host "Installing Ellstorps Print Agent to $InstallDir ..."
Copy-Tree $SourceDir $InstallDir

$ServiceScript = Join-Path $InstallDir "installer\install-service.ps1"
if (-not (Test-Path $ServiceScript)) {
  throw "Missing service installer: $ServiceScript"
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ServiceScript -InstallDir $InstallDir -DataDir $DataDir
Write-Host "Installation complete. Open http://127.0.0.1:9211/"
