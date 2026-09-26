import { notFound } from "next/navigation";
import { AdminUserForm } from "@/components/admin/AdminUserForm";
import { updateAdminUser } from "@/app/admin/(dashboard)/users/actions";
import { requireSuperAdminPage } from "@/lib/adminAuth";
import { getAdminUserById } from "@/lib/admin/adminUsers";

export const dynamic = "force-dynamic";

export default async function EditAdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentAdmin = await requireSuperAdminPage();
  const { id } = await params;
  const user = await getAdminUserById(id);
  if (!user) notFound();

  const boundUpdate = updateAdminUser.bind(null, user.id);

  return (
    <div>
      <h1 className="text-3xl">Edit Admin</h1>
      <p className="mt-1 text-sm text-ink-soft">{user.name ?? user.email}</p>

      <div className="mt-8 max-w-2xl">
        <AdminUserForm
          action={boundUpdate}
          user={user}
          isSelf={user.id === currentAdmin.id}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
