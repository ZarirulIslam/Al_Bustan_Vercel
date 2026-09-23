import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { getGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = {
  title: "Gallery",
};

export const revalidate = 0;

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <Section className="pt-16 md:pt-20">
      <Container>
        <p className="text-sm text-brass">Gallery</p>
        <h1 className="mt-3 max-w-xl text-4xl md:text-5xl">
          A closer look at our communities
        </h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          Photos from our projects, gathered in one place.
        </p>

        <div className="mt-10">
          {items.length === 0 ? (
            <EmptyState
              title="No photos yet"
              description="Photos from published projects and any images added by the team will appear here."
            />
          ) : (
            <GalleryGrid items={items} />
          )}
        </div>
      </Container>
    </Section>
  );
}
