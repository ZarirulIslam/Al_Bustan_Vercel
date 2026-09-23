import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ProjectGrid } from "@/components/ui/ProjectGrid";
import { getProjectsByStatus } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Ongoing Projects",
};

export const revalidate = 0;

export default async function OngoingProjectsPage() {
  const projects = await getProjectsByStatus("ongoing");

  return (
    <Section className="pt-16 md:pt-20">
      <Container>
        <p className="text-sm text-brass">Projects — Ongoing</p>
        <h1 className="mt-3 max-w-xl text-4xl md:text-5xl">
          Currently under development
        </h1>
        <div className="mt-10">
          <ProjectGrid
            projects={projects}
            emptyTitle="No projects to show yet"
            emptyDescription="Please check back soon or contact our team for the latest updates."
          />
        </div>
      </Container>
    </Section>
  );
}
