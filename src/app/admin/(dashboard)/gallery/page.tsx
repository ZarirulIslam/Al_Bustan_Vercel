import { AddGalleryImagesForm } from "@/components/admin/AddGalleryImagesForm";
import { AdminGalleryGrid } from "@/components/admin/AdminGalleryGrid";
import { getAllGalleryImagesAdmin } from "@/lib/admin/gallery";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const images = await getAllGalleryImagesAdmin();

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Gallery</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          The public Gallery page automatically shows photos from every published
          project. Add standalone photos here for anything that isn&apos;t tied to a
          specific project.
        </p>
      </div>

      <div className="mt-8 max-w-xl">
        <AddGalleryImagesForm />
      </div>

      <h2 className="mt-10 text-lg">Standalone Photos</h2>
      <div className="mt-4">
        <AdminGalleryGrid images={images} />
      </div>
    </div>
  );
}
