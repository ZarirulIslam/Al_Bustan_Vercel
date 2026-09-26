"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import type { AccountFormState } from "@/lib/admin/accountSchema";

type Action = (prevState: AccountFormState, formData: FormData) => Promise<AccountFormState>;

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={status.pending}>
      {status.pending ? pending : idle}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Banner({ state }: { state: AccountFormState }) {
  if (state.error) {
    return (
      <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
    );
  }
  if (state.success && state.message) {
    return (
      <p className="rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
        {state.message}
      </p>
    );
  }
  return null;
}

export function ChangeEmailForm({ action, currentEmail }: { action: Action; currentEmail: string }) {
  const [state, formAction] = useActionState(action, {});
  const { update } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    // Refresh the client session so the sidebar shows the new email.
    void update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <Banner state={state} />
      <p className="text-sm text-ink-soft">
        Currently signed in as <span className="font-medium text-ink">{currentEmail}</span>. This is the
        address you sign in with and where password reset emails are sent.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="New Email" htmlFor="newEmail" error={state.fieldErrors?.newEmail}>
          <input id="newEmail" name="newEmail" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Current Password" htmlFor="emailCurrentPassword" error={state.fieldErrors?.currentPassword}>
          <input
            id="emailCurrentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
      </div>
      <SubmitButton idle="Change Email" pending="Saving…" />
    </form>
  );
}

export function ChangePasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    // The server has already invalidated every session, this one
    // included — sign out cleanly and go to the login page.
    if (state.success) void signOut({ callbackUrl: "/admin/login?notice=password-changed" });
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-5">
      <Banner state={state} />
      {state.success && (
        <p className="rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
          Password changed. Signing you out…
        </p>
      )}
      <p className="text-sm text-ink-soft">
        After changing your password you&apos;ll be signed out on every device, including this one.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Current Password" htmlFor="currentPassword" error={state.fieldErrors?.currentPassword}>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
        <Field label="New Password" htmlFor="newPassword" error={state.fieldErrors?.newPassword}>
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
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPassword" error={state.fieldErrors?.confirmPassword}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
      </div>
      <SubmitButton idle="Change Password" pending="Saving…" />
    </form>
  );
}
