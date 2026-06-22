# Standalone Windows printer diagnosis + RAW ESC/POS test
# Usage:
#   .\diagnose-printers.ps1
#   .\diagnose-printers.ps1 -TargetPrinter "Ellstorps Krog Printer"
#   .\diagnose-printers.ps1 -TargetPrinter "Ellstorps Krog Printer" -SendTest

param(
  [string]$TargetPrinter = "Ellstorps Krog Printer",
  [switch]$SendTest
)

$ErrorActionPreference = "Continue"

function Get-Win32ErrorMessage {
  param([int]$ErrorCode)
  try {
    $ex = New-Object System.ComponentModel.Win32Exception($ErrorCode)
    return $ex.Message
  } catch {
    return "(unable to resolve Win32 message)"
  }
}

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinSpoolDiag {
  public const int PRINTER_ENUM_LOCAL = 0x00000002;
  public const int PRINTER_ENUM_CONNECTIONS = 0x00000004;

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct PRINTER_INFO_2 {
    public string pServerName;
    public string pPrinterName;
    public string pShareName;
    public string pPortName;
    public string pDriverName;
    public string pComment;
    public string pLocation;
    public IntPtr pDevMode;
    public string pSepFile;
    public string pPrintProcessor;
    public string pDatatype;
    public string pParameters;
    public IntPtr pSecurityDescriptor;
    public uint Attributes;
    public uint Priority;
    public uint DefaultPriority;
    public uint StartTime;
    public uint UntilTime;
    public uint Status;
    public uint cJobs;
    public uint AveragePPM;
  }

  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool GetPrinter(IntPtr hPrinter, int dwLevel, IntPtr pPrinter, int dwBuf, out int dwNeeded);

  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool EnumPrinters(int Flags, string Name, int Level, IntPtr pPrinterEnum, int cbBuf, out int pcbNeeded, out int pcReturned);

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool OpenPrinterA(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool StartDocPrinterA(IntPtr hPrinter, int level, [In] DOCINFOA di);

  [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

  public static string DecodePrinterStatus(uint status) {
    if (status == 0) return "Ready (0)";
    var parts = new System.Collections.Generic.List<string>();
    if ((status & 0x00000001) != 0) parts.Add("PAUSED");
    if ((status & 0x00000002) != 0) parts.Add("ERROR");
    if ((status & 0x00000004) != 0) parts.Add("PENDING_DELETION");
    if ((status & 0x00000008) != 0) parts.Add("PAPER_JAM");
    if ((status & 0x00000010) != 0) parts.Add("PAPER_OUT");
    if ((status & 0x00000020) != 0) parts.Add("MANUAL_FEED");
    if ((status & 0x00000040) != 0) parts.Add("PAPER_PROBLEM");
    if ((status & 0x00000080) != 0) parts.Add("OFFLINE");
    if ((status & 0x00000100) != 0) parts.Add("IO_ACTIVE");
    if ((status & 0x00000200) != 0) parts.Add("BUSY");
    if ((status & 0x00000400) != 0) parts.Add("PRINTING");
    if ((status & 0x00000800) != 0) parts.Add("OUTPUT_BIN_FULL");
    if ((status & 0x00001000) != 0) parts.Add("NOT_AVAILABLE");
    if ((status & 0x00002000) != 0) parts.Add("WAITING");
    if ((status & 0x00004000) != 0) parts.Add("PROCESSING");
    if ((status & 0x00008000) != 0) parts.Add("INITIALIZING");
    if ((status & 0x00010000) != 0) parts.Add("WARMING_UP");
    if ((status & 0x00020000) != 0) parts.Add("TONER_LOW");
    if ((status & 0x00040000) != 0) parts.Add("NO_TONER");
    if ((status & 0x00080000) != 0) parts.Add("PAGE_PUNT");
    if ((status & 0x00100000) != 0) parts.Add("USER_INTERVENTION");
    if ((status & 0x00200000) != 0) parts.Add("OUT_OF_MEMORY");
    if ((status & 0x00400000) != 0) parts.Add("DOOR_OPEN");
    if ((status & 0x00800000) != 0) parts.Add("SERVER_UNKNOWN");
    if ((status & 0x01000000) != 0) parts.Add("POWER_SAVE");
    return string.Join(", ", parts) + " (0x" + status.ToString("X") + ")";
  }
}
"@

Write-Host "=== Windows Printer Diagnosis ===" -ForegroundColor Cyan
Write-Host "Target printer: '$TargetPrinter'"
Write-Host "Computer: $env:COMPUTERNAME"
Write-Host ""

Write-Host "--- Method 1: Get-Printer (PowerShell CIM) ---" -ForegroundColor Yellow
$cimPrinters = @(Get-Printer -ErrorAction SilentlyContinue)
Write-Host "Count: $($cimPrinters.Count)"
foreach ($p in $cimPrinters) {
  Write-Host ""
  Write-Host "Printer Name : $($p.Name)"
  Write-Host "Share Name   : $($p.ShareName)"
  Write-Host "Driver Name  : $($p.DriverName)"
  Write-Host "Port Name    : $($p.PortName)"
  Write-Host "PrinterStatus: $($p.PrinterStatus)"
  Write-Host "Is Default   : $($p.Default)"
  Write-Host "Work Offline : $($p.WorkOffline)"
  Write-Host "Queue Status : $($p.JobCount) job(s) in queue"
  Write-Host "Published    : $($p.Published)"
  Write-Host "Type         : $($p.Type)"
}

Write-Host ""
Write-Host "--- Method 2: Win32_Printer (WMI) ---" -ForegroundColor Yellow
$wmiPrinters = @(Get-CimInstance Win32_Printer -ErrorAction SilentlyContinue)
Write-Host "Count: $($wmiPrinters.Count)"
foreach ($p in $wmiPrinters) {
  Write-Host ""
  Write-Host "Printer Name : $($p.Name)"
  Write-Host "Share Name   : $($p.ShareName)"
  Write-Host "Driver Name  : $($p.DriverName)"
  Write-Host "Port Name    : $($p.PortName)"
  Write-Host "PrinterStatus: $($p.PrinterStatus)"
  Write-Host "Is Default   : $($p.Default)"
  Write-Host "Work Offline : $($p.WorkOffline)"
  Write-Host "Queue Status : $($p.JobCountSinceLastReset) jobs since reset; PrinterState=$($p.PrinterState)"
  Write-Host "Local        : $($p.Local)"
  Write-Host "Network      : $($p.Network)"
  Write-Host "Shared       : $($p.Shared)"
  Write-Host "Status       : $($p.Status)"
}

Write-Host ""
Write-Host "--- Exact name check ---" -ForegroundColor Yellow
$exact = $cimPrinters | Where-Object { $_.Name -ceq $TargetPrinter }
$caseInsensitive = $cimPrinters | Where-Object { $_.Name -eq $TargetPrinter }
Write-Host "Exact case-sensitive match (-ceq): $(if ($exact) { 'YES' } else { 'NO' })"
Write-Host "Case-insensitive match (-eq):      $(if ($caseInsensitive) { 'YES' } else { 'NO' })"

if (-not $exact -and -not $caseInsensitive) {
  Write-Host ""
  Write-Host "Printer '$TargetPrinter' was NOT found." -ForegroundColor Red
  Write-Host "All installed printer names:" -ForegroundColor Red
  $i = 0
  foreach ($name in ($cimPrinters | ForEach-Object { $_.Name } | Sort-Object)) {
    $i++
    Write-Host ("  [{0}] '{1}'" -f $i, $name)
  }
} else {
  $match = if ($exact) { $exact } else { $caseInsensitive }
  Write-Host ""
  Write-Host "Matched printer details:" -ForegroundColor Green
  Write-Host "  Name         : $($match.Name)"
  Write-Host "  Driver       : $($match.DriverName)"
  Write-Host "  Port         : $($match.PortName)"
  Write-Host "  Work Offline : $($match.WorkOffline)"
  Write-Host "  Status       : $($match.PrinterStatus)"
}

Write-Host ""
Write-Host "--- OpenPrinter tests ---" -ForegroundColor Yellow

function Test-OpenPrinterUnicode {
  param([string]$Name)
  $handle = [IntPtr]::Zero
  $ok = [WinSpoolDiag]::OpenPrinter($Name, [ref]$handle, [IntPtr]::Zero)
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Host ""
  Write-Host "API: OpenPrinter (Unicode)"
  Write-Host "Name passed: '$Name'"
  Write-Host "OpenPrinter result: $ok"
  if (-not $ok) {
    Write-Host "Win32 error code: $err (0x$($err.ToString('X8')))" -ForegroundColor Red
    Write-Host "Win32 description: $(Get-Win32ErrorMessage -ErrorCode $err)" -ForegroundColor Red
  } else {
    Write-Host "Handle: 0x$($handle.ToString('X'))" -ForegroundColor Green
    [void][WinSpoolDiag]::ClosePrinter($handle)
  }
}

function Test-OpenPrinterAnsi {
  param([string]$Name)
  $handle = [IntPtr]::Zero
  $ok = [WinSpoolDiag]::OpenPrinterA($Name, [ref]$handle, [IntPtr]::Zero)
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Host ""
  Write-Host "API: OpenPrinterA (ANSI - used by raw-spooler.ps1)"
  Write-Host "Name passed: '$Name'"
  Write-Host "OpenPrinter result: $ok"
  if (-not $ok) {
    Write-Host "Win32 error code: $err (0x$($err.ToString('X8')))" -ForegroundColor Red
    Write-Host "Win32 description: $(Get-Win32ErrorMessage -ErrorCode $err)" -ForegroundColor Red
  } else {
    Write-Host "Handle: 0x$($handle.ToString('X'))" -ForegroundColor Green
    [void][WinSpoolDiag]::ClosePrinter($handle)
  }
}

Test-OpenPrinterUnicode -Name $TargetPrinter
Test-OpenPrinterAnsi -Name $TargetPrinter

if ($cimPrinters.Count -gt 0) {
  $firstName = $cimPrinters[0].Name
  Test-OpenPrinterAnsi -Name $firstName
}

if ($SendTest) {
  Write-Host ""
  Write-Host "--- RAW ESC/POS test (OpenPrinterA + WritePrinter) ---" -ForegroundColor Yellow

  # ESC @ (init) + center + text + feed
  $textBytes = [System.Text.Encoding]::ASCII.GetBytes("Windows RAW test`n")
  $prefix = [byte[]](0x1B, 0x40, 0x1B, 0x61, 0x01)
  $suffix = [byte[]](0x1B, 0x64, 0x03)
  $payload = New-Object byte[] ($prefix.Length + $textBytes.Length + $suffix.Length)
  [Array]::Copy($prefix, 0, $payload, 0, $prefix.Length)
  [Array]::Copy($textBytes, 0, $payload, $prefix.Length, $textBytes.Length)
  [Array]::Copy($suffix, 0, $payload, $prefix.Length + $textBytes.Length, $suffix.Length)

  $handle = [IntPtr]::Zero
  if (-not [WinSpoolDiag]::OpenPrinterA($TargetPrinter, [ref]$handle, [IntPtr]::Zero)) {
    $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Host "OpenPrinterA FAILED for '$TargetPrinter'" -ForegroundColor Red
    Write-Host "Win32 error code: $err (0x$($err.ToString('X8')))"
    Write-Host "Win32 description: $(Get-Win32ErrorMessage -ErrorCode $err)"
    exit 1
  }

  try {
    $doc = New-Object WinSpoolDiag+DOCINFOA
    $doc.pDocName = "ESC/POS RAW TEST"
    $doc.pDataType = "RAW"

    if (-not [WinSpoolDiag]::StartDocPrinterA($handle, 1, $doc)) {
      $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
      throw "StartDocPrinterA failed. Win32=$err $(Get-Win32ErrorMessage -ErrorCode $err)"
    }
    try {
      if (-not [WinSpoolDiag]::StartPagePrinter($handle)) {
        $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
        throw "StartPagePrinter failed. Win32=$err $(Get-Win32ErrorMessage -ErrorCode $err)"
      }
      try {
        $unmanaged = [Runtime.InteropServices.Marshal]::AllocHGlobal($payload.Length)
        try {
          [Runtime.InteropServices.Marshal]::Copy($payload, 0, $unmanaged, $payload.Length)
          $written = 0
          if (-not [WinSpoolDiag]::WritePrinter($handle, $unmanaged, $payload.Length, [ref]$written)) {
            $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
            throw "WritePrinter failed. Win32=$err $(Get-Win32ErrorMessage -ErrorCode $err)"
          }
          Write-Host "WritePrinter OK: $written bytes sent" -ForegroundColor Green
        } finally {
          [Runtime.InteropServices.Marshal]::FreeHGlobal($unmanaged)
        }
      } finally {
        [void][WinSpoolDiag]::EndPagePrinter($handle)
      }
    } finally {
      [void][WinSpoolDiag]::EndDocPrinter($handle)
    }
  } finally {
    if ($handle -ne [IntPtr]::Zero) {
      [void][WinSpoolDiag]::ClosePrinter($handle)
    }
  }

  Write-Host "RAW test completed successfully." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
