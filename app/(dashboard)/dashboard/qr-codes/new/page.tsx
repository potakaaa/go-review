import { ButtonLink } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";
import { QrDesigner } from "../qr-designer";

export const metadata = { title: "New QR code" };

export default async function NewQrCodePage() {
  await requirePermission("routes", "manage");
  return (
    <div className="mx-auto max-w-5xl">
      <ButtonLink href="/dashboard/qr-codes" variant="ghost">← QR codes</ButtonLink>
      <h1 className="display-heading my-8 text-4xl">Design a static QR code.</h1>
      <QrDesigner />
    </div>
  );
}
