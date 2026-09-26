import type { AdminRole, AdminToken, AdminUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  // "invited" = hasn't accepted the invitation yet (email unverified).
  status: "active" | "invited" | "deactivated";
  inviteExpired: boolean;
  pendingEmail: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

function toRow(user: AdminUser & { tokens: AdminToken[] }): AdminUserRow {
  const now = new Date();
  const invite = user.tokens.find((t) => t.type === "invite");
  const emailChange = user.tokens.find((t) => t.type === "email_change" && t.expiresAt > now);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    permissions: user.permissions,
    isActive: user.isActive,
    status: !user.isActive ? "deactivated" : user.emailVerifiedAt ? "active" : "invited",
    inviteExpired: !user.emailVerifiedAt && (!invite || invite.expiresAt <= now),
    pendingEmail: emailChange?.newEmail ?? null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function getAllAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.adminUser.findMany({
    include: { tokens: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return users.map(toRow);
}

export async function getAdminUserById(id: string): Promise<AdminUserRow | null> {
  const user = await prisma.adminUser.findUnique({ where: { id }, include: { tokens: true } });
  return user ? toRow(user) : null;
}
