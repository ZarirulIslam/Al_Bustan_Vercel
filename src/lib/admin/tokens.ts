import { createHash, randomBytes } from "crypto";
import type { AdminTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TOKEN_TTL_MS: Record<AdminTokenType, number> = {
  password_reset: 30 * 60 * 1000, // 30 minutes
  email_change: 24 * 60 * 60 * 1000, // 24 hours
  invite: 72 * 60 * 60 * 1000, // 3 days
};

// The raw token only ever exists in the emailed link; the database
// keeps its SHA-256 hash, so a leaked DB row can't be used. (A fast
// hash is fine here — the token is 256 random bits, not a guessable
// human password.)
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Issues a fresh token, replacing any earlier one of the same type for
// this admin — only the most recently emailed link ever works.
export async function issueAdminToken(
  adminUserId: string,
  type: AdminTokenType,
  newEmail?: string
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.adminToken.deleteMany({ where: { adminUserId, type } }),
    prisma.adminToken.create({
      data: {
        adminUserId,
        type,
        tokenHash: hashToken(token),
        newEmail: newEmail ?? null,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
      },
    }),
  ]);
  return token;
}

// Looks a token up without using it (e.g. to show who an invite is
// for). Returns null when unknown, the wrong type, or expired.
export async function findValidAdminToken(token: string, type: AdminTokenType) {
  if (!token) return null;
  const row = await prisma.adminToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  });
  if (!row || row.type !== type || row.expiresAt < new Date()) return null;
  return row;
}

// Validates and deletes the token in one step. The delete is
// conditional on the row still existing, so two simultaneous submits
// of the same link can't both succeed.
export async function consumeAdminToken(token: string, type: AdminTokenType) {
  const row = await findValidAdminToken(token, type);
  if (!row) return null;
  const { count } = await prisma.adminToken.deleteMany({ where: { id: row.id } });
  return count === 1 ? row : null;
}

export async function revokeAdminTokens(adminUserId: string, types: AdminTokenType[]) {
  await prisma.adminToken.deleteMany({ where: { adminUserId, type: { in: types } } });
}
