import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

// photoUrl is deliberately not here — same convention as the
// testimonial form: read directly from formData in the action so an
// empty file input keeps the current photo.
export const teamMemberFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  designation: z.string().min(1, "Designation is required.").max(100),
  shortTitle: richTextField({ max: 200 }),
  bio: richTextField({ max: 3000 }),
  published: z.string().optional(),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

export interface TeamMemberFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof TeamMemberFormValues, string>>;
}
