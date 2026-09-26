import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

// The raw token only ever exists in the emailed link; the database
// keeps its SHA-256 hash, so a leaked DB row can't be used to reset
// the password. (A fast hash is fine here — the token is 256 random
// bits, not a guessable human password.)
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

// NEXTAUTH_URL is the canonical public URL wherever it's set. The
// request's own host is only a fallback (e.g. Vercel preview deploys
// that leave NEXTAUTH_URL unset).
export async function getAppBaseUrl(): Promise<string> {
  const configured = process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function passwordResetEmail(resetUrl: string, companyName: string) {
  const safeUrl = escapeHtml(resetUrl);
  const safeCompany = escapeHtml(companyName);
  const minutes = PASSWORD_RESET_TTL_MS / 60000;

  return {
    subject: `${companyName} admin: reset your password`,
    text: [
      `Someone (hopefully you) asked to reset the ${companyName} admin password.`,
      "",
      `Open this link to choose a new password (valid for ${minutes} minutes, single use):`,
      resetUrl,
      "",
      "If you didn't request this, you can ignore this email — your password won't change.",
    ].join("\n"),
    html: `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f2ec;font-family:Arial,Helvetica,sans-serif;color:#1f2a24">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:8px;padding:32px">
    <p style="margin:0 0 4px;font-size:14px;color:#2f5d45">${safeCompany}</p>
    <h1 style="margin:0 0 16px;font-size:22px">Reset your admin password</h1>
    <p style="font-size:14px;line-height:1.6">Someone (hopefully you) asked to reset the admin password. Click the button below to choose a new one. The link is valid for ${minutes} minutes and can only be used once.</p>
    <p style="margin:24px 0"><a href="${safeUrl}" style="display:inline-block;background:#2f5d45;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px">Reset password</a></p>
    <p style="font-size:12px;line-height:1.6;color:#5b655f">If the button doesn't work, paste this link into your browser:<br><span style="word-break:break-all">${safeUrl}</span></p>
    <p style="font-size:12px;line-height:1.6;color:#5b655f">If you didn't request this, you can ignore this email — your password won't change.</p>
  </div>
</body></html>`,
  };
}
