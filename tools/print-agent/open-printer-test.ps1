param(
  [Parameter(Mandatory = $true)]
  [string]$PrinterName
)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class OpenPrinterTest {
  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
}
"@

function Get-Win32Message([int]$Code) {
  try { return (New-Object System.ComponentModel.Win32Exception($Code)).Message }
  catch { return "Unknown error" }
}

$handle = [IntPtr]::Zero
$ok = [OpenPrinterTest]::OpenPrinter($PrinterName, [ref]$handle, [IntPtr]::Zero)
$err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()

if ($ok) {
  [void][OpenPrinterTest]::ClosePrinter($handle)
  @{ success = $true; printer = $PrinterName } | ConvertTo-Json -Compress
  exit 0
}

@{
  success = $false
  printer = $PrinterName
  error = (Get-Win32Message $err)
  win32Code = $err
} | ConvertTo-Json -Compress
exit 1
