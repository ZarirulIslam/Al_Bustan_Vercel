import { prisma } from "@/lib/prisma";
import type { Redirect } from "@/lib/types";

function mapRedirect(row: {
  id: string;
  fromPath: string;
  toPath: string;
  kind: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Redirect {
  return {
    id: row.id,
    fromPath: row.fromPath,
    toPath: row.toPath,
    kind: row.kind as Redirect["kind"],
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAllRedirectsAdmin(): Promise<Redirect[]> {
  const rows = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapRedirect);
}

export async function getRedirectByIdAdmin(id: string): Promise<Redirect | null> {
  const row = await prisma.redirect.findUnique({ where: { id } });
  return row ? mapRedirect(row) : null;
}
