import { z } from "zod";

export const paymentPlanFormSchema = z.object({
  name: z.string().min(1, "Plan name is required."),
  bookingAmount: z.string().optional(),
  downPayment: z.string().optional(),
  installmentInfo: z.string().optional(),
  description: z.string().optional(),
});

export type PaymentPlanFormValues = z.infer<typeof paymentPlanFormSchema>;

export interface PaymentPlanFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof PaymentPlanFormValues, string>>;
  success?: boolean;
}
