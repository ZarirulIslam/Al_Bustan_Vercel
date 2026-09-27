import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { isEmptyRichHtml, toRichHtml, type LegacyFormat } from "@/lib/richText/shared";

// Server-side rich text: the allow-list every stored/rendered rich field
// goes through, and plain-text conversion for places that can't take
// HTML (meta descriptions, length limits).

const ALIGN = [/^(left|right|center|justify)$/];

// What the editor can produce, plus a few tags older Markdown blog posts
// may contain (images, code, rules, tables) so they keep displaying.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "del", "strike",
    "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote",
    "hr", "code", "pre", "img", "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    // A numbered list continued after other content (e.g. starting at 4).
    ol: ["start"],
    img: ["src", "alt", "title"],
    "*": ["style"],
  },
  allowedStyles: { "*": { "text-align": ALIGN } },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  // Headings are demoted/clamped so a field can never inject a second
  // <h1> into a page (the page title owns h1).
  transformTags: {
    h1: "h2",
    h5: "h4",
    h6: "h4",
    ol: (tagName, attribs) => {
      const start = attribs.start ?? "";
      const kept: sanitizeHtml.Attributes = /^\d{1,4}$/.test(start) && start !== "1" ? { start } : {};
      return { tagName, attribs: kept };
    },
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? "");
      return {
        tagName,
        attribs: {
          ...(attribs.href ? { href: attribs.href } : {}),
          ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
        },
      };
    },
  },
};

export function sanitizeRichHtml(html: string): string {
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS).trim();
  return isEmptyRichHtml(clean) ? "" : clean;
}

// For rendering: legacy plain text / Markdown → HTML, then sanitized.
export function toSafeRichHtml(value: string | null | undefined, legacy: LegacyFormat = "text"): string {
  return sanitizeRichHtml(toRichHtml(value, legacy));
}

// For short one-line fields (headings, names) rendered inside an
// existing <h2>/<p>: keeps only inline formatting, and turns paragraph
// breaks into <br> so nothing block-level ends up inside the heading.
const INLINE_BLOCK_BREAK = /<\/(p|h[1-6]|li|blockquote)>\s*<(p|h[1-6]|li|blockquote)(\s[^>]*)?>/gi;
const EDGE_BREAKS = /^(\s*<br\s*\/?>)+|(<br\s*\/?>\s*)+$/gi;

export function toSafeInlineRichHtml(value: string | null | undefined, legacy: LegacyFormat = "text"): string {
  const html = toRichHtml(value, legacy).replace(INLINE_BLOCK_BREAK, "<br>");
  const clean = sanitizeHtml(html, {
    allowedTags: ["strong", "b", "em", "i", "u", "s", "del", "strike", "br"],
    allowedAttributes: {},
  })
    .trim()
    .replace(EDGE_BREAKS, "");
  return isEmptyRichHtml(clean) ? "" : clean;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

// Visible text only — for <meta> descriptions, length limits, search.
export function richHtmlToPlainText(value: string | null | undefined, legacy: LegacyFormat = "text"): string {
  if (!value) return "";
  const html = toRichHtml(value, legacy).replace(/<\/(p|h[2-4]|li|blockquote)>|<br\s*\/?>/gi, "$& ");
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(#39|[a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

// Zod field for a rich text input: sanitizes the submitted HTML, and
// applies required/max rules to the *visible* text (so markup doesn't
// count against a character limit).
export function richTextField(opts: { required?: string; max?: number; maxMessage?: string } = {}) {
  return z
    .string()
    .optional()
    .transform((value) => sanitizeRichHtml(value ?? ""))
    .superRefine((html, ctx) => {
      const text = richHtmlToPlainText(html);
      if (opts.required && !text) ctx.addIssue({ code: z.ZodIssueCode.custom, message: opts.required });
      if (opts.max && text.length > opts.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: opts.maxMessage ?? `Must be ${opts.max} characters or fewer.`,
        });
      }
    });
}
