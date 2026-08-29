import { describe, expect, it } from "vitest";

import { createZip, crc32 } from "@/lib/zip";

describe("crc32", () => {
  it("matches the ZIP format checksum for a known value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("createZip", () => {
  it("writes UTF-8 entries that can be opened as a ZIP", () => {
    const archive = createZip([
      { name: "one.txt", data: new TextEncoder().encode("first") },
      { name: "café.txt", data: new TextEncoder().encode("second") },
    ]);
    const signature = new TextDecoder().decode(archive.slice(0, 4));

    expect(signature).toBe("PK\u0003\u0004");
    expect(new TextDecoder().decode(archive)).toContain("one.txt");
    expect(new TextDecoder().decode(archive)).toContain("café.txt");
    expect(new DataView(archive.buffer).getUint32(archive.length - 22, true)).toBe(
      0x06054b50,
    );
  });
});
