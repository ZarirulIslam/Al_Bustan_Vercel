"use server";

import { clearLoginAttempts } from "@/lib/auth";
import { consumeAdminToken } from "@/lib/admin/tokens";
import { logAccountActivity, setAdminPassword } from "@/lib/admin/accounts";
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

  const row = await consumeAdminToken(parsed.data.token, "password_reset");
  if (!row || !row.adminUser.isActive) return { error: INVALID_LINK };

  // Receiving the link proves they control the inbox.
  await setAdminPassword(row.adminUserId, parsed.data.newPassword, { markEmailVerified: true });
  clearLoginAttempts(row.adminUser.email);
  await logAccountActivity(row.adminUser, "Reset password via emailed link");

  return { success: true };
}
