import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ConfirmEmailForm } from "@/components/admin/AdminAuthForms";
import { confirmEmailChange } from "@/app/admin/verify-email/actions";
import { findValidAdminToken } from "@/lib/admin/tokens";
import { defaultSiteSettings } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Keep the token in this page's URL from leaking to other origins
// through the Referer header.
export const metadata: Metadata = { referrer: "no-referrer" };

// Confirmation needs a button press (a POST), not just the page view,
// so email link-scanners that prefetch URLs can't confirm on their own.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const pending = token ? await findValidAdminToken(token, "email_change") : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-limestone-200">
      <Container className="max-w-sm">
        <div className="rounded-md border border-limestone-300 bg-white p-8 shadow-card">
          <p className="font-display text-lg text-garden-700">
            {defaultSiteSettings.companyName}
          </p>
          <h1 className="mt-2 text-2xl">Confirm New Email</h1>
          {token && pending?.newEmail ? (
            <ConfirmEmailForm action={confirmEmailChange} token={token} newEmail={pending.newEmail} />
          ) : (
            <p className="mt-4 text-sm text-red-700">
              This confirmation link is invalid or has expired. Request the email change again.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
