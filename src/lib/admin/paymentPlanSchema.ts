import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

export const paymentPlanFormSchema = z.object({
  name: z.string().min(1, "Plan name is required."),
  bookingAmount: z.string().optional(),
  downPayment: z.string().optional(),
  installmentInfo: richTextField(),
  description: richTextField(),
});

export type PaymentPlanFormValues = z.infer<typeof paymentPlanFormSchema>;

export interface PaymentPlanFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof PaymentPlanFormValues, string>>;
  success?: boolean;
}
