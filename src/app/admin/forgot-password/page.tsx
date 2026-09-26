import { Container } from "@/components/ui/Container";
import { ForgotPasswordForm } from "@/components/admin/AdminAuthForms";
import { requestPasswordReset } from "@/app/admin/forgot-password/actions";
import { defaultSiteSettings } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-limestone-200">
      <Container className="max-w-sm">
        <div className="rounded-md border border-limestone-300 bg-white p-8 shadow-card">
          <p className="font-display text-lg text-garden-700">
            {defaultSiteSettings.companyName}
          </p>
          <h1 className="mt-2 text-2xl">Forgot Password</h1>
          <ForgotPasswordForm action={requestPasswordReset} />
        </div>
      </Container>
    </div>
  );
}
