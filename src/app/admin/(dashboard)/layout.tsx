import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // The login page lives under /admin/login but has its own layout-free
  // shell, so this check only ever runs for the protected pages
  // (middleware also guards these routes; this is a defense-in-depth
  // server-side check).
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen flex-col bg-limestone-100 md:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 md:px-12 md:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </AuthSessionProvider>
  );
}
