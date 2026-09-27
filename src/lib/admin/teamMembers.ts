import { prisma } from "@/lib/prisma";
import { mapTeamMember } from "@/lib/data/mapTeamMember";
import type { TeamMember } from "@/lib/types";

export async function getAllTeamMembersAdmin(): Promise<TeamMember[]> {
  const rows = await prisma.teamMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapTeamMember);
}

export async function getTeamMemberByIdAdmin(id: string): Promise<TeamMember | null> {
  const row = await prisma.teamMember.findUnique({ where: { id } });
  return row ? mapTeamMember(row) : null;
}
