import { redirect } from "next/navigation";

import { BottomNav, DesktopNav } from "@/components/bottom-nav";
import { InstallPrompt } from "@/components/install-prompt";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface font-mono text-[10px] font-medium tracking-tight text-ink"
            >
              RR
            </span>
            <span className="truncate text-sm font-medium tracking-tight">
              Review Routes
            </span>
          </div>

          <DesktopNav />

          <form action={logout}>
            <button
              type="submit"
              className="rounded-full px-3 py-2 text-xs font-medium text-subtle tap-target hover:bg-elevated hover:text-ink"
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

      <BottomNav />
    </div>
  );
}
