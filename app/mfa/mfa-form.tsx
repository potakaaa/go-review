"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Alert, buttonClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-center font-mono text-xl tracking-[0.28em] text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

type SetupState =
  | { status: "loading" }
  | { status: "challenge"; factorId: string }
  | {
      status: "enroll";
      factorId: string;
      qrCode: string;
      secret: string;
    }
  | { status: "error" };

export function MfaForm({ next }: { next: string }) {
  const started = useRef(false);
  const [setup, setSetup] = useState<SetupState>({ status: "loading" });
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function prepare() {
      const supabase = createClient();
      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setSetup({ status: "error" });
        return;
      }

      const verified = factors.totp.find(
        (factor) => factor.status === "verified",
      );
      if (verified) {
        setSetup({ status: "challenge", factorId: verified.id });
        return;
      }

      // Clear abandoned enrollment attempts so refreshing setup cannot leave a
      // trail of unusable factors on the account.
      for (const factor of factors.all) {
        if (
          factor.factor_type === "totp" &&
          factor.status === "unverified"
        ) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Goreview Admin",
      });
      if (error) {
        setSetup({ status: "error" });
        return;
      }

      setSetup({
        status: "enroll",
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    }

    void prepare();
  }, []);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (setup.status !== "challenge" && setup.status !== "enroll") return;

    const normalizedCode = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(normalizedCode)) {
      setMessage("Enter the six-digit code from your authenticator app.");
      return;
    }

    setSubmitting(true);
    setMessage(undefined);

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: setup.factorId,
      code: normalizedCode,
    });

    if (error) {
      setMessage("That code could not be verified. Wait for a new code and try again.");
      setSubmitting(false);
      setCode("");
      return;
    }

    window.location.assign(next);
  }

  if (setup.status === "loading") {
    return (
      <div
        role="status"
        aria-label="Preparing security verification"
        className="space-y-4"
      >
        <div className="h-5 w-2/3 animate-pulse rounded bg-elevated" />
        <div className="h-12 animate-pulse rounded-md bg-elevated" />
        <p className="text-sm text-muted">Preparing secure verification…</p>
      </div>
    );
  }

  if (setup.status === "error") {
    return (
      <Alert tone="danger" title="Verification unavailable">
        Sign out, then try again. If this keeps happening, ask the workspace
        owner to check your staff access and authenticator factors.
      </Alert>
    );
  }

  const enrolling = setup.status === "enroll";

  return (
    <form onSubmit={verify} className="space-y-5">
      {enrolling ? (
        <div className="space-y-4">
          <div className="rounded-md bg-white p-3">
            <Image
              src={setup.qrCode}
              alt="QR code for enrolling Goreview Admin in an authenticator app"
              width={240}
              height={240}
              unoptimized
              className="mx-auto size-60 max-w-full"
              priority
            />
          </div>
          <div>
            <p className="text-sm leading-6 text-muted">
              Scan this QR code with Google Authenticator, 1Password, Authy, or
              another TOTP app. If scanning fails, enter this setup key:
            </p>
            <p className="mt-2 rounded-md border border-line-strong bg-canvas px-3 py-2 break-all font-mono text-sm text-ink">
              {setup.secret}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted">
          Open the authenticator app you enrolled for Goreview Admin and enter
          its current code.
        </p>
      )}

      {message ? <Alert tone="danger">{message}</Alert> : null}

      <div>
        <label htmlFor="mfa_code" className="eyebrow mb-2 block">
          Authenticator code
        </label>
        <input
          id="mfa_code"
          name="mfa_code"
          type="text"
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className={FIELD}
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className={buttonClass("primary", "w-full")}
      >
        {submitting
          ? "Verifying…"
          : enrolling
            ? "Finish secure setup"
            : "Verify and continue"}
      </button>
    </form>
  );
}
