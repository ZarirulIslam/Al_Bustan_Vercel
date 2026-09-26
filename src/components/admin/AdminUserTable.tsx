"use client";

import { Button } from "@/components/ui/Button";
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

const statusStyles: Record<AdminUserRow["status"], { label: string; pill: string; dot: string }> = {
  active: { label: "Active", pill: "bg-garden-100 text-garden-700", dot: "bg-garden-500" },
  invited: { label: "Invited", pill: "bg-brass/15 text-ink", dot: "bg-brass" },
  deactivated: { label: "Deactivated", pill: "bg-limestone-200 text-ink-soft", dot: "bg-ink-soft/50" },
};

function formatDate(date: Date | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminUserTable({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  // Actions return their own { message } / { error }, which the shared
  // hook turns into the dashboard's standard notifications.
  const { run, isPending } = useAdminAction();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Name</th>
              <th className="px-4 py-3.5 font-semibold">Email</th>
              <th className="px-4 py-3.5 font-semibold">Access Level</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold">Last Sign-in</th>
              <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const status = statusStyles[user.status];
              return (
                <tr
                  key={user.id}
                  className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
                >
                  <td className="px-4 py-3.5 font-medium text-ink">
                    <span className="flex items-center gap-3">
                      <AdminAvatar url={user.avatarUrl} label={user.name ?? user.email} size="sm" />
                      <span>
                        {user.name ?? "—"}
                        {isSelf && <span className="ml-2 text-xs font-normal text-ink-soft">(you)</span>}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">
                    {user.email}
                    {user.pendingEmail && (
                      <span className="block text-xs text-ink-soft/80">→ {user.pendingEmail} (unconfirmed)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        user.role === "super_admin" ? "bg-garden-700 text-white" : "bg-limestone-200 text-ink"
                      )}
                    >
                      {roleLabel(user.role)}
                    </span>
                    <span
                      className="mt-1 block text-xs text-ink-soft"
                      title={user.role === "super_admin" ? undefined : user.permissions.map(sectionLabel).join(", ")}
                    >
                      {user.role === "super_admin" || user.permissions.length === ADMIN_SECTIONS.length
                        ? "All sections"
                        : user.permissions.length <= 2
                          ? user.permissions.map(sectionLabel).join(", ") || "No sections"
                          : `${user.permissions.length} of ${ADMIN_SECTIONS.length} sections`}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", status.pill)}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {status.label}
                      {user.status === "invited" && user.inviteExpired && " (expired)"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button href={`/admin/users/${user.id}/edit`} variant="ghost" size="sm">
                        Edit
                      </Button>
                      {user.status === "invited" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => run(() => resendAdminInvite(user.id))}
                        >
                          Resend Invite
                        </Button>
                      )}
                      {user.status === "active" && !isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            if (confirm(`Email a password reset link to ${user.email}?`)) {
                              run(() => sendAdminPasswordReset(user.id));
                            }
                          }}
                        >
                          Send Reset Link
                        </Button>
                      )}
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            const verb = user.isActive ? "Deactivate" : "Reactivate";
                            const detail = user.isActive
                              ? " They'll be signed out and won't be able to sign in until reactivated."
                              : "";
                            if (confirm(`${verb} ${user.email}?${detail}`)) {
                              run(
                                () => setAdminUserActive(user.id, !user.isActive),
                                user.isActive ? `${user.email} deactivated.` : `${user.email} reactivated.`
                              );
                            }
                          }}
                        >
                          {user.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      )}
                      {!isSelf && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            if (confirm(`Delete ${user.email}? This can't be undone. Their activity log entries are kept.`)) {
                              run(() => deleteAdminUser(user.id), `${user.email} deleted.`);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
