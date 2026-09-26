"use server";

import { prisma } from "@/lib/prisma";
import { consumeAdminToken } from "@/lib/admin/tokens";
import { logAccountActivity, setAdminPassword } from "@/lib/admin/accounts";
import {
  acceptInviteSchema,
  toFieldErrors,
  type AccountFormState,
} from "@/lib/admin/accountSchema";

const INVALID_LINK =
  "This invitation link is invalid or has expired. Ask a Super Admin to send you a new one.";

export async function acceptInvite(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const parsed = acceptInviteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    if (fieldErrors.token) return { error: INVALID_LINK };
    return { fieldErrors };
  }

  const row = await consumeAdminToken(parsed.data.token, "invite");
  if (!row || !row.adminUser.isActive) return { error: INVALID_LINK };

  await prisma.adminUser.update({ where: { id: row.adminUserId }, data: { name: parsed.data.name } });
  // Opening the emailed link is what verifies the address.
  await setAdminPassword(row.adminUserId, parsed.data.newPassword, { markEmailVerified: true });
  await logAccountActivity(row.adminUser, "Accepted invitation and set password");

  return { success: true };
}
