import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

export const projectFaqFormSchema = z.object({
  question: z.string().min(1, "Question is required."),
  answer: richTextField({ required: "Answer is required." }),
});

export type ProjectFaqFormValues = z.infer<typeof projectFaqFormSchema>;

export interface ProjectFaqFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof ProjectFaqFormValues, string>>;
  success?: boolean;
}
