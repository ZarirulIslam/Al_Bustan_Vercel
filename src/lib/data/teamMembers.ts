import { prisma } from "@/lib/prisma";
import { mapTeamMember } from "@/lib/data/mapTeamMember";
import type { TeamMember } from "@/lib/types";

export async function getPublishedTeamMembers(): Promise<TeamMember[]> {
  const rows = await prisma.teamMember.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapTeamMember);
}
