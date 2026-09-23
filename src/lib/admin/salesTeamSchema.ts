import { z } from "zod";

export const salesEmployeeFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required."),
  email: z.string().email("Enter a valid email address."),
  designation: z.string().min(1, "Designation is required."),
  active: z.string().optional(),
});

export type SalesEmployeeFormValues = z.infer<typeof salesEmployeeFormSchema>;

export interface SalesEmployeeFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof SalesEmployeeFormValues, string>>;
}
