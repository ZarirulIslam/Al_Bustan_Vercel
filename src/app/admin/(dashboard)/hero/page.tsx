import { AddHeroSlidesForm } from "@/components/admin/AddHeroSlidesForm";
import { AdminHeroSlidesGrid } from "@/components/admin/AdminHeroSlidesGrid";
import { getAllHeroSlidesAdmin } from "@/lib/admin/hero";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const slides = await getAllHeroSlidesAdmin();

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Homepage Hero</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Manage the background images that rotate through the homepage hero slider.
          Only published slides appear on the site, in the order shown below. The hero's
          text and buttons are edited separately under "Homepage".
        </p>
      </div>

      <div className="mt-8 max-w-xl">
        <AddHeroSlidesForm />
      </div>

      <h2 className="mt-10 text-lg">Slides</h2>
      <div className="mt-4">
        <AdminHeroSlidesGrid slides={slides} />
      </div>
    </div>
  );
}
