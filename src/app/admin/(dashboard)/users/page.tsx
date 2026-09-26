import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { Button } from "@/components/ui/Button";
import { requireSuperAdminPage } from "@/lib/adminAuth";
import { getAllAdminUsers } from "@/lib/admin/adminUsers";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentAdmin = await requireSuperAdminPage();
  const users = await getAllAdminUsers();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">Admin Users</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Who can sign in to this dashboard, and with what access level. Only Super Admins see this page.
          </p>
        </div>
        <Button href="/admin/users/new">Invite Admin</Button>
      </div>

      <div className="mt-8">
        <AdminUserTable users={users} currentUserId={currentAdmin.id} />
      </div>
    </div>
  );
}
