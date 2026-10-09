import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

const optionalUrl = z
  .string()
  .optional()
  .refine((v) => !v || /^https?:\/\//.test(v), { message: "Must be a full URL starting with http(s)://" });

// One entry per line (blank lines ignored).
export function linesOf(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const officeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(400),
});

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
  // Footer contact column. Offices arrive as JSON from the office list
  // editor; phones and emails as one per line.
  footerOffices: z
    .string()
    .optional()
    .transform((value, ctx) => {
      try {
        const list = JSON.parse(value || "[]") as unknown[];
        return z.array(officeSchema).max(8).parse(
          (Array.isArray(list) ? list : []).filter(
            (o) => o && typeof o === "object" && (String((o as { name?: string }).name ?? "").trim() || String((o as { address?: string }).address ?? "").trim())
          )
        );
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Each office needs a name and an address." });
        return z.NEVER;
      }
    }),
  footerPhones: z
    .string()
    .optional()
    .transform(linesOf)
    .refine((list) => list.length <= 8, "Up to 8 phone numbers."),
  footerEmails: z
    .string()
    .optional()
    .transform(linesOf)
    .refine((list) => list.every((e) => z.string().email().safeParse(e).success), "Each line must be a valid email address.")
    .refine((list) => list.length <= 8, "Up to 8 email addresses."),
  website: z.string().trim().max(200).optional(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export interface SettingsFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof SettingsFormValues, string>>;
  success?: boolean;
}
