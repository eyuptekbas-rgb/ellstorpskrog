# Ellstorps Print Agent — Installation on ZQ-P1088 POS terminals

The full Next.js POS application runs on your **development server** (Lenovo). Each POS terminal only needs the **Print Agent** — a small local service on `http://127.0.0.1:9211` that sends ESC/POS data to the built-in thermal printer.

The browser on the terminal **never** sends print jobs to the cloud or the Next.js server for printing.

---

## What you need

| Item | Where |
|------|--------|
| `EllstorpsPrintAgentSetup.exe` | Built on dev machine (`npm run print-agent:build`) |
| USB stick or network share | To copy installer to terminal |
| Admin rights on terminal | Required for service install |

---

## Step 1 — Build the installer (dev machine only)

On your Lenovo development machine, in the project folder:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run print-agent:build
```

Output:

```
dist/EllstorpsPrintAgentSetup.exe
```

Copy this file to a USB stick or shared folder.

**Requirements on dev machine:** Node.js, npm, [Inno Setup 6](https://jrsoftware.org/isdl.php)

---

## Step 2 — Install on a new ZQ-P1088 terminal

1. Log in to Windows on the POS terminal as **Administrator**.
2. Copy `EllstorpsPrintAgentSetup.exe` to the terminal (Desktop is fine).
3. Double-click the installer and follow the wizard.
4. The installer will:
   - Install to `C:\Program Files\EllstorpsKrog\PrintAgent`
   - Store config/logs/queue in `C:\ProgramData\EllstorpsKrog\PrintAgent`
   - Register **EllstorpsPrintAgent** Windows Service (auto-start, restart on crash)
   - Start listening on `http://127.0.0.1:9211`

---

## Step 3 — Configure printers

1. Open a browser on the terminal and go to:

   **http://127.0.0.1:9211/**

2. Select printers (or leave **Auto-detect**):
   - **Kvitto** (receipt)
   - **Kök** (kitchen)
   - **Bar**
   - **Kassalåda** (cash drawer — uses receipt printer ESC/POS pulse)

3. Click **Test kvitto** to verify printing.

4. Click **Spara**.

If only one thermal printer is detected, it is auto-selected for all roles.

---

## Step 4 — Open the POS in the browser

Point the terminal browser to your dev server POS URL, for example:

```
http://192.168.1.78:3000/pos
```

Printing from POS buttons goes to `http://127.0.0.1:9211` only — not to the cloud.

---

## Diagnostics

Open **http://127.0.0.1:9211/diagnostics** to see:

- Detected Windows printers (name, driver, port, status)
- ESC/POS capability
- OpenPrinter test
- ESC/POS test
- Print test per printer

Logs: `C:\ProgramData\EllstorpsKrog\PrintAgent\agent.log`  
Service logs: `C:\ProgramData\EllstorpsKrog\PrintAgent\logs\`

---

## API (local only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/status` | Agent status + queue |
| GET | `/v1/printers` | List Windows printers |
| POST | `/v1/print/receipt` | Print receipt (`base64` body) |
| POST | `/v1/print/kitchen` | Print kitchen ticket |
| POST | `/v1/print/raw` | Raw ESC/POS |
| POST | `/v1/drawer/open` | Open cash drawer |

Configuration UI: `GET /`  
Diagnostics: `GET /diagnostics`

---

## Uninstall

1. **Settings → Apps → Installed apps**
2. Find **Ellstorps Print Agent** → Uninstall

This stops and removes the Windows Service and application files.  
Data in `C:\ProgramData\EllstorpsKrog\PrintAgent` may remain — delete manually if needed.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| POS says printer not configured | Open `http://127.0.0.1:9211/` and save printer settings |
| Agent not running | Services → **EllstorpsPrintAgent** → Start |
| Service starts then stops immediately | Re-run installer (fixed in v1.0.1+). Check logs below. |
| Wrong printer selected | Diagnostics page → verify driver/port → save config |
| Print fails after reboot | Service should auto-start; check service logs in ProgramData |
| Firewall | Not required — agent listens on localhost only |

### Service crash logs

If the service stops immediately after start:

1. `C:\ProgramData\EllstorpsKrog\PrintAgent\logs\service-stderr.log`
2. `C:\ProgramData\EllstorpsKrog\PrintAgent\crash.log`

**Symptom:** `Error: Cannot find module 'C:\Program'`

**Cause:** NSSM was registered with `node.exe` + unquoted `run.cjs` path under `Program Files`.

**Fix (v1.0.1+):** Service Application must be `EllstorpsPrintAgent.exe` with **empty** AppParameters.

Inspect after install (Administrator PowerShell):

```powershell
cd "C:\Program Files\EllstorpsKrog\PrintAgent\installer"
powershell -NoProfile -ExecutionPolicy Bypass -File .\inspect-service-config.ps1 -Strict
```

Expected:

| NSSM field | Value |
|------------|-------|
| Application | `C:\Program Files\EllstorpsKrog\PrintAgent\EllstorpsPrintAgent.exe` |
| AppParameters | *(empty)* |
| AppDirectory | `C:\Program Files\EllstorpsKrog\PrintAgent` |

Application must **NOT** be `node.exe` or `run.cjs`.

Re-register service:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-service.ps1
```

---

## Dev mode (Lenovo only)

For development on the laptop without the installer:

```powershell
npm run print-agent
```

Config UI: http://127.0.0.1:9211/

---

## Service details

| Setting | Value |
|---------|--------|
| Service name | `EllstorpsPrintAgent` |
| URL | `http://127.0.0.1:9211` |
| Install path | `C:\Program Files\EllstorpsKrog\PrintAgent` |
| Data path | `C:\ProgramData\EllstorpsKrog\PrintAgent` |
| Restart policy | Auto-restart on crash (NSSM) |
