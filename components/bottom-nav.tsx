"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffRole, StaffSection } from "@/lib/database.types";
import type { StaffPermission } from "@/lib/auth";

type NavAccess = {
  role: StaffRole;
  permissions: Record<StaffSection, StaffPermission>;
};

function canView(access: NavAccess, section: StaffSection): boolean {
  return access.role === "superadmin" || access.permissions[section].canView;
}

/**
 * Fixed bottom navigation -- the primary way around the app on a phone, with
 * every target within thumb reach and clear of the home indicator.
 */
const ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    exact: true,
    section: undefined,
    icon: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z",
  },
  {
    href: "/dashboard/routes",
    label: "Routes",
    exact: false,
    section: "routes",
    icon: "M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0v2h-2v-2h2z",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    exact: true,
    section: "analytics",
    icon: "M4 19h3V9H4v10zm6 0h3V5h-3v14zm6 0h3v-7h-3v7z",
  },
] as const;

const DESKTOP_ITEMS = [
  { href: "/dashboard/stories", label: "Shop stories", exact: false, section: "stories" },
  { href: "/dashboard/staff", label: "Staff", exact: false, section: "staff" },
  { href: "/dashboard", label: "Dashboard", exact: true, section: undefined },
  { href: "/dashboard/routes", label: "Routes", exact: false, section: "routes" },
  { href: "/dashboard/analytics", label: "Analytics", exact: true, section: "analytics" },
  { href: "/dashboard/convert", label: "Convert", exact: true, section: "convert" },
] as const;

export function DesktopNav({ role, permissions }: NavAccess) {
  const pathname = usePathname();
  const access = { role, permissions };

  return (
    <nav aria-label="Workspace" className="hidden items-center gap-1 md:flex">
      {DESKTOP_ITEMS.filter((item) => !item.section || canView(access, item.section)).map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              active
                ? "bg-elevated text-ink"
                : "text-subtle hover:bg-elevated hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ role, permissions }: NavAccess) {
  const pathname = usePathname();
  const access = { role, permissions };
  const items = ITEMS.filter((item) => !item.section || canView(access, item.section));

  return (
    <nav
      aria-label="Main"
      className="mobile-nav-shell fixed z-40 md:hidden"
    >
      <ul className="mobile-nav-list">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`mobile-nav-link ${
                  active
                    ? "mobile-nav-link-active text-canvas"
                    : "text-subtle hover:bg-elevated hover:text-ink"
                }`}
              >
                <span className="mobile-nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d={item.icon} />
                  </svg>
                </span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
