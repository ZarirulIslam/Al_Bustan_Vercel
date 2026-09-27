import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

export const testimonialFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  designation: z.string().optional(),
  text: richTextField({ required: "Testimonial text is required." }),
  projectId: z.string().optional(),
  published: z.string().optional(),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export interface TestimonialFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof TestimonialFormValues, string>>;
}
