"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import {
  changeEmailSchema,
  changePasswordSchema,
  toFieldErrors,
  type AccountFormState,
} from "@/lib/admin/accountSchema";

async function requireAdminUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new Error("Not authenticated.");

  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) throw new Error("Not authenticated.");
  return admin;
}

export async function changeEmail(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const admin = await requireAdminUser();

  const parsed = changeEmailSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { newEmail, currentPassword } = parsed.data;

  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }
  if (newEmail === admin.email) {
    return { fieldErrors: { newEmail: "That's already your email address." } };
  }

  const taken = await prisma.adminUser.findUnique({ where: { email: newEmail } });
  if (taken) {
    return { fieldErrors: { newEmail: "Another admin account already uses this email." } };
  }

  const oldEmail = admin.email;
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      email: newEmail,
      // A reset link was addressed to the old inbox — don't let it
      // outlive the address change.
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: admin.id,
    description: `Changed admin email from ${oldEmail} to ${newEmail}`,
  });

  revalidatePath("/admin/account");

  return { success: true, message: `Email changed to ${newEmail}. Use it next time you sign in.` };
}

export async function changePassword(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const admin = await requireAdminUser();

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { currentPassword, newPassword } = parsed.data;

  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }
  if (currentPassword === newPassword) {
    return { fieldErrors: { newPassword: "Choose a password different from the current one." } };
  }

  // Log before bumping sessionVersion — afterwards this very session
  // is no longer valid, so logActivity couldn't resolve who did it.
  await logActivity({
    action: "updated",
    resource: "AdminUser",
    resourceId: admin.id,
    description: "Changed admin password",
  });

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      sessionVersion: { increment: 1 },
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  // Every session (this one included) is now invalid; the form signs
  // the browser out and sends it to the login page.
  return { success: true };
}
