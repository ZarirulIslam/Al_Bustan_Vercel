import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ResetPasswordForm } from "@/components/admin/PasswordResetForms";
import { resetPassword } from "@/app/admin/reset-password/actions";
import { defaultSiteSettings } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Keep the token in this page's URL from leaking to other origins
// through the Referer header.
export const metadata: Metadata = { referrer: "no-referrer" };

// The token is only checked when the form is submitted (see
// actions.ts) — visiting the link alone never consumes or reveals
// anything, so email link-scanners that prefetch URLs can't burn it.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-limestone-200">
      <Container className="max-w-sm">
        <div className="rounded-md border border-limestone-300 bg-white p-8 shadow-card">
          <p className="font-display text-lg text-garden-700">
            {defaultSiteSettings.companyName}
          </p>
          <h1 className="mt-2 text-2xl">Set a New Password</h1>
          {token ? (
            <ResetPasswordForm action={resetPassword} token={token} />
          ) : (
            <p className="mt-4 text-sm text-red-700">
              This reset link is incomplete.{" "}
              <Link href="/admin/forgot-password" className="font-medium underline">
                Request a new one
              </Link>
              .
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
