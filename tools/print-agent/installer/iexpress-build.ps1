function Build-IExpressInstaller {
  param(
    [string]$Staging,
    [string]$OutExe,
    [string]$AgentDir
  )

  $InstallerDir = Join-Path $Staging "installer"
  New-Item -ItemType Directory -Force -Path $InstallerDir | Out-Null
  Copy-Item (Join-Path $AgentDir "installer\setup-install.ps1") (Join-Path $InstallerDir "setup-install.ps1") -Force
  Copy-Item (Join-Path $AgentDir "installer\install-service.ps1") (Join-Path $InstallerDir "install-service.ps1") -Force
  Copy-Item (Join-Path $AgentDir "installer\uninstall-service.ps1") (Join-Path $InstallerDir "uninstall-service.ps1") -Force

  $InstallCmd = Join-Path $Staging "install.cmd"
  @"
@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\setup-install.ps1" -SourceDir "%~dp0"
"@ | Set-Content -Path $InstallCmd -Encoding ASCII

  $SedDir = Join-Path $AgentDir "dist\iexpress"
  New-Item -ItemType Directory -Force -Path $SedDir | Out-Null

  $StagingForward = ($Staging -replace "\\", "/")
  $OutForward = ($OutExe -replace "\\", "/")

  $fileLines = New-Object System.Collections.Generic.List[string]
  $index = 0
  Get-ChildItem -Path $Staging -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($Staging.Length + 1)
    $fileLines.Add("%FILE$index%=$relative")
    $index += 1
  }

  $SedPath = Join-Path $SedDir "EllstorpsPrintAgent.sed"
  $sedContent = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=0
UseLongFileName=1
InsideCompressed=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=Ellstorps Print Agent is installed. Open http://127.0.0.1:9211/
TargetName=$OutForward
FriendlyName=Ellstorps Print Agent Setup
AppLaunched=install.cmd
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles
[SourceFiles]
SourceFiles0=$StagingForward
[SourceFiles0]
$($fileLines -join "`r`n")
[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=Ellstorps Print Agent is installed. Open http://127.0.0.1:9211/
FriendlyName=Ellstorps Print Agent Setup
PostInstallCmd=
"@
  Set-Content -Path $SedPath -Value $sedContent -Encoding ASCII

  $IExpress = Join-Path $env:SystemRoot "System32\iexpress.exe"
  if (-not (Test-Path $IExpress)) {
    throw "iexpress.exe not found on this Windows system."
  }

  Write-Host "Building IExpress installer ($index files)..."
  $proc = Start-Process -FilePath $IExpress -ArgumentList "/N", $SedPath, "/Q" -Wait -PassThru
  if (-not (Test-Path $OutExe)) {
    throw "IExpress build failed with exit code $($proc.ExitCode)"
  }
}
