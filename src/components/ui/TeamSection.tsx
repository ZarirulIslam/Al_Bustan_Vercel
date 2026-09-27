import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RichText } from "@/components/ui/RichText";
import { TeamBioDialog } from "@/components/ui/TeamBioDialog";
import { isEmptyRichHtml } from "@/lib/richText/shared";
import type { TeamMember } from "@/lib/types";

export function personInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Shared by the homepage and About page — one member directory,
// admin-managed at /admin/team, and each page has its own independent
// show/hide toggle. Callers are
// expected to skip rendering when there are no published members.
export function TeamSection({ members, className }: { members: TeamMember[]; className?: string }) {
  return (
    <Section className={className}>
      <Container>
        <Eyebrow>Our People</Eyebrow>
        <h2 className="mt-2 max-w-md text-3xl md:text-4xl">Meet our team</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((member) => (
            <div key={member.id}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-garden-100 shadow-card">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={member.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-4xl text-garden-700">
                    {personInitials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-lg">{member.name}</h3>
              <p className="mt-0.5 text-sm text-ink-soft">{member.designation}</p>
              <RichText html={member.shortTitle} className="mt-2 text-sm text-ink-soft/90" />
              {!isEmptyRichHtml(member.bio) && (
                <TeamBioDialog name={member.name} designation={member.designation}>
                  <RichText html={member.bio} />
                </TeamBioDialog>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
