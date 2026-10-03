import { notFound } from "next/navigation";
import { z } from "zod";

import { ButtonLink } from "@/components/ui";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { parseStyle, qrFieldsSchema } from "@/lib/static-qr";
import { QrDesigner } from "../qr-designer";

export const metadata = { title: "Edit QR code" };

export default async function EditQrCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const access = await requirePermission("routes", "view");
  const { supabase } = access;
  const { data, error } = await supabase
    .from("static_qr_codes")
    .select("id, label, fields, style")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  const fields = qrFieldsSchema.safeParse(data.fields);
  if (!fields.success) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <ButtonLink href="/dashboard/qr-codes" variant="ghost">← QR codes</ButtonLink>
      <h1 className="display-heading my-8 text-4xl">{data.label}</h1>
      <p className="-mt-5 mb-8 max-w-xl text-sm leading-6 text-muted">
        Codes already printed keep their old content -- saving here changes the design you download next, not what is out in the world.
      </p>
      <QrDesigner
        initial={{ id: data.id, label: data.label, fields: fields.data, style: parseStyle(data.style) }}
        canManage={hasPermission(access, "routes", "manage")}
      />
    </div>
  );
}
