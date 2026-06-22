# Printer Setup

## Browser printing (default)

Works out of the box via `lib/printing/providers/browser-print.ts`.

Configure roles at **Admin → Restaurant RMS** (`/admin/restaurant`):

| Role | Use |
|------|-----|
| receipt | Customer receipts |
| kitchen | Kitchen tickets |
| bar | Bar station |
| dessert | Dessert station |

## Routing

`lib/printing/routing.ts` selects printer by role and optional category.

- Manual print: POS drawer actions, kitchen card print button
- Auto print: enable in terminal settings when new orders arrive
- Retry queue: failed jobs stored in localStorage, flushed every 30s
- History: localStorage audit of print attempts

## Hardware providers (stubs)

Interfaces in `lib/hardware/index.ts`:

- ESC/POS network
- USB
- Windows Print Spooler
- Android Print
- Cash drawer kick (`lib/printing/cash-drawer.ts`)

Set active provider via printer registry `providerId`.

## Operations

- Check print history in browser devtools → `rms-print-history`
- Retry queue → `rms-print-retry-queue`
- Printer events logged to audit log (`category: printer`)

## Production notes

For network ESC/POS, implement `hardwareProviders.escposNetwork.printRaw` and register provider in `lib/printing/printer.ts`.
