import { AdminUserForm } from "@/components/admin/AdminUserForm";
import { inviteAdminUser } from "@/app/admin/(dashboard)/users/actions";
import { requireSuperAdminPage } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function InviteAdminUserPage() {
  await requireSuperAdminPage();

  return (
    <div>
      <h1 className="text-3xl">Invite Admin</h1>
      <p className="mt-1 text-sm text-ink-soft">
        They&apos;ll get an email with a link to confirm their address and choose their own password.
      </p>

      <div className="mt-8 max-w-2xl">
        <AdminUserForm action={inviteAdminUser} submitLabel="Send Invitation" />
      </div>
    </div>
  );
}
