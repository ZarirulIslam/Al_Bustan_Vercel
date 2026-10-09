import { z } from "zod";
import { CONTENT_ICON_OPTIONS } from "@/lib/constants";

export const projectSectionItemFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160, "Keep it under 160 characters."),
  description: z.string().trim().max(600, "Keep it under 600 characters.").optional(),
  icon: z.enum(CONTENT_ICON_OPTIONS, { errorMap: () => ({ message: "Choose an icon." }) }).optional(),
  imageUrl: z.string().optional(),
  tab: z.string().max(40).optional(),
});

export type ProjectSectionItemFormValues = z.infer<typeof projectSectionItemFormSchema>;

export interface ProjectSectionItemFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof ProjectSectionItemFormValues, string>>;
  success?: boolean;
}
