import Link from "next/link";

import { Flash } from "@/components/flash";
import { ButtonLink, Card } from "@/components/ui";
import { hasPermission, requirePermission } from "@/lib/permissions";
import {
  QR_KINDS,
  describeFields,
  parseStyle,
  qrFieldsSchema,
  renderQrSvg,
  svgDataUrl,
} from "@/lib/static-qr";
import { StarButton } from "./star-button";

export const metadata = { title: "QR codes" };

const FLASH: Record<string, string> = {
  created: "QR code saved to the library",
  updated: "QR code updated",
  deleted: "QR code removed from the library",
};

function thumbnail(content: string, style: unknown): string | null {
  try {
    return svgDataUrl(renderQrSvg(content, parseStyle(style)));
  } catch {
    return null;
  }
}

export default async function QrCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; saved?: string }>;
}) {
  const access = await requirePermission("routes", "view");
  const canManage = hasPermission(access, "routes", "manage");
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const kind = QR_KINDS.find((k) => k.id === params.kind)?.id;

  let query = access.supabase
    .from("static_qr_codes")
    .select("id, label, kind, fields, content, style, starred, updated_at")
    .order("starred", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);
  if (kind) query = query.eq("kind", kind);
  if (q) {
    // Commas and parentheses would break out of the or() filter.
    const term = q.replace(/[%_,()\\]/g, " ");
    query = query.or(`label.ilike.%${term}%,content.ilike.%${term}%`);
  }
  const { data, error } = await query;
  const filtered = Boolean(q || kind);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Goreview / Tools</p>
          <h1 className="display-heading mt-3 text-4xl">Static QR codes</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Encoded straight into the pattern: no redirect through goreview.site, no expiry, no scan limit.
          </p>
        </div>
        {canManage ? <ButtonLink href="/dashboard/qr-codes/new">New QR code</ButtonLink> : null}
      </div>

      {params.saved && FLASH[params.saved] ? <Flash title={FLASH[params.saved]} params={["saved"]} /> : null}

      <form className="mb-6 flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search names and content"
          aria-label="Search QR codes"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-line-strong bg-canvas px-3 text-sm text-ink focus:outline-2 focus:outline-ink"
        />
        <select name="kind" defaultValue={kind ?? ""} aria-label="Filter by type" className="min-h-11 rounded-lg border border-line-strong bg-canvas px-3 text-sm text-ink">
          <option value="">All types</option>
          {QR_KINDS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-lg border border-line-strong px-4 text-sm font-medium text-ink hover:bg-elevated">Search</button>
        {filtered ? <Link href="/dashboard/qr-codes" className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-ink">Clear</Link> : null}
      </form>

      {error ? (
        <Card className="p-6">
          <p role="alert">QR codes could not be loaded.</p>
          <p className="mt-2 text-sm text-muted">If this is the first setup, apply the static QR codes migration. Otherwise refresh and try again.</p>
        </Card>
      ) : !data?.length ? (
        <Card className="p-8">
          <h2 className="text-lg">{filtered ? "No QR codes match." : "Your QR library is empty."}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {filtered
              ? "Try another search or clear the filter."
              : "Design a code for a menu, Wi-Fi, a phone number or anything else. Star the ones you use most to keep them at the top."}
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((code) => {
            const src = thumbnail(code.content, code.style);
            const fields = qrFieldsSchema.safeParse(code.fields);
            const kindLabel = QR_KINDS.find((k) => k.id === code.kind)?.label ?? code.kind;
            return (
              <li key={code.id} className="relative rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                <Link href={`/dashboard/qr-codes/${code.id}`} className="block" prefetch={false}>
                  <div className="aspect-square overflow-hidden rounded-xl border border-line bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
                    {src ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL */
                      <img src={src} alt={`QR code for ${code.label}`} className="size-full" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="mt-4 pr-10">
                    <h2 className="truncate font-medium">{code.label}</h2>
                    <p className="mt-1 truncate text-xs text-muted">
                      <span className="text-subtle">{kindLabel}</span> · {fields.success ? describeFields(fields.data) : code.content}
                    </p>
                  </div>
                </Link>
                {canManage ? (
                  <div className="absolute right-3 bottom-4">
                    <StarButton id={code.id} starred={code.starred} label={code.label} />
                  </div>
                ) : code.starred ? (
                  <span className="absolute right-5 bottom-6 text-warn" aria-label="Starred">★</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
