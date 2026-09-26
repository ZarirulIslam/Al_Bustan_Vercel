import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChangeEmailForm, ChangePasswordForm } from "@/components/admin/AccountSettingsForms";
import { changeEmail, changePassword } from "@/app/admin/(dashboard)/account/actions";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Admin Account</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Your sign-in email and password for this dashboard.
        </p>
      </div>

      <div className="mt-8 max-w-3xl space-y-10">
        <section>
          <h2 className="text-lg">Email Address</h2>
          <div className="mt-4">
            <ChangeEmailForm action={changeEmail} currentEmail={email} />
          </div>
        </section>

        <section className="border-t border-limestone-300 pt-10">
          <h2 className="text-lg">Password</h2>
          <div className="mt-4">
            <ChangePasswordForm action={changePassword} />
          </div>
        </section>
      </div>
    </div>
  );
}
