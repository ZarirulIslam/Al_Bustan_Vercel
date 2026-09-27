import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

// A hero button's link may point within the site ("/projects") or,
// less commonly, to an external page — but never to a "javascript:"
// or other script-bearing scheme, since this value is used directly
// as a Button href.
const heroButtonUrl = z
  .string()
  .min(1, "Link is required.")
  .max(500)
  .refine((v) => /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/.test(v), {
    message: "Must start with / (internal page), or be a full https://, mailto: or tel: link.",
  });

// Checkbox fields arrive as "on" or are absent from the FormData
// entirely — kept as optional strings here (not z.boolean()) and
// interpreted as `=== "on"` in the action, same convention as
// `published`/`featured` on the project form.
export const homepageSettingsFormSchema = z.object({
  heroTextEnabled: z.string().optional(),
  heroEyebrow: z.string().min(1, "Required.").max(100),
  heroHeadline: z.string().min(1, "Required.").max(150),
  heroDescription: z.string().min(1, "Required.").max(500),
  heroPrimaryButtonEnabled: z.string().optional(),
  heroPrimaryButtonLabel: z.string().min(1, "Required.").max(60),
  heroPrimaryButtonUrl: heroButtonUrl,
  heroSecondaryButtonEnabled: z.string().optional(),
  heroSecondaryButtonLabel: z.string().min(1, "Required.").max(60),
  heroSecondaryButtonUrl: heroButtonUrl,
  statsSectionEnabled: z.string().optional(),
  ongoingStatLabel: z.string().min(1, "Label is required.").max(40, "Keep it short."),
  ongoingStatEnabled: z.string().optional(),
  completedStatLabel: z.string().min(1, "Label is required.").max(40, "Keep it short."),
  completedStatEnabled: z.string().optional(),
  upcomingStatLabel: z.string().min(1, "Label is required.").max(40, "Keep it short."),
  upcomingStatEnabled: z.string().optional(),
  introSectionEnabled: z.string().optional(),
  whatWeDevelopSectionEnabled: z.string().optional(),
  featuredProjectsSectionEnabled: z.string().optional(),
  valuePropsSectionEnabled: z.string().optional(),
  testimonialsSectionEnabled: z.string().optional(),
  teamSectionEnabled: z.string().optional(),
  ctaSectionEnabled: z.string().optional(),
  blogSectionEnabled: z.string().optional(),
  // introImageUrl is deliberately not here — same convention as
  // settingsFormSchema's logoUrl, read directly from formData in the
  // action so an empty file input keeps the current image.
  introHeading: z.string().min(1, "Required.").max(150),
  introBody: richTextField({ required: "Required.", max: 800 }),
});

export type HomepageSettingsFormValues = z.infer<typeof homepageSettingsFormSchema>;

export interface HomepageSettingsFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof HomepageSettingsFormValues, string>>;
  success?: boolean;
}
