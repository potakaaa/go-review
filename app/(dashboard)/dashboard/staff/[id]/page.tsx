import type { Metadata } from "next";
import Link from "next/link";

import { Alert, ButtonLink } from "@/components/ui";
import { StaffEditForm } from "../staff-edit-form";
import { getStaffEditor } from "@/lib/staff";

export const metadata: Metadata = { title: "Manage staff access" };

export default async function StaffEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string | string[]; saved?: string | string[]; password_reset?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { member, permissions, routeAccess, routes } = await getStaffEditor(id);
  const created = query.created === "1" || query.created?.[0] === "1";
  const saved = query.saved === "1" || query.saved?.[0] === "1";
  const passwordReset = query.password_reset === "1" || query.password_reset?.[0] === "1";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <Link href="/dashboard/staff" className="inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4">← Staff accounts</Link>
      {created ? <Alert tone="ok" title="Staff account created">The account is ready for its first sign-in.</Alert> : null}
      {saved ? <Alert tone="ok">Staff access saved.</Alert> : null}
      {passwordReset ? <Alert tone="ok">Replacement temporary password set.</Alert> : null}
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Staff account</p><h1 className="display-heading mt-3 truncate text-3xl text-ink sm:text-4xl">{member.email ?? "Unknown email"}</h1><p className="mt-2 text-sm text-muted">{member.role === "superadmin" ? "Superadmin" : "Admin"} · {member.active ? "Active" : "Suspended"}</p></div><ButtonLink href="/dashboard/staff" variant="secondary">Roster</ButtonLink></header>
      <StaffEditForm member={member} permissions={permissions} routeAccess={routeAccess} routes={routes} />
    </div>
  );
}
