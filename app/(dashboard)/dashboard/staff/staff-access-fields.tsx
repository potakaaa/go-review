import { STAFF_SECTIONS } from "@/lib/staff-types";
import type { StaffPermissionRow } from "@/lib/staff-types";

export function PermissionFields({
  permissions,
}: {
  permissions?: StaffPermissionRow[];
}) {
  return (
    <div className="space-y-3">
      {STAFF_SECTIONS.map((section) => {
        const current = permissions?.find((item) => item.section === section.id);
        return (
          <fieldset
            key={section.id}
            className="rounded-xl border border-line bg-canvas px-4 py-3"
          >
            <legend className="px-1 text-sm font-medium text-ink">
              {section.label}
            </legend>
            <p className="mt-1 text-xs leading-5 text-subtle">
              {section.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <label className="inline-flex min-h-11 items-center gap-2 tap-target">
                <input
                  type="checkbox"
                  name={`permission_${section.id}_view`}
                  defaultChecked={current?.can_view}
                  className="size-4 accent-brand"
                />
                View
              </label>
              <label className="inline-flex min-h-11 items-center gap-2 tap-target">
                <input
                  type="checkbox"
                  name={`permission_${section.id}_manage`}
                  defaultChecked={current?.can_manage}
                  className="size-4 accent-brand"
                />
                Manage
              </label>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
