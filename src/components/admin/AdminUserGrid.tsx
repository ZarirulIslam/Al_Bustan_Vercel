"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { useAdminAction } from "@/components/admin/AdminToaster";
import { roleLabel } from "@/lib/admin/roles";
import { ADMIN_SECTIONS, sectionLabel } from "@/lib/admin/permissions";
import type { AdminUserRow } from "@/lib/admin/adminUsers";
import {
  deleteAdminUser,
  resendAdminInvite,
  sendAdminPasswordReset,
  setAdminUserActive,
} from "@/app/admin/(dashboard)/users/actions";

const statusStyles: Record<AdminUserRow["status"], { label: string; pill: string }> = {
  active: { label: "active", pill: "bg-garden-500 text-white" },
  invited: { label: "invited", pill: "bg-brass text-white" },
  deactivated: { label: "deactivated", pill: "bg-limestone-300 text-ink-soft" },
};

function formatLastLogin(date: Date | null) {
  if (!date) return "Never signed in";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Last login: ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function accessSummary(user: AdminUserRow): { count: number; label: string } {
  const all = ADMIN_SECTIONS.length;
  if (user.role === "super_admin") return { count: all, label: "Full Access" };
  const count = user.permissions.length;
  if (count === all) return { count, label: "All Sections" };
  if (count === 0) return { count, label: "No Access" };
  return { count, label: "Limited" };
}

// --- icons (1.6 stroke, matching the sidebar set) -----------------------

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const menuIcons = {
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  send: <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="m11 12 9-9M17 6l2.5 2.5M14.5 8.5 16.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  deactivate: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  reactivate: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 12.5 2.5 2.5 5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  delete: (
    <path
      d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

// --- card menu -------------------------------------------------------------

interface MenuItem {
  label: string;
  icon: keyof typeof menuIcons;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
}

function CardMenu({ items, disabled }: { items: MenuItem[][]; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = (danger?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
      danger ? "text-red-700 hover:bg-red-50" : "text-ink hover:bg-limestone-100"
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account actions"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-limestone-200 hover:text-ink disabled:opacity-50",
          open && "bg-limestone-200 text-ink"
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5.5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="18.5" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-limestone-300 bg-white p-1.5 shadow-card-hover"
        >
          {items
            .filter((group) => group.length > 0)
            .map((group, i) => (
              <div key={i} className={cn(i > 0 && "mt-1.5 border-t border-limestone-300 pt-1.5")}>
                {group.map((item) =>
                  item.href ? (
                    <Link key={item.label} href={item.href} role="menuitem" className={itemClass(item.danger)}>
                      <svg {...iconProps}>{menuIcons[item.icon]}</svg>
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        item.onSelect?.();
                      }}
                      className={itemClass(item.danger)}
                    >
                      <svg {...iconProps}>{menuIcons[item.icon]}</svg>
                      {item.label}
                    </button>
                  )
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// --- grid ------------------------------------------------------------------

export function AdminUserGrid({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  // Actions return their own { message } / { error }, which the shared
  // hook turns into the dashboard's standard notifications.
  const { run, isPending } = useAdminAction();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.name, u.email, u.pendingEmail, roleLabel(u.role)].some((v) => v?.toLowerCase().includes(q)));
  }, [users, query]);

  function menuFor(user: AdminUserRow, isSelf: boolean): MenuItem[][] {
    const primary: MenuItem[] = [{ label: "Edit Details", icon: "edit", href: `/admin/users/${user.id}/edit` }];
    if (user.status === "invited") {
      primary.push({ label: "Resend Invite", icon: "send", onSelect: () => run(() => resendAdminInvite(user.id)) });
    }
    if (user.status === "active" && !isSelf) {
      primary.push({
        label: "Send Reset Link",
        icon: "key",
        onSelect: () => {
          if (confirm(`Email a password reset link to ${user.email}?`)) run(() => sendAdminPasswordReset(user.id));
        },
      });
    }
    if (!isSelf) {
      primary.push({
        label: user.isActive ? "Deactivate" : "Reactivate",
        icon: user.isActive ? "deactivate" : "reactivate",
        onSelect: () => {
          const detail = user.isActive ? " They'll be signed out and won't be able to sign in until reactivated." : "";
          if (confirm(`${user.isActive ? "Deactivate" : "Reactivate"} ${user.email}?${detail}`)) {
            run(
              () => setAdminUserActive(user.id, !user.isActive),
              user.isActive ? `${user.email} deactivated.` : `${user.email} reactivated.`
            );
          }
        },
      });
    }
    const danger: MenuItem[] = isSelf
      ? []
      : [
          {
            label: "Delete",
            icon: "delete",
            danger: true,
            onSelect: () => {
              if (confirm(`Delete ${user.email}? This can't be undone. Their activity log entries are kept.`)) {
                run(() => deleteAdminUser(user.id), `${user.email} deleted.`);
              }
            },
          },
        ];
    return [primary, danger];
  }

  return (
    <div>
      <label className="relative block w-full max-w-xs">
        <span className="sr-only">Search admins</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        >
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search admins"
          className="w-full rounded-lg border border-limestone-300 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-garden-500"
        />
      </label>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-limestone-300 px-6 py-10 text-center text-sm text-ink-soft">
          No admins match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((user) => {
            const isSelf = user.id === currentUserId;
            const status = statusStyles[user.status];
            const access = accessSummary(user);
            return (
              <article
                key={user.id}
                className={cn(
                  "flex flex-col rounded-2xl border border-limestone-300 bg-white p-6 shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover",
                  !user.isActive && "bg-limestone-100/60"
                )}
              >
                <div className="flex items-start justify-between">
                  <AdminAvatar url={user.avatarUrl} label={user.name ?? user.email} size="card" tone="soft" />
                  <CardMenu items={menuFor(user, isSelf)} disabled={isPending} />
                </div>

                <h3 className="mt-6 truncate text-base font-medium text-ink">
                  {user.name ?? user.email}
                  {isSelf && <span className="ml-1.5 text-xs font-normal text-ink-soft">(you)</span>}
                </h3>
                <span
                  className={cn(
                    "mt-1.5 inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium",
                    user.role === "super_admin" ? "bg-garden-700 text-white" : "bg-limestone-200 text-ink"
                  )}
                >
                  {roleLabel(user.role).toLowerCase()}
                </span>

                <div className="mt-4 space-y-2 text-sm text-ink-soft">
                  <p className="flex items-center gap-2.5">
                    <span className="text-ink-soft/80">
                      <MailIcon />
                    </span>
                    <span className="truncate" title={user.email}>
                      {user.email}
                    </span>
                  </p>
                  {user.pendingEmail && (
                    <p className="flex items-center gap-2.5 text-xs">
                      <span className="text-brass">
                        <ClockIcon />
                      </span>
                      <span className="truncate">Changing to {user.pendingEmail} (unconfirmed)</span>
                    </p>
                  )}
                </div>

                <dl className="mt-4 space-y-2.5 border-t border-limestone-300 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">Sections</dt>
                    <dd
                      className="font-medium text-ink"
                      title={user.role === "super_admin" ? undefined : user.permissions.map(sectionLabel).join(", ")}
                    >
                      {access.count}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">Permissions</dt>
                    <dd className="font-medium text-ink">{access.label}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">Status</dt>
                    <dd>
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", status.pill)}>
                        {status.label}
                        {user.status === "invited" && user.inviteExpired && " · expired"}
                      </span>
                    </dd>
                  </div>
                </dl>

                <p className="mt-auto pt-4 text-xs text-ink-soft">{formatLastLogin(user.lastLoginAt)}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
