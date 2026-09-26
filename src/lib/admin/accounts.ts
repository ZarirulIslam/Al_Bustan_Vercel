import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { issueAdminToken, revokeAdminTokens } from "@/lib/admin/tokens";
import { sendEmailChangeNotice, sendEmailChangeVerification } from "@/lib/admin/authEmails";

export const BCRYPT_COST = 10;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Invited accounts need *some* passwordHash before they've chosen a
// password; a hash of random bytes nobody knows means the account
// simply can't be signed into until the invite is accepted.
export function unusablePasswordHash() {
  return hashPassword(randomBytes(32).toString("base64url"));
}

// Sets a new password and signs the account out everywhere (bumping
// sessionVersion invalidates every existing session JWT — see
// src/lib/auth.ts). `markEmailVerified` is for flows that prove the
// admin controls their inbox (reset link, invite link).
export async function setAdminPassword(
  adminUserId: string,
  password: string,
  opts: { markEmailVerified?: boolean } = {}
) {
  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: adminUserId } });
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      passwordHash: await hashPassword(password),
      sessionVersion: { increment: 1 },
      ...(opts.markEmailVerified && !admin.emailVerifiedAt ? { emailVerifiedAt: new Date() } : {}),
    },
  });
  // Any other outstanding reset link is now moot.
  await prisma.adminToken.deleteMany({ where: { adminUserId, type: "password_reset" } });
}

// Activity log entry for flows with no signed-in session (reset,
// invite acceptance, email confirmation) — logActivity() reads the
// session, so these write the row directly. Best-effort, like
// logActivity().
export async function logAccountActivity(
  admin: { id: string; email: string },
  description: string,
  action: "created" | "updated" = "updated"
) {
  await prisma.activityLog
    .create({
      data: {
        adminUserId: admin.id,
        adminEmail: admin.email,
        action,
        resource: "AdminUser",
        resourceId: admin.id,
        description,
      },
    })
    .catch(() => {});
}

// Email changes never take effect directly: the new address gets a
// confirmation link (proving the admin controls it — this is the
// email verification step), and the current address gets a heads-up
// so a hijacked session can't quietly move the account. Returns an
// error message, or null on success.
export async function requestEmailChange(
  admin: { id: string; email: string },
  newEmail: string
): Promise<string | null> {
  const taken = await prisma.adminUser.findUnique({ where: { email: newEmail } });
  if (taken) return "Another admin account already uses this email.";

  const token = await issueAdminToken(admin.id, "email_change", newEmail);
  try {
    await sendEmailChangeVerification(newEmail, token);
  } catch (error) {
    console.error("[email-change] Failed to send verification email:", error);
    await revokeAdminTokens(admin.id, ["email_change"]);
    return "We couldn't send the confirmation email right now. Please try again in a few minutes.";
  }
  // The heads-up is a courtesy; its failure shouldn't block the change.
  await sendEmailChangeNotice(admin.email, newEmail).catch((error) =>
    console.error("[email-change] Failed to send notice to old address:", error)
  );
  return null;
}

// A profile picture must be a file our own upload pipeline put in the
// "avatars" folder — never an arbitrary URL a client submits.
export function isOwnAvatarUrl(url: string): boolean {
  if (url.includes("..")) return false;
  if (url.startsWith("/uploads/avatars/")) return true;
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  return !!base && !!bucket && url.startsWith(`${base}/storage/v1/object/public/${bucket}/avatars/`);
}

export async function getPendingEmailChange(adminUserId: string) {
  const row = await prisma.adminToken.findFirst({
    where: { adminUserId, type: "email_change", expiresAt: { gt: new Date() } },
    select: { newEmail: true, expiresAt: true },
  });
  return row?.newEmail ? { newEmail: row.newEmail, expiresAt: row.expiresAt } : null;
}
