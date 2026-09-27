import { cn } from "@/lib/utils";
import { toSafeInlineRichHtml, toSafeRichHtml } from "@/lib/richText/server";
import type { LegacyFormat } from "@/lib/richText/shared";

// Server-only renderer for every field edited with RichTextEditor.
// Values are sanitized again here (not just on save) so legacy rows,
// seeds and hand-edited data can never inject markup. Typography comes
// from the `.rich-text` styles in globals.css; size and colour inherit
// from `className`.
export function RichText({
  html,
  legacyFormat = "text",
  className,
}: {
  html: string | null | undefined;
  legacyFormat?: LegacyFormat;
  className?: string;
}) {
  const safe = toSafeRichHtml(html, legacyFormat);
  if (!safe) return null;
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: safe }} />;
}

// Inline variant for one-line rich fields (headings, names, roles):
// only bold/italic/underline/strike survive, rendered straight into the
// given tag so a heading stays a real <h2>.
export function InlineRichText({
  html,
  as: Tag = "span",
  className,
}: {
  html: string | null | undefined;
  as?: "span" | "p" | "h2" | "h3";
  className?: string;
}) {
  const safe = toSafeInlineRichHtml(html);
  if (!safe) return null;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}
