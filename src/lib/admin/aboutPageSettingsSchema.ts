import { z } from "zod";

// Image URLs (heroImageUrl/overviewImageUrl) are deliberately not in
// this schema — same convention as settingsFormSchema's logoUrl: read
// directly from formData in the action and only applied if a new
// upload actually produced a plausible URL, so leaving the file input
// empty keeps the current image.
export const aboutPageSettingsFormSchema = z.object({
  heroEyebrow: z.string().min(1, "Required.").max(60),
  heroHeading: z.string().min(1, "Required.").max(150),
  heroParagraph: z.string().min(1, "Required.").max(600),
  overviewParagraph: z.string().min(1, "Required.").max(1500),
  visionParagraph: z.string().min(1, "Required.").max(600),
  portfolioParagraph: z.string().min(1, "Required.").max(400),
  ctaHeading: z.string().min(1, "Required.").max(150),
});

export type AboutPageSettingsFormValues = z.infer<typeof aboutPageSettingsFormSchema>;

export interface AboutPageSettingsFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof AboutPageSettingsFormValues, string>>;
  success?: boolean;
}
