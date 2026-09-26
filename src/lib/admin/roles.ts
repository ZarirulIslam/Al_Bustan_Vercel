import type { AdminRole } from "@prisma/client";

// Kept free of server-only imports so client components (sidebar,
// user table) can use it too.
export const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin"];

export function roleLabel(role: AdminRole | string | undefined): string {
  return role === "super_admin" ? "Super Admin" : "Admin";
}
