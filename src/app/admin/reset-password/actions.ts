"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearLoginAttempts } from "@/lib/auth";
import { hashResetToken } from "@/lib/admin/account";
import {
  resetPasswordSchema,
  toFieldErrors,
  type AccountFormState,
} from "@/lib/admin/accountSchema";

const INVALID_LINK = "This reset link is invalid or has expired. Request a new one.";

export async function resetPassword(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    if (fieldErrors.token) return { error: INVALID_LINK };
    return { fieldErrors };
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = hashResetToken(token);

  const admin = await prisma.adminUser.findUnique({
    where: { passwordResetTokenHash: tokenHash },
  });
  if (!admin || !admin.passwordResetExpiresAt || admin.passwordResetExpiresAt < new Date()) {
    return { error: INVALID_LINK };
  }

  // Conditional on the token hash still being there, so two
  // simultaneous submits of the same link can't both succeed.
  const { count } = await prisma.adminUser.updateMany({
    where: { id: admin.id, passwordResetTokenHash: tokenHash },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      sessionVersion: { increment: 1 },
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
  if (count === 0) return { error: INVALID_LINK };

  clearLoginAttempts(admin.email);

  // No session exists here, so logActivity() (which reads the session)
  // can't be used — write the entry directly.
  await prisma.activityLog
    .create({
      data: {
        adminUserId: admin.id,
        adminEmail: admin.email,
        action: "updated",
        resource: "AdminUser",
        resourceId: admin.id,
        description: "Reset admin password via emailed link",
      },
    })
    .catch(() => {});

  return { success: true };
}
