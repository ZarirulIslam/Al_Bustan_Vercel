"use client";

import Image from "next/image";
import type { TeamMember } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminAction } from "@/components/admin/AdminToaster";
import {
  deleteTeamMember,
  toggleTeamMemberPublished,
  moveTeamMember,
} from "@/app/admin/(dashboard)/team/actions";
import { personInitials } from "@/components/ui/TeamSection";
import { richTextPreview } from "@/lib/richText/shared";

function TeamMemberRow({ member, index, total }: { member: TeamMember; index: number; total: number }) {
  const { run, isPending } = useAdminAction();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-limestone-300 bg-white p-5 shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover sm:flex-row sm:items-center">
      <div className="flex flex-shrink-0 flex-row items-center gap-3">
        <div className="flex gap-2 sm:flex-col">
          <button
            type="button"
            aria-label="Move up"
            disabled={isPending || index === 0}
            onClick={() => run(() => moveTeamMember(member.id, "up"))}
            className="rounded-lg border border-limestone-300 px-2 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={isPending || index === total - 1}
            onClick={() => run(() => moveTeamMember(member.id, "down"))}
            className="rounded-lg border border-limestone-300 px-2 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓
          </button>
        </div>
        {member.photoUrl ? (
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-limestone-300">
            <Image src={member.photoUrl} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-garden-100 text-sm font-semibold text-garden-700">
            {personInitials(member.name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{member.name}</p>
        <p className="text-sm text-ink-soft">{member.designation}</p>
        {member.shortTitle && (
          <p className="mt-0.5 truncate text-xs text-ink-soft/80">{richTextPreview(member.shortTitle)}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(
              () => toggleTeamMemberPublished(member.id, !member.published),
              member.published ? "Team member hidden." : "Team member published."
            )
          }
          className={
            member.published
              ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
              : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
          }
        >
          <span className={`h-1.5 w-1.5 rounded-full ${member.published ? "bg-garden-500" : "bg-ink-soft/50"}`} />
          {member.published ? "Published" : "Hidden"}
        </button>
        <Button href={`/admin/team/${member.id}/edit`} variant="ghost" size="sm">
          Edit
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Delete team member "${member.name}"? This can't be undone.`)) {
              run(() => deleteTeamMember(member.id), "Team member deleted.");
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export function TeamMemberTable({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <EmptyState
        title="No team members yet"
        description='Click "Add Team Member" to add the first one.'
        action={<Button href="/admin/team/new">Add Team Member</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member, index) => (
        <TeamMemberRow key={member.id} member={member} index={index} total={members.length} />
      ))}
    </div>
  );
}
