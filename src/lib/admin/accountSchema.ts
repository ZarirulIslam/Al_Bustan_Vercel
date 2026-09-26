import { z } from "zod";
import { isAdminSection } from "@/lib/admin/permissions";

// bcrypt only looks at the first 72 bytes of a password, so anything
// longer would silently be truncated — reject it instead.
export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(80, "Name must be at most 80 characters.");

const roleSchema = z.enum(["super_admin", "admin"], {
  errorMap: () => ({ message: "Choose an access level." }),
});

export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  currentPassword: z.string().min(1, "Enter your current password."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "This reset link is invalid."),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const acceptInviteSchema = z
  .object({
    token: z.string().min(1, "This invitation link is invalid."),
    name: nameSchema,
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// Super Admin → invite a new admin, or edit an existing one. Parse
// with adminUserFormInput(), since `permissions` is a multi-value
// checkbox field that Object.fromEntries() would collapse.
export const adminUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: roleSchema,
    permissions: z.array(z.string()).transform((keys) => [...new Set(keys.filter(isAdminSection))]),
  })
  // A Super Admin has every section implicitly — store none.
  .transform((d) => ({ ...d, permissions: d.role === "super_admin" ? [] : d.permissions }))
  .refine((d) => d.role === "super_admin" || d.permissions.length > 0, {
    message: "Choose at least one section this admin can access.",
    path: ["permissions"],
  });

export function adminUserFormInput(formData: FormData) {
  return {
    ...Object.fromEntries(formData.entries()),
    permissions: formData.getAll("permissions").map(String),
  };
}

export interface AccountFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: string;
}

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
