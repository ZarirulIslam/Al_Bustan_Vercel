"use client";

import { MAX_IMAGE_MB } from "@/lib/uploadLimits";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { uploadImageClientSide } from "@/lib/uploadClient";
import { useActionFeedback, useAdminToast } from "@/components/admin/AdminToaster";
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
  if (!state.error) return null;
  return <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>;
}

// Uploads straight to storage from the browser (same pipeline as every
// other admin image), then saves the resulting URL. Takes effect
// immediately — no separate Save button.
export function AvatarForm({
  action,
  avatarUrl,
  label,
}: {
  action: (url: string | null) => Promise<{ error?: string }>;
  avatarUrl: string | null;
  label: string;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const busy = uploading || isSaving;

  function save(url: string | null) {
    startSaving(async () => {
      const result = await action(url);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(url ? "Profile picture updated." : "Profile picture removed.");
      // Refresh the session so the sidebar picks up the new picture.
      await update();
      router.refresh();
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      save(await uploadImageClientSide(file, "avatars"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <AdminAvatar url={avatarUrl} label={label} size="lg" className={busy ? "opacity-60" : undefined} />
      <div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : isSaving ? "Saving…" : avatarUrl ? "Change Photo" : "Upload Photo"}
          </Button>
          {avatarUrl && (
            <Button type="button" variant="danger" size="sm" disabled={busy} onClick={() => save(null)}>
              Remove
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-soft">JPEG, PNG, WebP or GIF, up to {MAX_IMAGE_MB}MB. A square image works best.</p>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}

function CancelEmailChangeButton() {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="font-medium text-garden-700 hover:underline disabled:opacity-50"
    >
      {status.pending ? "Cancelling…" : "Cancel change"}
    </button>
  );
}

export function ChangeEmailForm({
  action,
  cancelAction,
  currentEmail,
  pendingEmail,
}: {
  action: Action;
  cancelAction: () => Promise<void>;
  currentEmail: string;
  pendingEmail: string | null;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Confirmation link sent.");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-5">
      <Banner state={state} />
      <p className="text-sm text-ink-soft">
        Currently signed in as <span className="font-medium text-ink">{currentEmail}</span>. This is the
        address you sign in with and where password reset emails are sent. A new address only takes
        effect after you confirm it from that inbox.
      </p>
      {pendingEmail && !state.success && (
        <form
          action={cancelAction}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-ink"
        >
          <span>
            Waiting for confirmation of <span className="font-medium">{pendingEmail}</span> — check that inbox.
          </span>
          <CancelEmailChangeButton />
        </form>
      )}
      <form ref={formRef} action={formAction} className="space-y-5">
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
        <SubmitButton idle="Send Confirmation Link" pending="Sending…" />
      </form>
    </div>
  );
}

export function ChangePasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Password changed. Signing you out…");

  useEffect(() => {
    // The server has already invalidated every session, this one
    // included — sign out cleanly and go to the login page.
    // Relative destination: never an absolute URL built from NEXTAUTH_URL.
    if (state.success) {
      void signOut({ redirect: false }).then(() => window.location.assign("/admin/login?notice=password-changed"));
    }
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
