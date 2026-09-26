// Transactional email via Brevo's HTTP API (works on the free plan).
// Called directly with fetch rather than through Brevo's SDK — it's a
// single POST, and this keeps the dependency list unchanged.
//
// Required env (see .env.example):
//   BREVO_API_KEY       — Brevo → SMTP & API → API Keys
//   EMAIL_FROM_ADDRESS  — must be a sender verified in Brevo
//   EMAIL_FROM_NAME     — optional display name

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email sending is not configured (BREVO_API_KEY / EMAIL_FROM_ADDRESS).");
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !fromAddress) throw new EmailNotConfiguredError();

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromAddress, name: process.env.EMAIL_FROM_NAME || "Al Bustan Admin" },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}
