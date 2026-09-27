import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { createTeamMember } from "@/app/admin/(dashboard)/team/actions";

export const dynamic = "force-dynamic";

export default function NewTeamMemberPage() {
  return (
    <div>
      <h1 className="text-3xl">Add Team Member</h1>
      <p className="mt-1 text-sm text-ink-soft">Add a person to the team section.</p>

      <div className="mt-8 max-w-2xl">
        <TeamMemberForm action={createTeamMember} submitLabel="Add Team Member" />
      </div>
    </div>
  );
}
