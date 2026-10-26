import { z } from "zod";

// Plot category (PlotGroup) form — name, URL slug and layout grid size.
// The slug is asked for explicitly: names are usually Bangla
// ("৩ কাঠা"), which doesn't make a readable URL.
export const MAX_GRID = 100;

const gridSize = z.coerce
  .number({ invalid_type_error: "Enter a number." })
  .int("Enter a whole number.")
  .min(1, "At least 1.")
  .max(MAX_GRID, `At most ${MAX_GRID}.`);

export const plotGroupFormSchema = z.object({
  name: z.string().trim().min(1, "Required.").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Required.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use English letters, numbers and dashes, e.g. 3-katha."),
  description: z.string().trim().max(300).optional(),
  rows: gridSize,
  columns: gridSize,
});

export type PlotGroupFormValues = z.infer<typeof plotGroupFormSchema>;

export interface PlotGroupFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof PlotGroupFormValues, string>>;
  success?: boolean;
}
