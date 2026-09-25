import { Toaster } from "@/components/toaster";

/**
 * Sign-in, MFA and password screens. A route group only so these four pages
 * share one toast outlet; their URLs are unchanged.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div data-theme="admin">
        <Toaster />
      </div>
    </>
  );
}
