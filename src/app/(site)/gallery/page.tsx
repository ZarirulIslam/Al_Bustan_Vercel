import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { getGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = {
  title: "Gallery",
};

export const revalidate = 0;

export default async function GalleryPage() {
  const items = await getGalleryItems();
  const projectCount = new Set(items.flatMap((i) => (i.projectSlug ? [i.projectSlug] : []))).size;

  return (
    <>
      {/* Header band — deep green, with a soft collage of the first photos behind it. */}
      <section className="relative overflow-hidden bg-garden-900">
        {items.length > 0 && (
          <div aria-hidden="true" className="absolute inset-0 grid grid-cols-3 opacity-25 md:grid-cols-5">
            {items.slice(0, 5).map((item, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={item.url}
                alt=""
                className={`h-full w-full object-cover ${i >= 3 ? "hidden md:block" : ""}`}
                loading="lazy"
              />
            ))}
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-garden-900 via-garden-900/80 to-garden-900/60" />
        <Container className="relative py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-light">Gallery</p>
          <h1 className="mt-3 max-w-2xl text-3xl text-white sm:text-4xl md:text-5xl">A closer look at our communities</h1>
          <p className="mt-4 max-w-xl text-limestone-200/80">
            Roads, plots, open spaces and progress on site — photos from our projects, gathered in one place.
          </p>
          {items.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-limestone-200/60">Photos</dt>
                <dd className="mt-1 font-display text-3xl text-white tabular-nums">{items.length}</dd>
              </div>
              {projectCount > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-limestone-200/60">Projects</dt>
                  <dd className="mt-1 font-display text-3xl text-white tabular-nums">{projectCount}</dd>
                </div>
              )}
            </dl>
          )}
        </Container>
      </section>

      <section className="bg-limestone py-10 md:py-16">
        <Container>
          {items.length === 0 ? (
            <EmptyState
              title="No photos yet"
              description="Photos from published projects and any images added by the team will appear here."
            />
          ) : (
            <GalleryGrid items={items} />
          )}
        </Container>
      </section>
    </>
  );
}
