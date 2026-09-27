import { z } from "zod";
import { richTextField } from "@/lib/richText/server";

export const blogFormSchema = z.object({
  title: z.string().min(2, "Title is required."),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  excerpt: z.string().min(1, "Excerpt is required."),
  content: richTextField({ required: "Content is required." }),
  author: z.string().min(1, "Author is required."),
  categoryId: z.string().min(1, "Choose or create a category."),
  newCategoryName: z.string().optional(),
  publishedAt: z.string().min(1, "Publication date is required."),
  published: z.string().optional(),
  seoTitle: z.string().max(70, "Keep it under 70 characters.").optional(),
  metaDescription: z.string().max(160, "Keep it under 160 characters.").optional(),
  canonicalUrl: z.string().max(500).optional(),
  noIndex: z.string().optional(),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;

export interface BlogFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof BlogFormValues, string>>;
}
