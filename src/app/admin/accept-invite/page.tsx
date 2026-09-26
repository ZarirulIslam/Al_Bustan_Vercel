import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AcceptInviteForm } from "@/components/admin/AdminAuthForms";
import { acceptInvite } from "@/app/admin/accept-invite/actions";
import { findValidAdminToken } from "@/lib/admin/tokens";
import { defaultSiteSettings } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Keep the token in this page's URL from leaking to other origins
// through the Referer header.
export const metadata: Metadata = { referrer: "no-referrer" };

// Viewing the page only *looks up* the invite (to show the email);
// it's consumed when the form is submitted, so email link-scanners
// that prefetch URLs can't burn it.
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = token ? await findValidAdminToken(token, "invite") : null;
  const usable = invite?.adminUser.isActive ? invite : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-limestone-200">
      <Container className="max-w-sm">
        <div className="rounded-md border border-limestone-300 bg-white p-8 shadow-card">
          <p className="font-display text-lg text-garden-700">
            {defaultSiteSettings.companyName}
          </p>
          <h1 className="mt-2 text-2xl">Accept Invitation</h1>
          {token && usable ? (
            <AcceptInviteForm
              action={acceptInvite}
              token={token}
              email={usable.adminUser.email}
              defaultName={usable.adminUser.name ?? ""}
            />
          ) : (
            <p className="mt-4 text-sm text-red-700">
              This invitation link is invalid or has expired. Ask a Super Admin to send you a new one.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
