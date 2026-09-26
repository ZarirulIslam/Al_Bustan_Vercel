"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ADMIN_ROLES, roleLabel } from "@/lib/admin/roles";
import { ADMIN_SECTIONS } from "@/lib/admin/permissions";
import type { AdminUserRow } from "@/lib/admin/adminUsers";
import type { AccountFormState } from "@/lib/admin/accountSchema";
import { useActionFeedback } from "@/components/admin/AdminToaster";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

const roleDescriptions: Record<string, string> = {
  super_admin: "Full access, including creating, editing, deactivating and deleting admin accounts.",
  admin: "Can only use the dashboard sections ticked below, and can't manage admin accounts.",
};

const sectionGroups = ["Content", "Sales", "System"].map((group) => ({
  group,
  sections: ADMIN_SECTIONS.filter((s) => s.group === group),
}));

export function AdminUserForm({
  action,
  user,
  isSelf = false,
  submitLabel,
}: {
  action: (prevState: AccountFormState, formData: FormData) => Promise<AccountFormState>;
  user?: AdminUserRow;
  isSelf?: boolean;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Admin saved.");
  const [role, setRole] = useState(user?.role ?? "admin");
  const [granted, setGranted] = useState<Set<string>>(() => new Set(user?.permissions ?? []));

  function toggle(key: string, on: boolean) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <input id="name" name="name" required maxLength={80} defaultValue={user?.name ?? ""} className={inputClass} />
        </Field>
        <Field
          label="Email"
          htmlFor="email"
          error={state.fieldErrors?.email}
          hint={
            !user
              ? "An invitation link is sent here. Opening it verifies the address."
              : user.status === "invited"
                ? "Changing this re-sends the invitation to the new address."
                : "A new address takes effect once it's confirmed from that inbox."
          }
        >
          <input id="email" name="email" type="email" required defaultValue={user?.email ?? ""} className={inputClass} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm text-ink">Access Level</legend>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ADMIN_ROLES.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer gap-3 rounded-xl border border-limestone-300 bg-white p-4 has-[:checked]:border-garden-500 has-[:checked]:bg-garden-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <input
                type="radio"
                name="role"
                value={option}
                checked={role === option}
                onChange={() => setRole(option)}
                disabled={isSelf && user?.role !== option}
                className="mt-0.5 accent-garden-700"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{roleLabel(option)}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">{roleDescriptions[option]}</span>
              </span>
            </label>
          ))}
        </div>
        {isSelf && <p className="mt-2 text-xs text-ink-soft">You can't change your own access level.</p>}
        {state.fieldErrors?.role && <p className="mt-1 text-xs text-red-700">{state.fieldErrors.role}</p>}
      </fieldset>

      {role === "admin" ? (
        <fieldset>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <legend className="text-sm text-ink">Section Access</legend>
            <span className="flex gap-3 text-xs font-medium">
              <button
                type="button"
                onClick={() => setGranted(new Set(ADMIN_SECTIONS.map((s) => s.key)))}
                className="text-garden-700 hover:underline"
              >
                Select all
              </button>
              <button type="button" onClick={() => setGranted(new Set())} className="text-garden-700 hover:underline">
                Clear
              </button>
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            This admin can view and edit only the ticked sections. Everything else is hidden from them and blocked.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-limestone-300 bg-white p-4 sm:grid-cols-3">
            {sectionGroups.map(({ group, sections }) => (
              <div key={group}>
                <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft/60">{group}</p>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <label key={section.key} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={section.key}
                        checked={granted.has(section.key)}
                        onChange={(e) => toggle(section.key, e.target.checked)}
                        className="h-4 w-4 accent-garden-700"
                      />
                      {section.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {state.fieldErrors?.permissions && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.permissions}</p>
          )}
        </fieldset>
      ) : (
        <p className="rounded border border-limestone-300 bg-limestone-100 px-4 py-3 text-sm text-ink-soft">
          Super Admins can access every section, plus Admin Users.
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
