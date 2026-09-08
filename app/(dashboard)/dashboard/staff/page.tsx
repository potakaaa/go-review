import type { Metadata } from "next";
import Link from "next/link";

import { Alert, ButtonLink, Card, EmptyState, StatusBadge, buttonClass } from "@/components/ui";
import { StaffCreateForm } from "./staff-create-form";
import { getStaffOverview } from "@/lib/staff";

export const metadata: Metadata = { title: "Staff access" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string | string[]; saved?: string | string[] }>;
}) {
  const params = await searchParams;
  const { staff, routes } = await getStaffOverview();
  const created = params.created === "1" || params.created?.[0] === "1";
  const saved = params.saved === "1" || params.saved?.[0] === "1";

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-16">
      {created ? <Alert tone="ok" title="Staff account created">The account is ready for its first sign-in. Give the staff member the temporary password securely.</Alert> : null}
      {saved ? <Alert tone="ok">Staff access saved.</Alert> : null}
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Goreview / access control</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">Staff</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Create admins, assign the sections they can use, and choose the redirect routes they can access. Every staff session still requires MFA.</p>
        </div>
        <ButtonLink href="/dashboard" variant="secondary">Back to dashboard</ButtonLink>
      </header>

      <Card className="p-5 sm:p-7">
        <p className="eyebrow">New account</p>
        <h2 className="display-heading mt-2 text-2xl">Create staff account</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">The account is created with the temporary password you provide. It must be replaced before the new staff member can use the workspace.</p>
        <div className="mt-6"><StaffCreateForm routes={routes} /></div>
      </Card>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-4">
          <div><p className="eyebrow">Current roster</p><h2 className="display-heading mt-2 text-2xl">Staff accounts</h2></div>
          <span className="font-mono text-xs text-subtle">{staff.length} {staff.length === 1 ? "account" : "accounts"}</span>
        </div>
        {staff.length === 0 ? <EmptyState title="No staff accounts" description="Create the first staff account above." /> : <div className="space-y-3">{staff.map((member) => <Card key={member.user_id} className="p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{member.email ?? "Unknown email"}</p><p className="mt-1 text-xs text-muted">{member.role === "superadmin" ? "Superadmin" : "Admin"}{member.must_change_password ? " · temporary password pending" : ""}</p></div><div className="flex items-center gap-2"><StatusBadge active={member.active} /><Link href={`/dashboard/staff/${member.user_id}`} className={buttonClass("secondary", "text-xs")}>Manage</Link></div></div></Card>)}</div>}
      </section>
    </div>
  );
}
