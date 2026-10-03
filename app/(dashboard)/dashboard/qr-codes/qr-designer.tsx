"use client";

import { useActionState, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { useActionFeedback } from "@/components/feedback";
import { Button, FormError, Spinner } from "@/components/ui";
import {
  DEFAULT_QR_STYLE,
  EYE_SHAPES,
  MODULE_SHAPES,
  QR_KINDS,
  QR_PRESETS,
  emptyFields,
  encodeQrContent,
  fieldsProblem,
  renderQrSvg,
  staticQrFileName,
  styleProblem,
  svgDataUrl,
  type QrFields,
  type QrKind,
  type QrStyle,
} from "@/lib/static-qr";
import { deleteQrCode, saveQrCode } from "./actions";

const fieldClass =
  "mt-2 block w-full rounded-lg border border-line-strong bg-canvas px-3 py-3 text-ink focus:outline-2 focus:outline-ink";

const SAMPLE = "https://example.com";

const EC_HELP: Record<QrStyle["errorCorrection"], string> = {
  L: "Low · smallest pattern",
  M: "Medium · screens, clean prints",
  Q: "Quartile · printed signage",
  H: "High · survives wear",
};

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={`min-h-10 rounded-full border px-3.5 text-xs font-medium transition-colors ${
              value === option.id
                ? "border-ink bg-ink text-canvas"
                : "border-line-strong text-muted hover:bg-elevated hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  return (
    <div className={disabled ? "opacity-50" : undefined}>
      <span className="text-sm">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-canvas p-1"
        />
        <input
          aria-label={`${label} hex value`}
          value={draft}
          disabled={disabled}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim();
            setDraft(next);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toLowerCase());
          }}
          className="block min-w-0 flex-1 rounded-lg border border-line-strong bg-canvas px-3 py-2.5 font-mono text-sm text-ink focus:outline-2 focus:outline-ink"
        />
      </div>
      {children}
    </div>
  );
}

function KindFields({ fields, onChange }: { fields: QrFields; onChange: (fields: QrFields) => void }) {
  switch (fields.kind) {
    case "url":
      return (
        <label className="block text-sm">
          Website address
          <input className={fieldClass} inputMode="url" autoComplete="off" placeholder="https://yourshop.com/menu" value={fields.url} maxLength={1500} onChange={(e) => onChange({ ...fields, url: e.target.value })} />
        </label>
      );
    case "text":
      return (
        <label className="block text-sm">
          Text
          <textarea className={fieldClass} rows={4} maxLength={1500} value={fields.text} onChange={(e) => onChange({ ...fields, text: e.target.value })} />
        </label>
      );
    case "wifi":
      return (
        <div className="space-y-5">
          <label className="block text-sm">
            Network name (SSID)
            <input className={fieldClass} autoComplete="off" maxLength={64} value={fields.ssid} onChange={(e) => onChange({ ...fields, ssid: e.target.value })} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              Security
              <select className={fieldClass} value={fields.security} onChange={(e) => onChange({ ...fields, security: e.target.value as typeof fields.security })}>
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open (no password)</option>
              </select>
            </label>
            {fields.security !== "nopass" ? (
              <label className="block text-sm">
                Password
                <input className={fieldClass} autoComplete="off" maxLength={64} value={fields.password} onChange={(e) => onChange({ ...fields, password: e.target.value })} />
              </label>
            ) : null}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-white" checked={fields.hidden} onChange={(e) => onChange({ ...fields, hidden: e.target.checked })} />
            Hidden network
          </label>
          <p className="text-xs leading-5 text-subtle">The password is saved with the design so staff can reopen it, and anyone who scans the code can read it.</p>
        </div>
      );
    case "email":
      return (
        <div className="space-y-5">
          <label className="block text-sm">
            Send to
            <input className={fieldClass} type="email" autoComplete="off" maxLength={254} value={fields.to} onChange={(e) => onChange({ ...fields, to: e.target.value })} />
          </label>
          <label className="block text-sm">
            Subject <span className="text-muted">(optional)</span>
            <input className={fieldClass} maxLength={200} value={fields.subject} onChange={(e) => onChange({ ...fields, subject: e.target.value })} />
          </label>
          <label className="block text-sm">
            Message <span className="text-muted">(optional)</span>
            <textarea className={fieldClass} rows={3} maxLength={800} value={fields.body} onChange={(e) => onChange({ ...fields, body: e.target.value })} />
          </label>
        </div>
      );
    case "phone":
      return (
        <label className="block text-sm">
          Phone number
          <input className={fieldClass} type="tel" placeholder="+63 917 123 4567" maxLength={32} value={fields.phone} onChange={(e) => onChange({ ...fields, phone: e.target.value })} />
        </label>
      );
    case "sms":
      return (
        <div className="space-y-5">
          <label className="block text-sm">
            Phone number
            <input className={fieldClass} type="tel" placeholder="+63 917 123 4567" maxLength={32} value={fields.phone} onChange={(e) => onChange({ ...fields, phone: e.target.value })} />
          </label>
          <label className="block text-sm">
            Message <span className="text-muted">(optional)</span>
            <textarea className={fieldClass} rows={3} maxLength={600} value={fields.message} onChange={(e) => onChange({ ...fields, message: e.target.value })} />
          </label>
        </div>
      );
  }
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Rasterises the exact SVG, so the PNG can never differ from the vector. */
async function svgToPng(svg: string, size: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, size, size);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function QrDesigner({
  initial,
  canManage = true,
}: {
  initial?: { id: string; label: string; fields: QrFields; style: QrStyle };
  /** View-only staff can still restyle and download; they just cannot save. */
  canManage?: boolean;
}) {
  const [state, action, pending] = useActionState(saveQrCode, {});
  useActionFeedback(state);
  const [deleting, startDelete] = useTransition();

  const [label, setLabel] = useState(initial?.label ?? "");
  const [fields, setFields] = useState<QrFields>(initial?.fields ?? emptyFields("url"));
  // Problems show once someone has typed, not on an empty new form.
  const [touched, setTouched] = useState(Boolean(initial));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [style, setStyle] = useState<QrStyle>(initial?.style ?? DEFAULT_QR_STYLE);
  const [pngSize, setPngSize] = useState(2048);
  const update = (patch: Partial<QrStyle>) => setStyle((current) => ({ ...current, ...patch }));

  // Draft fields stay per kind, so flipping Website -> Wi-Fi -> Website keeps the URL.
  const [drafts, setDrafts] = useState<Partial<Record<QrKind, QrFields>>>({});
  function switchKind(kind: QrKind) {
    setDrafts((current) => ({ ...current, [fields.kind]: fields }));
    setFields(drafts[kind] ?? emptyFields(kind));
    setTouched(Boolean(drafts[kind]));
  }

  const fieldError = fieldsProblem(fields);
  const styleError = styleProblem(style);
  const content = fieldError ? null : encodeQrContent(fields);

  const rendered = useMemo(() => {
    try {
      return { svg: renderQrSvg(content ?? SAMPLE, style, { title: label || undefined }), error: null };
    } catch (error) {
      return { svg: null, error: error instanceof Error ? error.message : "This QR code could not be drawn." };
    }
  }, [content, style, label]);

  const presetThumbs = useMemo(
    () => QR_PRESETS.map((preset) => ({ ...preset, src: svgDataUrl(renderQrSvg(SAMPLE, { ...preset.style, errorCorrection: "L", margin: 2 })) })),
    [],
  );

  const canExport = Boolean(rendered.svg && content && !styleError);
  const fileBase = staticQrFileName(label || "static");

  async function downloadPng() {
    if (!rendered.svg) return;
    try {
      const blob = await svgToPng(rendered.svg, pngSize);
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${fileBase}.png`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("QR code downloaded", { description: `${fileBase}.png · ${pngSize} px` });
    } catch {
      toast.error("PNG export failed", { description: "Download the SVG instead -- it prints at any size." });
    }
  }

  function downloadSvg() {
    if (!rendered.svg) return;
    const url = URL.createObjectURL(new Blob([rendered.svg], { type: "image/svg+xml" }));
    triggerDownload(url, `${fileBase}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("QR code downloaded", { description: `${fileBase}.svg` });
  }

  function remove() {
    if (!initial) return;
    // Two taps instead of a browser confirm dialog.
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    const data = new FormData();
    data.set("id", initial.id);
    startDelete(async () => {
      const result = await deleteQrCode(data);
      if (result && !result.ok) toast.error("Not deleted", { description: result.message });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <aside className="lg:sticky lg:top-24 lg:order-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-xl border border-line bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
            {rendered.svg ? (
              /* eslint-disable-next-line @next/next/no-img-element -- a data: URL drawn in the browser. */
              <img
                src={svgDataUrl(rendered.svg)}
                alt={content ? `QR code encoding ${content}` : "Sample QR code"}
                className={`size-full transition-opacity duration-200 ${content ? "" : "opacity-25"}`}
              />
            ) : null}
            {!content || rendered.error ? (
              <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm font-medium text-neutral-700">
                {rendered.error ?? "Enter the details to preview your code"}
              </p>
            ) : null}
          </div>
          {content ? (
            <p className="mt-4 line-clamp-3 break-anywhere text-center font-mono text-xs text-muted">{content}</p>
          ) : null}
          {styleError ? (
            <p role="alert" className="mt-4 rounded-md border border-warn/35 bg-warn-soft px-3 py-2 text-xs leading-5 text-warn">{styleError}</p>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" disabled={!canExport} onClick={downloadSvg}>SVG</Button>
            <Button type="button" variant="secondary" disabled={!canExport} onClick={downloadPng}>PNG</Button>
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
            PNG size
            <select value={pngSize} onChange={(e) => setPngSize(Number(e.target.value))} className="rounded-md border border-line-strong bg-canvas px-2 py-1.5 text-ink">
              <option value={1024}>1024 px</option>
              <option value={2048}>2048 px</option>
              <option value={4096}>4096 px</option>
            </select>
          </label>
          <p className="mt-4 text-xs leading-5 text-subtle">
            Static: the scan goes straight to this content, never through goreview.site. It never expires and has no scan limit -- but it cannot be changed after printing, and scans are not counted.
          </p>
        </div>
      </aside>

      <form action={action} className="space-y-8 lg:order-1">
        {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
        <input type="hidden" name="fields" value={JSON.stringify(fields)} />
        <input type="hidden" name="style" value={JSON.stringify(style)} />

        <label className="block text-sm">
          Name <span className="text-muted">(for the library)</span>
          <input className={fieldClass} name="label" required maxLength={120} placeholder="Front counter Wi-Fi" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>

        <section className="space-y-5 rounded-xl border border-line p-5">
          <Segmented label="What it opens" options={QR_KINDS} value={fields.kind} onChange={switchKind} />
          <KindFields fields={fields} onChange={(next) => { setFields(next); setTouched(true); }} />
          {fieldError && touched ? (
            <p className="text-xs text-warn">{fieldError}</p>
          ) : null}
        </section>

        <section className="space-y-6 rounded-xl border border-line p-5">
          <fieldset>
            <legend className="text-sm">Presets</legend>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {presetThumbs.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setStyle({ ...preset.style, errorCorrection: style.errorCorrection, margin: style.margin })}
                  className="group text-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL */}
                  <img src={preset.src} alt="" className="aspect-square w-full rounded-lg border border-line bg-white p-1 transition-transform group-hover:-translate-y-0.5" />
                  <span className="mt-1.5 block text-[11px] text-muted group-hover:text-ink">{preset.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <Segmented label="Pattern" options={MODULE_SHAPES} value={style.moduleShape} onChange={(moduleShape) => update({ moduleShape })} />
          <Segmented label="Corner eyes" options={EYE_SHAPES} value={style.eyes} onChange={(eyes) => update({ eyes })} />

          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField label="Pattern" value={style.foreground} onChange={(foreground) => update({ foreground })}>
              <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" className="size-4 accent-white" checked={style.gradientTo !== null} onChange={(e) => update({ gradientTo: e.target.checked ? style.eyeColor : null })} />
                Gradient
              </label>
            </ColorField>
            {style.gradientTo !== null ? (
              <ColorField label="Gradient end" value={style.gradientTo} onChange={(gradientTo) => update({ gradientTo })} />
            ) : null}
            <ColorField label="Corner eyes" value={style.eyeColor} onChange={(eyeColor) => update({ eyeColor })} />
            <ColorField label="Background" value={style.background} disabled={style.transparent} onChange={(background) => update({ background })}>
              <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" className="size-4 accent-white" checked={style.transparent} onChange={(e) => update({ transparent: e.target.checked })} />
                Transparent (print on light surfaces only)
              </label>
            </ColorField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              Error correction
              <select className={fieldClass} value={style.errorCorrection} onChange={(e) => update({ errorCorrection: e.target.value as QrStyle["errorCorrection"] })}>
                {(["L", "M", "Q", "H"] as const).map((level) => (
                  <option key={level} value={level}>{EC_HELP[level]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Quiet zone · {style.margin} modules {style.margin < 4 ? <span className="text-warn">(4 recommended)</span> : null}
              <input type="range" min={2} max={8} value={style.margin} onChange={(e) => update({ margin: Number(e.target.value) })} className="mt-4 block w-full accent-white" />
            </label>
          </div>
        </section>

        <FormError>{state.error}</FormError>
        {canManage ? <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" disabled={pending || !canExport || !label.trim()}>
            {pending ? <Spinner /> : null}
            {pending ? "Saving…" : initial ? "Save changes" : "Save to library"}
          </Button>
          {initial ? (
            <Button type="button" variant="danger" disabled={deleting} onClick={remove} onBlur={() => setConfirmingDelete(false)}>
              {deleting ? <Spinner /> : null}
              {confirmingDelete ? "Tap again to delete" : "Delete from library"}
            </Button>
          ) : null}
        </div> : <p className="text-sm text-muted">You have view-only access. Downloads still work; changes are not saved.</p>}
      </form>
    </div>
  );
}
