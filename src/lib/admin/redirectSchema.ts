import { z } from "zod";

export const redirectFormSchema = z.object({
  fromPath: z
    .string()
    .min(1, "Required.")
    .max(500)
    .regex(/^\/\S*$/, "Must start with / and contain no spaces (e.g. /old-page)."),
  toPath: z.string().min(1, "Required.").max(2000),
  kind: z.enum(["permanent", "temporary"], {
    errorMap: () => ({ message: "Choose a redirect type." }),
  }),
  enabled: z.string().optional(),
});

export type RedirectFormValues = z.infer<typeof redirectFormSchema>;

export interface RedirectFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof RedirectFormValues, string>>;
}
