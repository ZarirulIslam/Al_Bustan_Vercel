import { AdminUserGrid } from "@/components/admin/AdminUserGrid";
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
        <Button href="/admin/users/new">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M18 8v6M15 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Invite Admin
        </Button>
      </div>

      <div className="mt-8">
        <AdminUserGrid users={users} currentUserId={currentAdmin.id} />
      </div>
    </div>
  );
}
