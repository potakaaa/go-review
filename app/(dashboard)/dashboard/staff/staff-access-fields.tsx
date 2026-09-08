import { STAFF_SECTIONS } from "@/lib/staff-types";
import type {
  StaffPermissionRow,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";

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

export function RouteAccessFields({
  routes,
  access,
}: {
  routes: StaffRouteOption[];
  access?: StaffRouteAccessRow[];
}) {
  return (
    <div className="space-y-2">
      {routes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-sm text-muted">
          No routes exist yet. Route access can be assigned later.
        </p>
      ) : (
        routes.map((route) => {
          const current = access?.find((item) => item.route_id === route.id);
          return (
            <label
              key={route.id}
              className="flex flex-col gap-2 rounded-xl border border-line bg-canvas px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {route.business_name}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-muted">
                  /r/{route.slug}{route.publication_status === "draft" ? " · draft" : ""}
                </span>
              </span>
              <select
                name="route_access"
                defaultValue={current ? `${route.id}:${current.access_level}` : ""}
                className="min-h-11 rounded-md border border-line-strong bg-elevated px-3 text-sm text-ink focus:border-ink focus:outline-2 focus:outline-ink"
              >
                <option value="">No access</option>
                <option value={`${route.id}:view`}>View only</option>
                <option value={`${route.id}:manage`}>Manage</option>
              </select>
            </label>
          );
        })
      )}
    </div>
  );
}
