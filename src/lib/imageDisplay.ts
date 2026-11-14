// How a slide image sits in its frame — shared by the homepage hero and
// the media sliders (stored per slide as ImageFocus / ImageFit).
// Kept free of server-only imports so client components can use it.

export type ImageFocus = "center" | "top" | "bottom" | "left" | "right";
export type ImageFit = "cover" | "contain";

export const IMAGE_FOCUS_OPTIONS: { value: ImageFocus; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "left", label: "Left" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
];

export function isImageFocus(value: unknown): value is ImageFocus {
  return IMAGE_FOCUS_OPTIONS.some((o) => o.value === value);
}

export function isImageFit(value: unknown): value is ImageFit {
  return value === "cover" || value === "contain";
}

// Full class strings so Tailwind keeps them.
const FOCUS_CLASS: Record<ImageFocus, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

export function focusClass(focus: ImageFocus | null | undefined): string {
  return FOCUS_CLASS[focus ?? "center"] ?? FOCUS_CLASS.center;
}

// Recommended upload sizes shown next to the upload fields in admin.
export const RECOMMENDED_SIZES = {
  hero: {
    size: "1920 × 800 px",
    tip: "Landscape. The hero is wide on computers and nearly square on phones, so keep faces, text and logos near the centre — or switch on \"Show whole image\".",
  },
  mediaSlider: {
    size: "1600 × 900 px (16:9)",
    tip: "Landscape. Phones show a slightly taller 4:3 frame, so keep the important part away from the left and right edges.",
  },
} as const;
