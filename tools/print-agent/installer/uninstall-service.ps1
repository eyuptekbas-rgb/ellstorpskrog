# Removes Ellstorps Print Agent Windows Service.
param(
  [string]$InstallDir = "$env:ProgramFiles\EllstorpsKrog\PrintAgent"
)

$ErrorActionPreference = "Stop"
$ServiceName = "EllstorpsPrintAgent"
$Nssm = Join-Path $InstallDir "nssm.exe"

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing -and (Test-Path $Nssm)) {
  & $Nssm stop $ServiceName confirm
  & $Nssm remove $ServiceName confirm
  Write-Host "Service $ServiceName removed."
} elseif ($existing) {
  Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
  sc.exe delete $ServiceName | Out-Null
  Write-Host "Service $ServiceName removed via sc.exe."
} else {
  Write-Host "Service $ServiceName was not installed."
}
