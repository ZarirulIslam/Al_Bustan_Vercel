"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { proseMarkdownComponents } from "@/components/ui/markdownComponents";
import { cn } from "@/lib/utils";

type Selection = { value: string; selStart: number; selEnd: number };

function wrapSelection(value: string, start: number, end: number, before: string, after = before): Selection {
  const selected = value.slice(start, end) || "text";
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  return { value: newValue, selStart: start + before.length, selEnd: start + before.length + selected.length };
}

// Expands the selection to cover whole lines, then prefixes every
// line in it — used for headings/quotes/list items, which are
// line-level Markdown syntax rather than inline wrapping.
function prefixLines(value: string, start: number, end: number, prefix: string): Selection {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const selectedLines = value.slice(lineStart, lineEnd);
  const prefixed = selectedLines
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : prefix + line))
    .join("\n");

  const newValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  return { value: newValue, selStart: lineStart, selEnd: lineStart + prefixed.length };
}

const toolbarButtonClass =
  "rounded px-2.5 py-1 text-sm font-medium text-ink-soft transition-colors duration-150 hover:bg-limestone-200 hover:text-ink";

export function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  required,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function apply(fn: (value: string, start: number, end: number) => Selection) {
    const el = textareaRef.current;
    if (!el) return;
    const { value: newValue, selStart, selEnd } = fn(value, el.selectionStart, el.selectionEnd);
    setValue(newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }

  const buttons: { label: string; title: string; className?: string; onClick: () => void }[] = [
    {
      label: "B",
      title: "Bold",
      className: "font-bold",
      onClick: () => apply((v, s, e) => wrapSelection(v, s, e, "**")),
    },
    {
      label: "I",
      title: "Italic",
      className: "italic",
      onClick: () => apply((v, s, e) => wrapSelection(v, s, e, "*")),
    },
    { label: "H2", title: "Heading", onClick: () => apply((v, s, e) => prefixLines(v, s, e, "## ")) },
    { label: "H3", title: "Subheading", onClick: () => apply((v, s, e) => prefixLines(v, s, e, "### ")) },
    { label: "❝", title: "Quote", onClick: () => apply((v, s, e) => prefixLines(v, s, e, "> ")) },
    { label: "•", title: "Bulleted list", onClick: () => apply((v, s, e) => prefixLines(v, s, e, "- ")) },
    { label: "1.", title: "Numbered list", onClick: () => apply((v, s, e) => prefixLines(v, s, e, "1. ")) },
    { label: "🔗", title: "Link", onClick: () => apply((v, s, e) => wrapSelection(v, s, e, "[", "](https://)")) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t border border-b-0 border-limestone-300 bg-limestone-100 p-1.5">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            title={button.title}
            onClick={button.onClick}
            className={cn(toolbarButtonClass, button.className)}
          >
            {button.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium",
              mode === "write" ? "bg-garden-500 text-white" : "text-ink-soft hover:bg-limestone-200"
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium",
              mode === "preview" ? "bg-garden-500 text-white" : "text-ink-soft hover:bg-limestone-200"
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Always mounted (just visually hidden in preview mode) so its
          `name` is present in the FormData on submit regardless of
          which mode is active when the form is submitted. */}
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        rows={14}
        required={required}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={"Write the article here, using Markdown for formatting.\n\nSeparate paragraphs with a blank line."}
        className={cn(
          "w-full rounded-b border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500",
          mode === "preview" && "hidden"
        )}
      />

      {mode === "preview" && (
        <div className="min-h-[18rem] rounded-b border border-limestone-300 bg-white px-4 py-3">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={proseMarkdownComponents}>
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-ink-soft">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <p className="mt-1.5 text-xs text-ink-soft">
        Markdown supported — use the toolbar, or type it directly (**bold**, *italic*, ## heading, etc.).
      </p>
    </div>
  );
}
