import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

const optionalUrl = z
  .string()
  .optional()
  .refine((v) => !v || /^https?:\/\//.test(v), { message: "Must be a full URL starting with http(s)://" });

export const settingsFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  phone: z.string().min(1, "Phone is required."),
  whatsapp: z.string().min(1, "WhatsApp link is required."),
  email: z.string().email("Enter a valid email address."),
  address: z.string().min(1, "Address is required."),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  businessHours: z.string().min(1, "Business hours are required."),
  messengerUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  seoTitle: z.string().min(1, "SEO title is required."),
  seoDescription: z.string().min(1, "SEO description is required."),
  companyDescription: richTextField({ required: "Company description is required.", max: 500 }),
  footerLegalText: richTextField({ required: "Footer text is required.", max: 200 }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export interface SettingsFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof SettingsFormValues, string>>;
  success?: boolean;
}
