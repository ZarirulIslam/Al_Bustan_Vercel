import { AvatarForm, ChangeEmailForm, ChangePasswordForm } from "@/components/admin/AccountSettingsForms";
import {
  cancelEmailChange,
  changeEmail,
  changePassword,
  updateAvatar,
} from "@/app/admin/(dashboard)/account/actions";
import { requireCurrentAdmin } from "@/lib/adminAuth";
import { getPendingEmailChange } from "@/lib/admin/accounts";
import { roleLabel } from "@/lib/admin/roles";
import { sectionLabel } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const admin = await requireCurrentAdmin();
  const pending = await getPendingEmailChange(admin.id);

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">My Account</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Your sign-in email and password for this dashboard.
        </p>
      </div>

      <div className="mt-8 max-w-3xl space-y-10">
        <section>
          <h2 className="text-lg">Profile</h2>
          <div className="mt-4">
            <AvatarForm action={updateAvatar} avatarUrl={admin.avatarUrl} label={admin.name ?? admin.email} />
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-soft">Name</dt>
              <dd className="mt-1 font-medium text-ink">{admin.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Access Level</dt>
              <dd className="mt-1 font-medium text-ink">{roleLabel(admin.role)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Email Status</dt>
              <dd className="mt-1 font-medium text-ink">{admin.emailVerifiedAt ? "Verified" : "Not verified"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-soft">
            {admin.role === "super_admin"
              ? "You can access every section of the dashboard and manage admin accounts."
              : `You can access: ${admin.permissions.map(sectionLabel).join(", ") || "no sections yet"}. Ask a Super Admin if you need more.`}
          </p>
        </section>

        <section className="border-t border-limestone-300 pt-10">
          <h2 className="text-lg">Email Address</h2>
          <div className="mt-4">
            <ChangeEmailForm
              action={changeEmail}
              cancelAction={cancelEmailChange}
              currentEmail={admin.email}
              pendingEmail={pending?.newEmail ?? null}
            />
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
