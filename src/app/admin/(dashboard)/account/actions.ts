"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireCurrentAdmin } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLog";
import { revokeAdminTokens } from "@/lib/admin/tokens";
import { isOwnAvatarUrl, requestEmailChange, setAdminPassword } from "@/lib/admin/accounts";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import {
  changeEmailSchema,
  changePasswordSchema,
  toFieldErrors,
  type AccountFormState,
} from "@/lib/admin/accountSchema";

export async function changeEmail(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const admin = await requireCurrentAdmin();

  const parsed = changeEmailSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { newEmail, currentPassword } = parsed.data;

  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }
  if (newEmail === admin.email) {
    return { fieldErrors: { newEmail: "That's already your email address." } };
  }

  const error = await requestEmailChange(admin, newEmail);
  if (error) return { error };

  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: admin.id,
    description: `Requested email change to ${newEmail} (awaiting confirmation)`,
  });

  revalidatePath("/admin/account");

  return {
    success: true,
    message: `We've sent a confirmation link to ${newEmail}. Your email changes once you click it — until then, keep signing in with ${admin.email}.`,
  };
}

// Sets (or, with null, removes) the signed-in admin's own picture. The
// file itself is uploaded straight from the browser beforehand
// (src/lib/uploadClient.ts); only its URL comes through here.
export async function updateAvatar(url: string | null): Promise<{ error?: string }> {
  const admin = await requireCurrentAdmin();
  if (url !== null && !isOwnAvatarUrl(url)) return { error: "That image couldn't be used. Please upload it again." };

  await prisma.adminUser.update({ where: { id: admin.id }, data: { avatarUrl: url } });
  if (admin.avatarUrl && admin.avatarUrl !== url) await deleteImage(admin.avatarUrl);

  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: admin.id,
    description: url ? "Updated profile picture" : "Removed profile picture",
  });

  revalidatePath("/admin", "layout");
  return {};
}

export async function cancelEmailChange() {
  const admin = await requireCurrentAdmin();
  await revokeAdminTokens(admin.id, ["email_change"]);
  revalidatePath("/admin/account");
}

export async function changePassword(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const admin = await requireCurrentAdmin();

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { currentPassword, newPassword } = parsed.data;

  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }
  if (currentPassword === newPassword) {
    return { fieldErrors: { newPassword: "Choose a password different from the current one." } };
  }

  // Log before changing the password — afterwards this very session
  // is no longer valid, so logActivity couldn't resolve who did it.
  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: admin.id,
    description: "Changed own password",
  });

  await setAdminPassword(admin.id, newPassword);

  // Every session (this one included) is now invalid; the form signs
  // the browser out and sends it to the login page.
  return { success: true };
}
