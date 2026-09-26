"use server";

import type { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLog";
import { redirectWithFlash } from "@/lib/admin/flash";
import { issueAdminToken, revokeAdminTokens } from "@/lib/admin/tokens";
import { requestEmailChange, unusablePasswordHash } from "@/lib/admin/accounts";
import { sendInviteEmail, sendPasswordResetEmail } from "@/lib/admin/authEmails";
import { roleLabel } from "@/lib/admin/roles";
import {
  adminUserFormInput,
  adminUserSchema,
  toFieldErrors,
  type AccountFormState,
} from "@/lib/admin/accountSchema";
import { sectionLabel } from "@/lib/admin/permissions";

// Every action here is Super Admin only (requireSuperAdmin), and a
// Super Admin can never deactivate, delete or demote *themselves* —
// which also guarantees at least one active Super Admin always
// remains, since the one acting is one.

type ActionResult = { error?: string; message?: string };

function describeAccess(role: AdminRole, permissions: string[]) {
  return role === "super_admin" ? "" : ` (sections: ${permissions.map(sectionLabel).join(", ")})`;
}

function revalidateUsers(id?: string) {
  revalidatePath("/admin/users");
  if (id) revalidatePath(`/admin/users/${id}/edit`);
}

async function sendInvite(user: { id: string; email: string; role: AdminRole }, invitedBy: string) {
  const token = await issueAdminToken(user.id, "invite");
  await sendInviteEmail({ to: user.email, token, role: user.role, invitedBy });
}

export async function inviteAdminUser(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const actor = await requireSuperAdmin();

  const parsed = adminUserSchema.safeParse(adminUserFormInput(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { name, email, role, permissions } = parsed.data;

  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return { fieldErrors: { email: "An admin account with this email already exists." } };
  }

  const user = await prisma.adminUser.create({
    data: { name, email, role, permissions, passwordHash: await unusablePasswordHash() },
  });

  try {
    await sendInvite(user, actor.name ?? actor.email);
  } catch (error) {
    console.error("[invite] Failed to send invitation email:", error);
    // Don't leave behind an account nobody was told about.
    await prisma.adminUser.delete({ where: { id: user.id } });
    return {
      error: "We couldn't send the invitation email right now, so the account wasn't created. Please try again.",
    };
  }

  await logActivity({
    action: "created",
    resource: "AdminUser",
    resourceId: user.id,
    description: `Invited ${email} as ${roleLabel(role)}${describeAccess(role, permissions)}`,
  });

  revalidateUsers();
  return redirectWithFlash("/admin/users", `Invitation sent to ${email}.`);
}

export async function updateAdminUser(
  id: string,
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const actor = await requireSuperAdmin();

  const parsed = adminUserSchema.safeParse(adminUserFormInput(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { name, email, role, permissions } = parsed.data;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { error: "This admin account no longer exists." };

  if (target.id === actor.id && role !== target.role) {
    return { fieldErrors: { role: "You can't change your own access level." } };
  }

  const changes: string[] = [];
  let message = "Changes saved.";

  const permissionsChanged = [...permissions].sort().join() !== [...target.permissions].sort().join();
  if (name !== target.name || role !== target.role || permissionsChanged) {
    await prisma.adminUser.update({ where: { id }, data: { name, role, permissions } });
    if (name !== target.name) changes.push(`name to "${name}"`);
    if (role !== target.role) changes.push(`access level to ${roleLabel(role)}`);
    if (role === "admin" && (permissionsChanged || role !== target.role)) {
      changes.push(`sections to ${permissions.map(sectionLabel).join(", ")}`);
    }
  }

  if (email !== target.email) {
    if (!target.emailVerifiedAt) {
      // Never-accepted invite: just re-address it. Accepting the new
      // invite is what verifies the new address.
      if (await prisma.adminUser.findUnique({ where: { email } })) {
        return { fieldErrors: { email: "Another admin account already uses this email." } };
      }
      const updated = await prisma.adminUser.update({ where: { id }, data: { email } });
      try {
        await sendInvite(updated, actor.name ?? actor.email);
        changes.push(`email to ${email} (invitation re-sent)`);
        message = `Saved. A new invitation was sent to ${email}.`;
      } catch (error) {
        console.error("[invite] Failed to re-send invitation email:", error);
        changes.push(`email to ${email}`);
        message = "Saved, but the new invitation email couldn't be sent. Use Resend Invite on the Admin Users list.";
      }
    } else {
      const error = await requestEmailChange(target, email);
      if (error) return { fieldErrors: { email: error } };
      changes.push(`email to ${email} (awaiting confirmation)`);
      message = `Saved. The email changes once ${email} is confirmed from that inbox.`;
    }
  }

  if (changes.length === 0) return redirectWithFlash("/admin/users", "No changes to save.");

  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: id,
    description: `Changed ${target.email}'s ${changes.join(", ")}`,
  });

  revalidateUsers(id);
  return redirectWithFlash("/admin/users", message);
}

export async function setAdminUserActive(id: string, active: boolean): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  if (id === actor.id) return { error: "You can't deactivate your own account." };

  const target = await prisma.adminUser.update({ where: { id }, data: { isActive: active } });
  // Deactivated accounts shouldn't keep working emailed links. Their
  // sessions end on their next request (see the jwt callback).
  if (!active) await revokeAdminTokens(id, ["password_reset", "email_change"]);

  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: id,
    description: `${active ? "Reactivated" : "Deactivated"} admin ${target.email}`,
  });
  revalidateUsers(id);
  return {};
}

export async function deleteAdminUser(id: string): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  if (id === actor.id) return { error: "You can't delete your own account." };

  // Activity log entries survive (adminUserId becomes null, the email
  // is kept); tokens cascade.
  const target = await prisma.adminUser.delete({ where: { id } });

  await logActivity({
    action: "deleted",
    resource: "AdminUser",
    resourceId: id,
    description: `Deleted admin ${target.email}`,
  });
  revalidateUsers();
  return {};
}

export async function resendAdminInvite(id: string): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target || target.emailVerifiedAt || !target.isActive) {
    return { error: "This account doesn't have a pending invitation." };
  }
  try {
    await sendInvite(target, actor.name ?? actor.email);
  } catch (error) {
    console.error("[invite] Failed to re-send invitation email:", error);
    return { error: "We couldn't send the invitation email right now. Please try again." };
  }
  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: id,
    description: `Re-sent invitation to ${target.email}`,
  });
  revalidateUsers(id);
  return { message: `Invitation re-sent to ${target.email}.` };
}

// Lets a Super Admin help someone who's locked out without ever
// seeing or setting their password.
export async function sendAdminPasswordReset(id: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target?.isActive || !target.emailVerifiedAt) {
    return { error: "Password resets can only be sent to active accounts that have accepted their invitation." };
  }
  try {
    await sendPasswordResetEmail(target.email, await issueAdminToken(target.id, "password_reset"));
  } catch (error) {
    console.error("[password-reset] Failed to send reset email:", error);
    return { error: "We couldn't send the reset email right now. Please try again." };
  }
  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: id,
    description: `Sent a password reset email to ${target.email}`,
  });
  return { message: `Password reset link sent to ${target.email}.` };
}
