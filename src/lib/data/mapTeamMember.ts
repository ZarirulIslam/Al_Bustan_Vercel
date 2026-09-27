import type { TeamMember as PrismaTeamMember } from "@prisma/client";
import type { TeamMember } from "@/lib/types";

export function mapTeamMember(row: PrismaTeamMember): TeamMember {
  return {
    id: row.id,
    name: row.name,
    designation: row.designation,
    shortTitle: row.shortTitle,
    bio: row.bio,
    photoUrl: row.photoUrl,
    order: row.order,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
