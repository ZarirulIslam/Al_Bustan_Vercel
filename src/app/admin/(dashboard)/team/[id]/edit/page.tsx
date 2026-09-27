import { notFound } from "next/navigation";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { updateTeamMember } from "@/app/admin/(dashboard)/team/actions";
import { getTeamMemberByIdAdmin } from "@/lib/admin/teamMembers";

export const dynamic = "force-dynamic";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getTeamMemberByIdAdmin(id);
  if (!member) notFound();

  const boundUpdate = updateTeamMember.bind(null, member.id);

  return (
    <div>
      <h1 className="text-3xl">Edit Team Member</h1>
      <p className="mt-1 text-sm text-ink-soft">{member.name}</p>

      <div className="mt-8 max-w-2xl">
        <TeamMemberForm action={boundUpdate} member={member} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
