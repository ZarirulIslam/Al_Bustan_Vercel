import { z } from "zod";
import { CONTENT_ICON_OPTIONS } from "@/lib/constants";

export const contentItemFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(120),
  description: z.string().max(500).optional(),
  icon: z.enum(CONTENT_ICON_OPTIONS),
  tone: z.enum(["garden", "sky", "brass"]),
});

export type ContentItemFormValues = z.infer<typeof contentItemFormSchema>;

export interface ContentItemFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof ContentItemFormValues, string>>;
  success?: boolean;
}
