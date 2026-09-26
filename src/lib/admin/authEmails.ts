import { headers } from "next/headers";
import type { AdminRole } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/data/settings";
import { TOKEN_TTL_MS } from "@/lib/admin/tokens";
import { roleLabel } from "@/lib/admin/roles";

// NEXTAUTH_URL is the canonical public URL wherever it's set. The
// request's own host is only a fallback (e.g. Vercel preview deploys
// that leave NEXTAUTH_URL unset).
async function getAppBaseUrl(): Promise<string> {
  const configured = process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function linkTo(path: string, token: string) {
  return `${await getAppBaseUrl()}${path}?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function describeTtl(ms: number): string {
  const minutes = ms / 60000;
  if (minutes < 120) return `${minutes} minutes`;
  const hours = minutes / 60;
  return hours % 24 === 0 ? `${hours / 24} day${hours === 24 ? "" : "s"}` : `${hours} hours`;
}

// One layout for every auth email, matching the dashboard's
// garden-green/limestone palette.
async function sendAuthEmail(params: {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footer: string;
}) {
  const { companyName } = await getSiteSettings();
  const company = escapeHtml(companyName);

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f2ec;font-family:Arial,Helvetica,sans-serif;color:#1f2a24">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:8px;padding:32px">
    <p style="margin:0 0 4px;font-size:14px;color:#2f5d45">${company}</p>
    <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(params.heading)}</h1>
    ${params.paragraphs.map((p) => `<p style="font-size:14px;line-height:1.6">${escapeHtml(p)}</p>`).join("\n    ")}
    ${
      params.button
        ? `<p style="margin:24px 0"><a href="${escapeHtml(params.button.url)}" style="display:inline-block;background:#2f5d45;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px">${escapeHtml(params.button.label)}</a></p>
    <p style="font-size:12px;line-height:1.6;color:#5b655f">If the button doesn't work, paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(params.button.url)}</span></p>`
        : ""
    }
    <p style="font-size:12px;line-height:1.6;color:#5b655f">${escapeHtml(params.footer)}</p>
  </div>
</body></html>`;

  const text = [
    params.heading,
    "",
    ...params.paragraphs.flatMap((p) => [p, ""]),
    ...(params.button ? [`${params.button.label}: ${params.button.url}`, ""] : []),
    params.footer,
  ].join("\n");

  await sendEmail({ to: params.to, subject: `${companyName} admin: ${params.subject}`, html, text });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  await sendAuthEmail({
    to,
    subject: "reset your password",
    heading: "Reset your admin password",
    paragraphs: [
      "Someone (hopefully you) asked to reset your admin dashboard password. Click the button below to choose a new one.",
      `The link is valid for ${describeTtl(TOKEN_TTL_MS.password_reset)} and can only be used once.`,
    ],
    button: { label: "Reset password", url: await linkTo("/admin/reset-password", token) },
    footer: "If you didn't request this, you can ignore this email — your password won't change.",
  });
}

export async function sendInviteEmail(params: {
  to: string;
  token: string;
  role: AdminRole;
  invitedBy: string;
}) {
  await sendAuthEmail({
    to: params.to,
    subject: "you've been invited to the admin dashboard",
    heading: "You've been invited",
    paragraphs: [
      `${params.invitedBy} has created a ${roleLabel(params.role)} account for you on the admin dashboard.`,
      `Click the button below to confirm your email address and set your password. The link is valid for ${describeTtl(TOKEN_TTL_MS.invite)} and can only be used once.`,
    ],
    button: { label: "Accept invitation", url: await linkTo("/admin/accept-invite", params.token) },
    footer: "If you weren't expecting this, you can ignore this email — no account will be usable without it.",
  });
}

export async function sendEmailChangeVerification(to: string, token: string) {
  await sendAuthEmail({
    to,
    subject: "confirm your new email address",
    heading: "Confirm your new email address",
    paragraphs: [
      "This address was entered as the new sign-in email for an admin dashboard account. Click the button below to confirm it.",
      `Until it's confirmed, the account keeps using its current email. The link is valid for ${describeTtl(TOKEN_TTL_MS.email_change)}.`,
    ],
    button: { label: "Confirm email address", url: await linkTo("/admin/verify-email", token) },
    footer: "If you didn't expect this, you can ignore this email — nothing will change.",
  });
}

export async function sendEmailChangeNotice(to: string, newEmail: string) {
  await sendAuthEmail({
    to,
    subject: "email change requested",
    heading: "Email change requested",
    paragraphs: [
      `A request was made to change the sign-in email of your admin dashboard account to ${newEmail}. It only takes effect once that new address is confirmed.`,
    ],
    footer:
      "If this wasn't you, sign in and change your password straight away, or contact a Super Admin.",
  });
}
