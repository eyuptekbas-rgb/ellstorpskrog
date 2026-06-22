export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64.trim(), "base64");
}

export function testReceiptEscPos(): Buffer {
  const text = Buffer.from("Ellstorps Krog\r\nTEST RECEIPT\r\n", "ascii");
  return Buffer.concat([
    Buffer.from([0x1b, 0x40]),
    Buffer.from([0x1b, 0x61, 0x01]),
    text,
    Buffer.from([0x1b, 0x64, 0x03]),
  ]);
}

export function testKitchenEscPos(): Buffer {
  const text = Buffer.from("KOK TEST\r\nOrder: TEST-001\r\n", "ascii");
  return Buffer.concat([
    Buffer.from([0x1b, 0x40]),
    Buffer.from([0x1b, 0x61, 0x01, 0x1b, 0x45, 0x01]),
    text,
    Buffer.from([0x1b, 0x45, 0x00]),
    Buffer.from([0x1b, 0x64, 0x03]),
  ]);
}

export function drawerPulseBuffer(): Buffer {
  return Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
}
