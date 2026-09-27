import { marked } from "marked";

// Rich-text helpers safe to use in both the browser (the admin editor)
// and the server. Rich text is stored as HTML in the same text columns
// that used to hold plain text (or Markdown, for blog posts), so every
// reader must cope with both: `toRichHtml` turns either legacy format
// into HTML. Sanitizing is server-only — see ./server.ts.

export type LegacyFormat = "text" | "markdown";

// Tags the editor produces. Anything stored with one of these is HTML;
// anything else is legacy plain text / Markdown.
const RICH_TAG = /<(p|br|strong|b|em|i|u|s|del|strike|h[1-6]|ul|ol|li|a|blockquote)(\s[^>]*)?\/?>/i;

export function isRichHtml(value: string | null | undefined): boolean {
  return !!value && RICH_TAG.test(value);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Plain text as the site showed it before: blank lines separate
// paragraphs, single line breaks are kept (the old `whitespace-pre-line`).
export function plainTextToHtml(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((para) => para.trim())
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function toRichHtml(value: string | null | undefined, legacy: LegacyFormat = "text"): string {
  if (!value || !value.trim()) return "";
  if (isRichHtml(value)) return value;
  if (legacy === "markdown") return marked.parse(value, { async: false, gfm: true, breaks: false }) as string;
  return plainTextToHtml(value);
}

// An editor with nothing typed in still emits "<p></p>" — treat as empty.
export function isEmptyRichHtml(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;| /g, " ").trim() === "";
}

const PREVIEW_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

// Visible text for short previews in client components (admin lists,
// cards). Only ever render the result as React text, never as HTML —
// the tag stripping here is not a sanitizer.
export function richTextPreview(value: string | null | undefined): string {
  if (!value) return "";
  if (!isRichHtml(value)) return value.replace(/\s+/g, " ").trim();
  return value
    .replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#39|[a-z]+);/gi, (m, name: string) => PREVIEW_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}
