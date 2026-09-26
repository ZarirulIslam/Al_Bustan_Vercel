"use server";

import { prisma } from "@/lib/prisma";
import { consumeAdminToken, revokeAdminTokens } from "@/lib/admin/tokens";
import { logAccountActivity } from "@/lib/admin/accounts";
import type { AccountFormState } from "@/lib/admin/accountSchema";

const INVALID_LINK = "This confirmation link is invalid or has expired. Request the email change again.";

export async function confirmEmailChange(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const row = await consumeAdminToken(String(formData.get("token") ?? ""), "email_change");
  if (!row?.newEmail || !row.adminUser.isActive) return { error: INVALID_LINK };

  const taken = await prisma.adminUser.findUnique({ where: { email: row.newEmail } });
  if (taken) return { error: "Another admin account started using this email in the meantime." };

  const oldEmail = row.adminUser.email;
  await prisma.adminUser.update({
    where: { id: row.adminUserId },
    data: { email: row.newEmail, emailVerifiedAt: new Date() },
  });
  // A reset link sent to the old inbox shouldn't outlive the change.
  await revokeAdminTokens(row.adminUserId, ["password_reset"]);
  await logAccountActivity(
    { id: row.adminUserId, email: row.newEmail },
    `Confirmed email change from ${oldEmail} to ${row.newEmail}`
  );

  return { success: true, message: row.newEmail };
}
