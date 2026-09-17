import { BottomNav, DesktopNav } from "@/components/bottom-nav";
import { InstallPrompt } from "@/components/install-prompt";
import { logout } from "@/app/login/actions";
import { requireStaffMfa } from "@/lib/auth";
import type { Metadata, Viewport } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/dashboard/manifest.webmanifest",
};

/** The workspace stayed dark, so its browser chrome should be too. */
export const viewport: Viewport = { themeColor: "#0a0a0a" };

/**
 * Second line of defence behind proxy.ts.
 *
 * The proxy already redirects anonymous visitors, but a layout check means a
 * misconfigured matcher can never leave a dashboard page rendering without a
 * session -- and it gives every page below a guaranteed `user`.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const access = await requireStaffMfa();

  return (
    <div data-theme="admin" className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface font-mono text-[10px] font-medium tracking-tight text-ink"
            >
              GR
            </span>
            {/* The one thing here allowed to give way: everything to the
                right is nowrap, so a narrow phone truncates the name rather
                than wrapping the links. */}
            <span className="truncate text-sm font-medium tracking-tight">
              Goreview Admin
            </span>
          </div>

          <DesktopNav
            role={access.profile.role}
            permissions={access.permissions}
          />
          <div className="flex shrink-0 items-center gap-3 md:hidden">
            {(
              access.profile.role === "superadmin" ||
              access.permissions.stories.canView
            ) ? (
              <Link href="/dashboard/stories" className="inline-flex items-center whitespace-nowrap text-xs text-muted tap-target">
                Shop stories
              </Link>
            ) : null}
            {access.profile.role === "superadmin" ? (
              <Link href="/dashboard/staff" className="inline-flex items-center whitespace-nowrap text-xs text-muted tap-target">
                Staff
              </Link>
            ) : null}
          </div>

          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium text-subtle tap-target hover:bg-elevated hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Bottom padding clears the fixed nav plus the home indicator. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-10 md:pb-12">
        <InstallPrompt />
        {children}
      </main>

      <BottomNav role={access.profile.role} permissions={access.permissions} />
    </div>
  );
}
