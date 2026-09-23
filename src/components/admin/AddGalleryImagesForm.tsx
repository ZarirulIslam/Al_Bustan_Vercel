"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GalleryImageUploadField } from "@/components/admin/GalleryImageUploadField";
import { addGalleryImages } from "@/app/admin/(dashboard)/gallery/actions";

function SubmitButton({ disabledExtra }: { disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for uploads…" : "Add to Gallery"}
    </Button>
  );
}

export function AddGalleryImagesForm() {
  const [state, formAction] = useActionState(addGalleryImages, {});
  const [uploading, setUploading] = useState(false);
  const [fieldKey, setFieldKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setFieldKey((k) => k + 1); // clears the upload field for the next batch
      router.refresh(); // picks up the newly added images in the list below
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-limestone-300 bg-white p-6 shadow-card">
      <h2 className="text-lg">Add Photos</h2>

      {state.success && (
        <p className="rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
          Photos added to the gallery.
        </p>
      )}
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <GalleryImageUploadField
        key={fieldKey}
        fieldName="imageUrls"
        subdir="gallery"
        onUploadingChange={setUploading}
      />

      <div>
        <label htmlFor="caption" className="text-sm text-ink">
          Caption (optional, applied to all photos in this batch)
        </label>
        <input
          id="caption"
          name="caption"
          className="mt-1.5 w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500"
          placeholder="e.g. Clubhouse interior"
        />
      </div>

      <SubmitButton disabledExtra={uploading} />
    </form>
  );
}
