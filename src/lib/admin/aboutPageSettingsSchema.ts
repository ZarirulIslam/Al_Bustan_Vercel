import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

// Image URLs (heroImageUrl/overviewImageUrl) are deliberately not in
// this schema — same convention as settingsFormSchema's logoUrl: read
// directly from formData in the action and only applied if a new
// upload actually produced a plausible URL, so leaving the file input
// empty keeps the current image.
export const aboutPageSettingsFormSchema = z.object({
  heroEyebrow: z.string().min(1, "Required.").max(60),
  heroHeading: z.string().min(1, "Required.").max(150),
  heroParagraph: z.string().min(1, "Required.").max(600),
  overviewParagraph: richTextField({ required: "Required.", max: 1500 }),
  visionParagraph: richTextField({ required: "Required.", max: 600 }),
  portfolioParagraph: richTextField({ required: "Required.", max: 400 }),
  ctaHeading: z.string().min(1, "Required.").max(150),
  // Checkbox: "on" or absent — interpreted as `=== "on"` in the action.
  teamSectionEnabled: z.string().optional(),
  // Leadership message — all rich text; the section is simply hidden
  // while the message is empty, so none are required.
  leaderSectionEnabled: z.string().optional(),
  leaderHeading: richTextField({ max: 80 }),
  leaderMessage: richTextField({ max: 4000 }),
  leaderName: richTextField({ max: 100 }),
  leaderRole: richTextField({ max: 150 }),
});

export type AboutPageSettingsFormValues = z.infer<typeof aboutPageSettingsFormSchema>;

export interface AboutPageSettingsFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof AboutPageSettingsFormValues, string>>;
  success?: boolean;
}
