import { AddHeroSlidesForm } from "@/components/admin/AddHeroSlidesForm";
import { AdminHeroSlidesGrid } from "@/components/admin/AdminHeroSlidesGrid";
import { HeroModeSwitch } from "@/components/admin/HeroModeSwitch";
import { HeroVideosManager } from "@/components/admin/HeroVideosManager";
import { getAllHeroSlidesAdmin, getAllHeroVideosAdmin, getHeroMode } from "@/lib/admin/hero";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const [slides, videos, mode] = await Promise.all([getAllHeroSlidesAdmin(), getAllHeroVideosAdmin(), getHeroMode()]);
  const publishedImages = slides.filter((s) => s.published).length;
  const publishedVideos = videos.filter((v) => v.published).length;

  // The section that's live on the homepage comes first.
  const imageSection = (
    <section key="images">
      <SectionHeading title="Image slides" live={mode === "image" || publishedVideos === 0} />
      <div className="mt-4 max-w-xl">
        <AddHeroSlidesForm />
      </div>
      <div className="mt-6">
        <AdminHeroSlidesGrid slides={slides} />
      </div>
    </section>
  );
  const videoSection = (
    <section key="videos">
      <SectionHeading title="Videos" live={mode === "video" && publishedVideos > 0} />
      <div className="mt-4">
        <HeroVideosManager videos={videos} />
      </div>
    </section>
  );

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Homepage Hero</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Choose whether the homepage hero shows an image slider or a video slider, and manage both. Only published
          items appear on the site, in the order shown below. The hero&apos;s text and buttons are edited separately under
          &quot;Homepage&quot;.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <HeroModeSwitch mode={mode} publishedImages={publishedImages} publishedVideos={publishedVideos} />
      </div>

      <div className="mt-10 space-y-12">
        {mode === "video" ? [videoSection, imageSection] : [imageSection, videoSection]}
      </div>
    </div>
  );
}

function SectionHeading({ title, live }: { title: string; live: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-limestone-300 pb-2">
      <h2 className="text-lg">{title}</h2>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          live ? "bg-garden-100 text-garden-700" : "bg-limestone-200 text-ink-soft"
        )}
      >
        {live ? "Showing on the homepage" : "Not showing now"}
      </span>
    </div>
  );
}
