import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasSectionAccess, sectionLabel, type AdminSection } from "@/lib/admin/permissions";

// Authorization helpers. getServerSession() already fails for
// deactivated/deleted accounts (see the jwt callback in auth.ts); these
// add the role and per-section checks on top, always against the
// database row rather than the (possibly stale) session.

export async function getCurrentAdmin() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const admin = await prisma.adminUser.findUnique({ where: { id } });
  return admin?.isActive ? admin : null;
}

// For server actions: throws (like the existing requireAdmin helpers).
export async function requireCurrentAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated.");
  return admin;
}

// For server actions of a dashboard section (each actions.ts's
// requireAdmin() delegates here). Server actions can be invoked from
// any page, so this — not the proxy's page check — is what stops an
// admin from using a section they weren't granted.
export async function requireSectionAccess(section: AdminSection) {
  const admin = await requireCurrentAdmin();
  if (!hasSectionAccess(admin, section)) {
    throw new Error(`You don't have access to ${sectionLabel(section)}.`);
  }
  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireCurrentAdmin();
  if (admin.role !== "super_admin") throw new Error("Only a Super Admin can do this.");
  return admin;
}

// For pages: plain admins get a 404 rather than a hint that the page
// exists.
export async function requireSuperAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "super_admin") notFound();
  return admin;
}
