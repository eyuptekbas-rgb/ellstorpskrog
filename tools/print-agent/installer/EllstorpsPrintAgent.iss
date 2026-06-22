; Ellstorps Print Agent — Inno Setup installer script
#define MyAppName "Ellstorps Print Agent"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "Ellstorps Krog"
#define MyAppURL "http://127.0.0.1:9211"
#define MyAppExeName "run.cjs"

[Setup]
AppId={{A7B3C9D1-4E2F-4A8B-9C1D-2E3F4A5B6C7D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\EllstorpsKrog\PrintAgent
DefaultGroupName=Ellstorps Krog
DisableProgramGroupPage=yes
OutputBaseFilename=EllstorpsPrintAgentSetup
OutputDir=..\..\..\dist
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\node\node.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "swedish"; MessagesFile: "compiler:Languages\Swedish.isl"

[Files]
Source: "..\dist\staging\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "install-service.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "uninstall-service.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "inspect-service-config.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion

[Icons]
Name: "{group}\Print Agent Configuration"; Filename: "http://127.0.0.1:9211/"; IconFilename: "{app}\node\node.exe"
Name: "{group}\Print Agent Diagnostics"; Filename: "http://127.0.0.1:9211/diagnostics"; IconFilename: "{app}\node\node.exe"

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\install-service.ps1"" -InstallDir ""{app}"""; Flags: runhidden waituntilterminated; StatusMsg: "Starting Print Agent service..."

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\uninstall-service.ps1"" -InstallDir ""{app}"""; Flags: runhidden waituntilterminated

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
