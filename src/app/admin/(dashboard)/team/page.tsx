import { TeamMemberTable } from "@/components/admin/TeamMemberTable";
import { TeamSectionVisibility } from "@/components/admin/TeamSectionVisibility";
import { Button } from "@/components/ui/Button";
import { getAllTeamMembersAdmin } from "@/lib/admin/teamMembers";
import { getHomepageSettings } from "@/lib/data/homepageSettings";
import { getAboutPageSettings } from "@/lib/data/aboutPageSettings";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const [members, homepageSettings, aboutPageSettings] = await Promise.all([
    getAllTeamMembersAdmin(),
    getHomepageSettings(),
    getAboutPageSettings(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">Team</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            One shared team directory — edits apply everywhere a member is shown. Use the arrows to
            reorder, and the switches below to show or hide the section on each page.
          </p>
        </div>
        <Button href="/admin/team/new">Add Team Member</Button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg">Section visibility</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Independent per page. The section is also hidden automatically if no members are published.
        </p>
        <div className="mt-4">
          <TeamSectionVisibility
            home={homepageSettings.teamSectionEnabled}
            about={aboutPageSettings.teamSectionEnabled}
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg">Team members</h2>
        <div className="mt-4">
          <TeamMemberTable members={members} />
        </div>
      </div>
    </div>
  );
}
