import QRCode from "qrcode";
import { z } from "zod";

/**
 * Static QR codes: the payload goes straight into the pattern, so a scan never
 * touches goreview.site. Nothing to expire, nothing to rate-limit -- and
 * nothing to change after printing, which is the trade-off staff accept.
 *
 * Pure and isomorphic: the designer previews with it in the browser, the
 * library renders thumbnails with it on the server, and the downloads use the
 * same SVG, so what is saved is exactly what gets printed.
 */

export const QR_KINDS = [
  { id: "url", label: "Website" },
  { id: "text", label: "Text" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "sms", label: "SMS" },
] as const;

export type QrKind = (typeof QR_KINDS)[number]["id"];

const trimmed = (max: number) => z.string().trim().max(max);

export const qrFieldsSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("url"),
    url: trimmed(1500).min(1, "Enter a website address."),
  }),
  z.object({
    kind: z.literal("text"),
    text: z.string().max(1500).refine((value) => value.trim().length > 0, "Enter the text to encode."),
  }),
  z.object({
    kind: z.literal("wifi"),
    ssid: trimmed(64).min(1, "Enter the network name."),
    password: z.string().max(64),
    security: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean(),
  }),
  z.object({
    kind: z.literal("email"),
    to: z.email("Enter a valid email address.").max(254),
    subject: trimmed(200),
    body: z.string().max(800),
  }),
  z.object({
    kind: z.literal("phone"),
    phone: trimmed(32).regex(/^\+?[0-9 ()-]{3,}$/, "Enter a phone number."),
  }),
  z.object({
    kind: z.literal("sms"),
    phone: trimmed(32).regex(/^\+?[0-9 ()-]{3,}$/, "Enter a phone number."),
    message: z.string().max(600),
  }),
]);

export type QrFields = z.infer<typeof qrFieldsSchema>;

export function emptyFields(kind: QrKind): QrFields {
  switch (kind) {
    case "url": return { kind, url: "" };
    case "text": return { kind, text: "" };
    case "wifi": return { kind, ssid: "", password: "", security: "WPA", hidden: false };
    case "email": return { kind, to: "", subject: "", body: "" };
    case "phone": return { kind, phone: "" };
    case "sms": return { kind, phone: "", message: "" };
  }
}

/** Wi-Fi payloads backslash-escape their own delimiters. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

const compactPhone = (phone: string) => phone.replace(/[^\d+]/g, "");

/** `example.com` -> `https://example.com`; anything else must already be http(s). */
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return withScheme;
  } catch {
    return null;
  }
}

/** The exact string a scanner reads back. */
export function encodeQrContent(fields: QrFields): string {
  switch (fields.kind) {
    case "url":
      return normalizeUrl(fields.url) ?? fields.url.trim();
    case "text":
      return fields.text;
    case "wifi": {
      const parts = [`T:${fields.security}`, `S:${escapeWifi(fields.ssid)}`];
      if (fields.security !== "nopass") parts.push(`P:${escapeWifi(fields.password)}`);
      if (fields.hidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }
    case "email": {
      const query = new URLSearchParams();
      if (fields.subject) query.set("subject", fields.subject);
      if (fields.body) query.set("body", fields.body);
      // URLSearchParams writes spaces as "+", which mail apps show literally.
      const suffix = query.toString().replace(/\+/g, "%20");
      return `mailto:${fields.to}${suffix ? `?${suffix}` : ""}`;
    }
    case "phone":
      return `tel:${compactPhone(fields.phone)}`;
    case "sms":
      return `SMSTO:${compactPhone(fields.phone)}:${fields.message}`;
  }
}

/** Validates fields beyond their shape. Returns a message, or null when encodable. */
export function fieldsProblem(fields: QrFields): string | null {
  const parsed = qrFieldsSchema.safeParse(fields);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Check the details.";
  if (fields.kind === "url" && !normalizeUrl(fields.url)) {
    return "Enter a full website address, like https://example.com.";
  }
  if (fields.kind === "wifi" && fields.security !== "nopass" && !fields.password) {
    return "Enter the Wi-Fi password, or choose an open network.";
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Style                                                                     */
/* ------------------------------------------------------------------------ */

export const MODULE_SHAPES = [
  { id: "square", label: "Square" },
  { id: "soft", label: "Soft" },
  { id: "rounded", label: "Fluid" },
  { id: "dots", label: "Dots" },
  { id: "diamond", label: "Diamond" },
] as const;

/**
 * Scanners confirm an eye by measuring dark:light:dark:light:dark = 1:1:3:1:1
 * across it -- diagonally as well as straight. Mixing a round centre with a
 * square frame breaks that ratio on the diagonal, so frame and centre always
 * share one shape.
 */
export const EYE_SHAPES = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
] as const;

type Ids<T extends readonly { id: string }[]> = T[number]["id"];
const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((item) => item.id) as [Ids<T>, ...Ids<T>[]];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour.");

export const qrStyleSchema = z.object({
  moduleShape: z.enum(ids(MODULE_SHAPES)),
  eyes: z.enum(ids(EYE_SHAPES)),
  foreground: hex,
  /** Second stop of a top-left to bottom-right gradient; null for a flat colour. */
  gradientTo: hex.nullable(),
  eyeColor: hex,
  background: hex,
  transparent: z.boolean(),
  margin: z.number().int().min(2).max(8),
  errorCorrection: z.enum(["L", "M", "Q", "H"]),
});

export type QrStyle = z.infer<typeof qrStyleSchema>;

/** Matches the printed review cards: high error correction, full quiet zone. */
export const DEFAULT_QR_STYLE: QrStyle = {
  moduleShape: "square",
  eyes: "square",
  foreground: "#000000",
  gradientTo: null,
  eyeColor: "#000000",
  background: "#ffffff",
  transparent: false,
  margin: 4,
  errorCorrection: "H",
};

/** Curated starting points -- each one checked to scan on a phone camera. */
export const QR_PRESETS: Array<{ name: string; style: QrStyle }> = [
  { name: "Classic", style: DEFAULT_QR_STYLE },
  {
    name: "Soft ink",
    style: { ...DEFAULT_QR_STYLE, moduleShape: "rounded", eyes: "rounded", foreground: "#1f2937", eyeColor: "#111827" },
  },
  {
    name: "Dotted",
    style: { ...DEFAULT_QR_STYLE, moduleShape: "dots", eyes: "circle", foreground: "#0f172a", eyeColor: "#0f172a" },
  },
  {
    name: "Ocean",
    style: { ...DEFAULT_QR_STYLE, moduleShape: "soft", eyes: "rounded", foreground: "#1a56db", gradientTo: "#0b3aa4", eyeColor: "#0b3aa4" },
  },
  {
    name: "Sunset",
    style: { ...DEFAULT_QR_STYLE, moduleShape: "rounded", eyes: "rounded", foreground: "#c2410c", gradientTo: "#9d174d", eyeColor: "#7c2d12" },
  },
  {
    name: "Forest",
    style: { ...DEFAULT_QR_STYLE, moduleShape: "diamond", eyes: "circle", foreground: "#14532d", eyeColor: "#14532d", background: "#f0fdf4" },
  },
];

/** Parses stored or submitted style, filling anything missing from the default. */
export function parseStyle(value: unknown): QrStyle {
  const merged = { ...DEFAULT_QR_STYLE, ...(value && typeof value === "object" ? value : {}) };
  const parsed = qrStyleSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_QR_STYLE;
}

function luminance(color: string): number {
  const channel = (index: number) => {
    const value = parseInt(color.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Below this, plenty of phone cameras give up. */
export const MIN_CONTRAST = 3;

/**
 * The weakest contrast anywhere in the code. A transparent background is
 * judged against white paper; the pattern must be the darker side, because
 * many scanners still cannot read inverted codes.
 */
export function styleProblem(style: QrStyle): string | null {
  const paper = style.transparent ? "#ffffff" : style.background;
  const inks = [style.foreground, style.eyeColor, ...(style.gradientTo ? [style.gradientTo] : [])];
  for (const ink of inks) {
    if (luminance(ink) >= luminance(paper)) {
      return "The pattern must be darker than the background. Light-on-dark codes fail on many phones.";
    }
    if (contrastRatio(ink, paper) < MIN_CONTRAST) {
      return "These colours are too close together to scan reliably. Darken the pattern or lighten the background.";
    }
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Rendering                                                                 */
/* ------------------------------------------------------------------------ */

export class QrTooLongError extends Error {
  constructor() {
    super("This is too much to fit in one QR code. Shorten it, or lower the error correction.");
  }
}

export function qrMatrix(content: string, errorCorrection: QrStyle["errorCorrection"]) {
  try {
    return QRCode.create(content, { errorCorrectionLevel: errorCorrection }).modules;
  } catch {
    throw new QrTooLongError();
  }
}

const n = (value: number) => Number(value.toFixed(3)).toString();

function rect(x: number, y: number, w: number, h: number): string {
  return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
}

/** A rectangle with an independent radius per corner (tl, tr, br, bl). */
function roundedRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: number[]): string {
  return [
    `M${n(x + tl)} ${n(y)}`,
    `H${n(x + w - tr)}`,
    tr ? `A${n(tr)} ${n(tr)} 0 0 1 ${n(x + w)} ${n(y + tr)}` : "",
    `V${n(y + h - br)}`,
    br ? `A${n(br)} ${n(br)} 0 0 1 ${n(x + w - br)} ${n(y + h)}` : "",
    `H${n(x + bl)}`,
    bl ? `A${n(bl)} ${n(bl)} 0 0 1 ${n(x)} ${n(y + h - bl)}` : "",
    `V${n(y + tl)}`,
    tl ? `A${n(tl)} ${n(tl)} 0 0 1 ${n(x + tl)} ${n(y)}` : "",
    "z",
  ].join("");
}

function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;
}

function diamond(cx: number, cy: number, r: number): string {
  return `M${n(cx)} ${n(cy - r)}L${n(cx + r)} ${n(cy)}L${n(cx)} ${n(cy + r)}L${n(cx - r)} ${n(cy)}z`;
}

/** The three 7x7 finder patterns ("eyes"), drawn separately so they can be styled. */
function isFinder(row: number, col: number, size: number): boolean {
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= size - 7) ||
    (row >= size - 7 && col < 7)
  );
}

function eyeFrame(x: number, y: number, shape: QrStyle["eyes"]): string {
  // Drawn as outer minus inner with the even-odd rule: a 7x7 ring, 1 module wide.
  switch (shape) {
    case "square":
      return rect(x, y, 7, 7) + rect(x + 1, y + 1, 5, 5);
    case "rounded":
      return roundedRect(x, y, 7, 7, [2, 2, 2, 2]) + roundedRect(x + 1, y + 1, 5, 5, [1.2, 1.2, 1.2, 1.2]);
    case "circle":
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
  }
}

function eyeBall(x: number, y: number, shape: QrStyle["eyes"]): string {
  switch (shape) {
    case "square":
      return rect(x + 2, y + 2, 3, 3);
    case "rounded":
      return roundedRect(x + 2, y + 2, 3, 3, [0.9, 0.9, 0.9, 0.9]);
    case "circle":
      return circle(x + 3.5, y + 3.5, 1.5);
  }
}

/**
 * Renders a styled QR code as a standalone SVG document. Coordinates are in
 * modules, so the SVG scales to any print size without losing an edge.
 */
export function renderQrSvg(content: string, style: QrStyle, { title }: { title?: string } = {}): string {
  const matrix = qrMatrix(content, style.errorCorrection);
  const size = matrix.size;
  const dark = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < size && col < size && matrix.get(row, col) === 1;

  const m = style.margin;
  const modules: string[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!dark(row, col) || isFinder(row, col, size)) continue;
      const x = col + m;
      const y = row + m;
      // Timing, alignment and format modules stay solid: scanners locate them
      // by measuring runs of dark and light, which gaps between dots break.
      const shape = matrix.reservedBit[row * size + col] && style.moduleShape !== "rounded"
        ? "square"
        : style.moduleShape;
      switch (shape) {
        case "square":
          modules.push(rect(x, y, 1, 1));
          break;
        case "soft":
          modules.push(roundedRect(x + 0.05, y + 0.05, 0.9, 0.9, [0.25, 0.25, 0.25, 0.25]));
          break;
        case "dots":
          modules.push(circle(x + 0.5, y + 0.5, 0.45));
          break;
        case "diamond":
          modules.push(diamond(x + 0.5, y + 0.5, 0.6));
          break;
        case "rounded": {
          // Round only the corners with no neighbour on either side, so runs
          // of modules flow together like ink rather than breaking into tiles.
          const up = dark(row - 1, col);
          const down = dark(row + 1, col);
          const left = dark(row, col - 1);
          const right = dark(row, col + 1);
          const r = 0.5;
          modules.push(
            roundedRect(x, y, 1, 1, [
              !up && !left ? r : 0,
              !up && !right ? r : 0,
              !down && !right ? r : 0,
              !down && !left ? r : 0,
            ]),
          );
          break;
        }
      }
    }
  }

  const corners: Array<[number, number]> = [
    [m, m],
    [m + size - 7, m],
    [m, m + size - 7],
  ];
  const frames = corners.map(([x, y]) => eyeFrame(x, y, style.eyes)).join("");
  const balls = corners.map(([x, y]) => eyeBall(x, y, style.eyes)).join("");

  const total = size + 2 * m;
  const fill = style.gradientTo ? "url(#qr-ink)" : style.foreground;
  const gradient = style.gradientTo
    ? `<defs><linearGradient id="qr-ink" x1="0" y1="0" x2="${total}" y2="${total}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${style.foreground}"/><stop offset="1" stop-color="${style.gradientTo}"/></linearGradient></defs>`
    : "";
  const titleTag = title ? `<title>${escapeXml(title)}</title>` : "";
  const background = style.transparent ? "" : `<rect width="${total}" height="${total}" fill="${style.background}"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision">` +
    titleTag +
    gradient +
    background +
    `<path fill="${fill}" d="${modules.join("")}"/>` +
    `<path fill="${style.eyeColor}" fill-rule="evenodd" d="${frames}"/>` +
    `<path fill="${style.eyeColor}" d="${balls}"/>` +
    `</svg>`
  );
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** `Front door Wi-Fi` -> `front-door-wi-fi-qr`. */
export function staticQrFileName(label: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base ? `${base}-qr` : "static-qr";
}

/** One-line summary of a code, shown after its type in the library list. */
export function describeFields(fields: QrFields): string {
  switch (fields.kind) {
    case "url": return normalizeUrl(fields.url) ?? fields.url;
    case "text": return fields.text.replace(/\s+/g, " ").slice(0, 140);
    case "wifi": return fields.ssid;
    case "email": return fields.to;
    case "phone": return fields.phone;
    case "sms": return fields.phone;
  }
}
