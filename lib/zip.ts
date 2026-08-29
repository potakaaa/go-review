const encoder = new TextEncoder();

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((size, chunk) => size + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

/** CRC-32 used by the ZIP file format. */
export function crc32(data: Uint8Array): number {
  let checksum = 0xffffffff;

  for (const byte of data) {
    checksum ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      checksum =
        (checksum >>> 1) ^ (0xedb88320 & -(checksum & 1));
    }
  }

  return (checksum ^ 0xffffffff) >>> 0;
}

/**
 * Creates a standards-compliant ZIP using the store method.
 *
 * QR PNGs are already compressed, so deflating them again would add CPU time
 * without making the download meaningfully smaller.
 */
export function createZip(entries: ZipEntry[]): Uint8Array {
  if (entries.length > 0xffff) {
    throw new Error("ZIP files cannot contain more than 65,535 entries.");
  }

  const localFiles: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data;
    const checksum = crc32(data);

    if (name.length > 0xffff || data.length > 0xffffffff) {
      throw new Error("ZIP entry is too large.");
    }

    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0x800);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, checksum);
    writeUint32(localView, 18, data.length);
    writeUint32(localView, 22, data.length);
    writeUint16(localView, 26, name.length);
    writeUint16(localView, 28, 0);
    localHeader.set(name, 30);
    localFiles.push(concat([localHeader, data]));

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0x800);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint32(centralView, 16, checksum);
    writeUint32(centralView, 20, data.length);
    writeUint32(centralView, 24, data.length);
    writeUint16(centralView, 28, name.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, localOffset);
    centralHeader.set(name, 46);
    centralDirectory.push(centralHeader);

    localOffset += localHeader.length + data.length;
  }

  const central = concat(centralDirectory);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, central.length);
  writeUint32(endView, 16, localOffset);
  writeUint16(endView, 20, 0);

  return concat([...localFiles, central, end]);
}
