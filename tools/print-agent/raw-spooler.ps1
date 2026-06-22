param(
  [Parameter(Mandatory = $true)]
  [string]$PrinterName,
  [Parameter(Mandatory = $true)]
  [string]$FilePath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $FilePath)) {
  throw "File not found: $FilePath"
}

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);

  [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
}
"@

$bytes = [System.IO.File]::ReadAllBytes($FilePath)
if ($bytes.Length -eq 0) {
  throw "Empty print payload."
}

$handle = [IntPtr]::Zero
if (-not [RawPrinterHelper]::OpenPrinter($PrinterName, [ref]$handle, [IntPtr]::Zero)) {
  throw "OpenPrinter failed for '$PrinterName'."
}

try {
  $docInfo = New-Object RawPrinterHelper+DOCINFOA
  $docInfo.pDocName = "ESC/POS RAW"
  $docInfo.pDataType = "RAW"

  if (-not [RawPrinterHelper]::StartDocPrinter($handle, 1, $docInfo)) {
    throw "StartDocPrinter failed."
  }

  try {
    if (-not [RawPrinterHelper]::StartPagePrinter($handle)) {
      throw "StartPagePrinter failed."
    }

    try {
      $unmanaged = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
      try {
        [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $unmanaged, $bytes.Length)
        $written = 0
        if (-not [RawPrinterHelper]::WritePrinter($handle, $unmanaged, $bytes.Length, [ref]$written)) {
          throw "WritePrinter failed."
        }
        if ($written -ne $bytes.Length) {
          throw "WritePrinter wrote $written of $($bytes.Length) bytes."
        }
      }
      finally {
        [System.Runtime.InteropServices.Marshal]::FreeHGlobal($unmanaged)
      }
    }
    finally {
      [void][RawPrinterHelper]::EndPagePrinter($handle)
    }
  }
  finally {
    [void][RawPrinterHelper]::EndDocPrinter($handle)
  }
}
finally {
  if ($handle -ne [IntPtr]::Zero) {
    [void][RawPrinterHelper]::ClosePrinter($handle)
  }
}

Write-Output "OK"
