"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createStaff, type StaffActionState } from "./actions";
import { PermissionFields, RouteAccessFields } from "./staff-access-fields";
import { Alert, buttonClass } from "@/components/ui";
import type { StaffRouteOption } from "@/lib/staff-types";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
      {pending ? "Creating account…" : "Create staff account"}
    </button>
  );
}

export function StaffCreateForm({ routes }: { routes: StaffRouteOption[] }) {
  const [state, formAction] = useActionState<StaffActionState, FormData>(
    createStaff,
    {},
  );

  return (
    <form action={formAction} className="space-y-7">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      <div>
        <label htmlFor="staff-email" className="eyebrow mb-2 block">Email</label>
        <input id="staff-email" name="email" type="email" required autoComplete="email" className={FIELD} placeholder="operator@example.com" />
      </div>
      <div>
        <label htmlFor="temporary_password" className="eyebrow mb-2 block">Temporary password</label>
        <input id="temporary_password" name="temporary_password" type="password" required minLength={14} autoComplete="new-password" className={FIELD} />
        <p className="mt-2 text-xs leading-5 text-subtle">Use 14+ characters with uppercase, lowercase, a number, and a symbol. The new staff member must replace it after signing in.</p>
      </div>
      <div>
        <label htmlFor="staff-role" className="eyebrow mb-2 block">Role</label>
        <select id="staff-role" name="role" defaultValue="admin" className={FIELD}>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <p className="mt-2 text-xs leading-5 text-subtle">Superadmins bypass section and route assignments and can manage staff.</p>
      </div>

      <section>
        <p className="eyebrow">Section permissions</p>
        <p className="mt-2 text-sm leading-6 text-muted">Choose what this admin can see and change. Manage implies view.</p>
        <div className="mt-4"><PermissionFields /></div>
      </section>

      <section>
        <p className="eyebrow">Redirect-route access</p>
        <p className="mt-2 text-sm leading-6 text-muted">A route may be shared with several admins. Choose none, view-only, or manage for each route.</p>
        <div className="mt-4"><RouteAccessFields routes={routes} /></div>
      </section>

      <SubmitButton />
    </form>
  );
}
