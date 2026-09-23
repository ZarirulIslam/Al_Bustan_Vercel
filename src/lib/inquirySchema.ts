import { z } from "zod";

export const inquiryTypeOptions = [
  { value: "general", label: "General Inquiry" },
  { value: "buying", label: "Interested in Buying" },
  { value: "site_visit", label: "Site Visit Request" },
  { value: "pricing", label: "Pricing & Payment Plans" },
  { value: "other", label: "Other" },
] as const;

export const inquiryFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required."),
  email: z.string().email("Enter a valid email address."),
  subject: z.string().min(1, "Subject is required."),
  inquiryType: z.enum(["general", "buying", "site_visit", "pricing", "other"]).default("general"),
  message: z.string().min(1, "Message is required."),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

export interface InquirySubmitState {
  error?: string;
  fieldErrors?: Partial<Record<keyof InquiryFormValues, string>>;
  success?: boolean;
}
