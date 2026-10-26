import { z } from "zod";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

// Optional whole-number field (also used for layout row/column).
// Accepts Bangla digits too (e.g. "১২"), since admins often type in
// Bangla.
const optionalCount = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim().replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))))
  .refine((v) => v === "" || /^\d{1,4}$/.test(v), "Enter a whole number.")
  .transform((v) => (v === "" ? null : Number(v)));

export const inventoryItemFormSchema = z
  .object({
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
    clientName: z.string().max(120).optional(),
    fileNumber: z.string().max(60).optional(),
    paymentMode: z
      .enum(["", "one_time", "installment"])
      .optional()
      .transform((v) => (v ? v : null)),
    totalInstallments: optionalCount,
    remainingInstallments: optionalCount,
    // Layout placement — category (PlotGroup) plus 1-based row/column.
    groupId: z.string().optional(),
    gridRow: optionalCount,
    gridCol: optionalCount,
  })
  .superRefine((data, ctx) => {
    if (data.groupId) {
      for (const key of ["gridRow", "gridCol"] as const) {
        if (!data[key]) ctx.addIssue({ code: "custom", path: [key], message: "Required to place the plot on the layout." });
      }
    }
    if (data.paymentMode !== "installment") return;
    if (data.remainingInstallments === null) {
      ctx.addIssue({ code: "custom", path: ["remainingInstallments"], message: "Required for installment payments." });
    }
    if (
      data.totalInstallments !== null &&
      data.remainingInstallments !== null &&
      data.remainingInstallments > data.totalInstallments
    ) {
      ctx.addIssue({ code: "custom", path: ["remainingInstallments"], message: "Can't be more than the total." });
    }
  });

export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;

export interface InventoryItemFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof InventoryItemFormValues, string>>;
  success?: boolean;
}

// Prisma data for the parsed form — shared by create and update.
// Installment counts are cleared unless the payment mode is installment,
// and the row/column unless the plot is in a category.
export function inventoryItemData(data: InventoryItemFormValues) {
  const installment = data.paymentMode === "installment";
  const placed = Boolean(data.groupId);
  return {
    code: data.code,
    status: data.status,
    size: data.size || null,
    facing: data.facing || null,
    price: data.price || null,
    block: data.block || null,
    roadWidth: data.roadWidth || null,
    floor: data.floor || null,
    bedrooms: data.bedrooms || null,
    bathrooms: data.bathrooms || null,
    parking: data.parking || null,
    clientName: data.clientName?.trim() || null,
    fileNumber: data.fileNumber?.trim() || null,
    paymentMode: data.paymentMode,
    totalInstallments: installment ? data.totalInstallments : null,
    remainingInstallments: installment ? data.remainingInstallments : null,
    groupId: placed ? data.groupId! : null,
    gridRow: placed ? data.gridRow : null,
    gridCol: placed ? data.gridCol : null,
  };
}
