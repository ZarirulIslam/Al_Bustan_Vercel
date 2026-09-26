"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { AccountFormState } from "@/lib/admin/accountSchema";

type Action = (prevState: AccountFormState, formData: FormData) => Promise<AccountFormState>;

const inputClass =
  "mt-1.5 w-full rounded border border-limestone-300 px-3.5 py-2.5 text-sm outline-none focus:border-garden-500";

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={status.pending} className="w-full justify-center">
      {status.pending ? pending : idle}
    </Button>
  );
}

function BackToLogin() {
  return (
    <p className="mt-6 text-center text-sm">
      <Link href="/admin/login" className="font-medium text-garden-700 hover:underline">
        Back to sign in
      </Link>
    </p>
  );
}

export function ForgotPasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});

  if (state.success) {
    return (
      <>
        <p className="mt-6 rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
          {state.message}
        </p>
        <BackToLogin />
      </>
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-ink-soft">
        Enter the admin email address and we&apos;ll email you a link to set a new password.
      </p>
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm text-ink">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
          {state.fieldErrors?.email && <p className="mt-1 text-xs text-red-700">{state.fieldErrors.email}</p>}
        </div>

        {state.error && <p className="text-sm text-red-700">{state.error}</p>}

        <SubmitButton idle="Send Reset Link" pending="Sending…" />
      </form>
      <BackToLogin />
    </>
  );
}

export function ResetPasswordForm({ action, token }: { action: Action; token: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.success) router.replace("/admin/login?notice=password-reset");
  }, [state.success, router]);

  return (
    <>
      <p className="mt-2 text-sm text-ink-soft">
        Choose a new password (at least 8 characters). You&apos;ll be signed out everywhere else.
      </p>
      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label htmlFor="newPassword" className="text-sm text-ink">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className={inputClass}
          />
          {state.fieldErrors?.newPassword && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.newPassword}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-sm text-ink">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
          {state.fieldErrors?.confirmPassword && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.confirmPassword}</p>
          )}
        </div>

        {state.error && (
          <p className="text-sm text-red-700">
            {state.error}{" "}
            <Link href="/admin/forgot-password" className="font-medium underline">
              Request a new link
            </Link>
          </p>
        )}

        <SubmitButton idle="Set New Password" pending="Saving…" />
      </form>
      <BackToLogin />
    </>
  );
}
