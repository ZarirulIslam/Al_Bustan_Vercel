import { z } from "zod";
import { richTextField } from "@/lib/richText/server";
import { youtubeId } from "@/lib/projectSections";

const optionalShort = z.string().max(120, "Keep it under 120 characters.").optional();

export const projectFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  status: z.enum(["ongoing", "completed", "upcoming"], {
    errorMap: () => ({ message: "Choose a status." }),
  }),
  category: z.enum(["land_plot", "flat"], {
    errorMap: () => ({ message: "Choose a project category." }),
  }),
  location: z.string().min(1, "Location is required."),
  shortDescription: z.string().min(1, "Short description is required."),
  // Optional: the Apartment page doesn't show it (Land editor asks for it).
  fullDescription: richTextField(),
  projectType: z.string().min(1, "Project type is required."),
  totalArea: z.string().min(1, "Total area is required."),
  unitInfo: z.string().optional(),
  timeline: z.string().optional(),
  features: richTextField({ max: 3000 }),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  totalUnits: z.string().optional(),
  availableUnits: z.string().optional(),
  sizesOffered: z.string().optional(),
  pricingInfo: richTextField(),
  nearbyFacilities: richTextField({ max: 3000 }),
  bedroomOptions: z.string().optional(),
  floors: optionalShort,
  parkingSpaces: optionalShort,
  lifts: optionalShort,
  stairs: optionalShort,
  tagline: z.string().max(160, "Keep it under 160 characters.").optional(),
  approvalInfo: optionalShort,
  openSpace: optionalShort,
  handoverDate: optionalShort,
  // One YouTube link per line.
  videoUrls: z
    .string()
    .optional()
    .refine(
      (value) => parseVideoUrls(value).every((url) => youtubeId(url) !== null),
      "Each line must be a YouTube link (youtube.com/watch?v=… or youtu.be/…)."
    ),
  block: z.string().optional(),
  facing: z.string().optional(),
  frontRoadWidth: z.string().optional(),
  published: z.string().optional(),
  seoTitle: z.string().max(70, "Keep it under 70 characters.").optional(),
  metaDescription: z.string().max(160, "Keep it under 160 characters.").optional(),
  canonicalUrl: z.string().max(500).optional(),
  noIndex: z.string().optional(),
});

export function parseVideoUrls(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export interface ProjectFormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof ProjectFormValues, string>>;
}
