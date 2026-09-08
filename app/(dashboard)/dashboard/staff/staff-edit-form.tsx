"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateStaff, resetStaffPassword, type StaffActionState } from "./actions";
import { PermissionFields, RouteAccessFields } from "./staff-access-fields";
import { Alert, buttonClass } from "@/components/ui";
import type {
  StaffMember,
  StaffPermissionRow,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>{pending ? "Saving…" : label}</button>;
}

export function StaffEditForm({
  member,
  permissions,
  routeAccess,
  routes,
}: {
  member: StaffMember;
  permissions: StaffPermissionRow[];
  routeAccess: StaffRouteAccessRow[];
  routes: StaffRouteOption[];
}) {
  const [state, formAction] = useActionState<StaffActionState, FormData>(updateStaff, {});
  const [passwordState, passwordAction] = useActionState<StaffActionState, FormData>(resetStaffPassword, {});

  return (
    <div className="space-y-10">
      <form action={formAction} className="space-y-7">
        <input type="hidden" name="user_id" value={member.user_id} />
        {state.message ? <Alert tone="danger">{state.message}</Alert> : null}
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
          <span><span className="block text-sm font-medium">Account active</span><span className="mt-1 block text-xs text-subtle">Suspended accounts are denied at the proxy and database.</span></span>
          <input type="checkbox" name="active" defaultChecked={member.active} className="size-5 accent-brand" />
        </label>
        <div>
          <label htmlFor="edit-role" className="eyebrow mb-2 block">Role</label>
          <select id="edit-role" name="role" defaultValue={member.role} className={FIELD}>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        <section>
          <p className="eyebrow">Section permissions</p>
          <div className="mt-4"><PermissionFields permissions={permissions} /></div>
        </section>
        <section>
          <p className="eyebrow">Redirect-route access</p>
          <div className="mt-4"><RouteAccessFields routes={routes} access={routeAccess} /></div>
        </section>
        <SubmitButton label="Save staff access" />
      </form>

      <form action={passwordAction} className="space-y-4 rounded-xl border border-warn/30 bg-warn-soft p-5">
        <input type="hidden" name="user_id" value={member.user_id} />
        <div><p className="eyebrow text-warn">Reset access</p><p className="mt-2 text-sm leading-6 text-muted">Set a replacement temporary password. The staff member will be forced to choose a new one at their next sign-in.</p></div>
        {passwordState.message ? <Alert tone="danger">{passwordState.message}</Alert> : null}
        <label htmlFor="replacement-password" className="eyebrow block">Replacement temporary password</label>
        <input id="replacement-password" name="temporary_password" type="password" required minLength={14} autoComplete="new-password" className={FIELD} placeholder="Enter a temporary password" />
        <button type="submit" className={buttonClass("secondary", "w-full")}>Set replacement password</button>
      </form>
    </div>
  );
}
