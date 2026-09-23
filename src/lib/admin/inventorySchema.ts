import { z } from "zod";

export const inventoryItemFormSchema = z.object({
  code: z.string().min(1, "Required."),
  status: z.enum(["available", "reserved", "sold"], {
    errorMap: () => ({ message: "Choose a status." }),
  }),
  size: z.string().optional(),
  facing: z.string().optional(),
  price: z.string().optional(),
  block: z.string().optional(),
  roadWidth: z.string().optional(),
  floor: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  parking: z.string().optional(),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;

export interface InventoryItemFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof InventoryItemFormValues, string>>;
  success?: boolean;
}
