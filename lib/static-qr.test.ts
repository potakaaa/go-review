import { describe, expect, it } from "vitest";

import {
  DEFAULT_QR_STYLE,
  QR_PRESETS,
  QrTooLongError,
  encodeQrContent,
  fieldsProblem,
  normalizeUrl,
  parseStyle,
  renderQrSvg,
  staticQrFileName,
  styleProblem,
} from "@/lib/static-qr";

describe("encodeQrContent", () => {
  it("encodes a website directly, never through goreview.site", () => {
    expect(encodeQrContent({ kind: "url", url: "menu.example.com/today" })).toBe(
      "https://menu.example.com/today",
    );
  });

  it("escapes Wi-Fi delimiters so a semicolon in a password survives", () => {
    expect(
      encodeQrContent({ kind: "wifi", ssid: "Cafe;Guest", password: 'p:a"ss\\', security: "WPA", hidden: false }),
    ).toBe('WIFI:T:WPA;S:Cafe\\;Guest;P:p\\:a\\"ss\\\\;;');
  });

  it("leaves the password out of an open network and flags hidden ones", () => {
    expect(
      encodeQrContent({ kind: "wifi", ssid: "Lobby", password: "ignored", security: "nopass", hidden: true }),
    ).toBe("WIFI:T:nopass;S:Lobby;H:true;;");
  });

  it("writes email spaces as %20 rather than +", () => {
    expect(
      encodeQrContent({ kind: "email", to: "hi@example.com", subject: "Table booking", body: "" }),
    ).toBe("mailto:hi@example.com?subject=Table%20booking");
  });

  it("strips phone formatting", () => {
    expect(encodeQrContent({ kind: "phone", phone: "+63 (917) 123-4567" })).toBe("tel:+639171234567");
    expect(encodeQrContent({ kind: "sms", phone: "0917 123 4567", message: "Hi" })).toBe("SMSTO:09171234567:Hi");
  });
});

describe("validation", () => {
  it("rejects non-web schemes and bare words as websites", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("hello")).toBeNull();
    expect(fieldsProblem({ kind: "url", url: "hello" })).toMatch(/full website/);
  });

  it("requires a password unless the network is open", () => {
    expect(fieldsProblem({ kind: "wifi", ssid: "Cafe", password: "", security: "WPA", hidden: false })).toMatch(/password/);
    expect(fieldsProblem({ kind: "wifi", ssid: "Cafe", password: "", security: "nopass", hidden: false })).toBeNull();
  });

  it("rejects light-on-dark and low-contrast colours", () => {
    expect(styleProblem({ ...DEFAULT_QR_STYLE, foreground: "#ffffff", background: "#000000" })).toMatch(/darker/);
    expect(styleProblem({ ...DEFAULT_QR_STYLE, foreground: "#bbbbbb" })).toMatch(/too close/);
    expect(styleProblem({ ...DEFAULT_QR_STYLE, gradientTo: "#eeeeee" })).toMatch(/too close/);
  });

  it("ships only presets that pass its own contrast rules", () => {
    for (const preset of QR_PRESETS) expect(styleProblem(preset.style), preset.name).toBeNull();
  });

  it("falls back to the default for a corrupt stored style", () => {
    expect(parseStyle({ moduleShape: "hexagon" })).toEqual(DEFAULT_QR_STYLE);
    expect(parseStyle({ foreground: "#123456" }).foreground).toBe("#123456");
  });
});

describe("renderQrSvg", () => {
  it("draws every shape combination without throwing", () => {
    for (const preset of QR_PRESETS) {
      const svg = renderQrSvg("https://example.com", preset.style, { title: "<Menu>" });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("<title>&#60;Menu&#62;</title>");
    }
  });

  it("includes the quiet zone in the view box", () => {
    // "hi" fits version 1 (21 modules) at level L.
    const svg = renderQrSvg("hi", { ...DEFAULT_QR_STYLE, errorCorrection: "L", margin: 4 });
    expect(svg).toContain('viewBox="0 0 29 29"');
  });

  it("omits the background when transparent", () => {
    const svg = renderQrSvg("hi", { ...DEFAULT_QR_STYLE, transparent: true });
    expect(svg).not.toContain("<rect");
  });

  it("reports content too long for a QR code", () => {
    expect(() => renderQrSvg("x".repeat(3000), DEFAULT_QR_STYLE)).toThrow(QrTooLongError);
  });
});

describe("staticQrFileName", () => {
  it("slugs the label", () => {
    expect(staticQrFileName("Café Wi-Fi")).toBe("cafe-wi-fi-qr");
    expect(staticQrFileName("!!!")).toBe("static-qr");
  });
});
