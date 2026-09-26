"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueAdminToken } from "@/lib/admin/tokens";
import { sendPasswordResetEmail } from "@/lib/admin/authEmails";
import type { AccountFormState } from "@/lib/admin/accountSchema";

// Same best-effort, in-memory caveats as the login throttle in
// src/lib/auth.ts: stops someone from hammering the form to flood the
// admin inbox (or burn the Brevo free-plan daily quota), without
// adding an external store.
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const lastRequestAt = new Map<string, number>();

// Always the same answer whether or not the address matches an admin,
// so the form can't be used to discover the admin email.
const GENERIC_MESSAGE =
  "If that email belongs to an admin account, a password reset link is on its way. Check your inbox (and spam folder).";

export async function requestPasswordReset(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const parsed = z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .safeParse(formData.get("email") ?? "");
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };

  const email = parsed.data;

  const last = lastRequestAt.get(email);
  if (last && Date.now() - last < RESEND_COOLDOWN_MS) {
    return { success: true, message: GENERIC_MESSAGE };
  }
  lastRequestAt.set(email, Date.now());

  // Deactivated accounts get the same generic answer and no email.
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin?.isActive) return { success: true, message: GENERIC_MESSAGE };

  const token = await issueAdminToken(admin.id, "password_reset");

  try {
    await sendPasswordResetEmail(admin.email, token);
  } catch (error) {
    console.error("[password-reset] Failed to send reset email:", error);
    // Let them retry straight away rather than wait out the cooldown
    // for an email that never went out.
    lastRequestAt.delete(email);
    return { error: "We couldn't send the reset email right now. Please try again in a few minutes." };
  }

  return { success: true, message: GENERIC_MESSAGE };
}
