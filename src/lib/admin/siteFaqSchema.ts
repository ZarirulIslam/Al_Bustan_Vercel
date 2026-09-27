import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

export const siteFaqFormSchema = z.object({
  question: z.string().min(1, "Question is required."),
  answer: richTextField({ required: "Answer is required." }),
});

export type SiteFaqFormValues = z.infer<typeof siteFaqFormSchema>;

export interface SiteFaqFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof SiteFaqFormValues, string>>;
  success?: boolean;
}
