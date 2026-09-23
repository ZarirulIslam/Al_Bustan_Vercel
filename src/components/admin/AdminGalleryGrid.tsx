"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { GalleryImage } from "@prisma/client";
import { deleteGalleryImage, toggleGalleryImagePublished } from "@/app/admin/(dashboard)/gallery/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function AdminGalleryGrid({ images }: { images: GalleryImage[] }) {
  const [isPending, startTransition] = useTransition();

  if (images.length === 0) {
    return (
      <EmptyState
        title="No standalone photos yet"
        description="Add some above. Project photos already show on the public Gallery page automatically and don't need to be added here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover"
        >
          <div className="relative aspect-square">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="p-3">
            {image.caption && <p className="truncate text-xs text-ink-soft">{image.caption}</p>}
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => toggleGalleryImagePublished(image.id, !image.published))
                }
                className={
                  image.published
                    ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                    : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                }
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${image.published ? "bg-garden-500" : "bg-ink-soft/50"}`}
                />
                {image.published ? "Published" : "Hidden"}
              </button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Delete this photo? This can't be undone.")) {
                    startTransition(() => deleteGalleryImage(image.id));
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
