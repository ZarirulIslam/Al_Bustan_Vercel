"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";
import { isEmptyRichHtml, toRichHtml, type LegacyFormat } from "@/lib/richText/shared";

// The one rich text editor used for every formatted content field in
// the CMS. It submits HTML through a hidden input named `name`, so it
// drops into the existing server-action forms like a <textarea>; the
// server sanitizes it (src/lib/richText/server.ts). Existing plain-text
// (or, for blog posts, Markdown) values are converted on load.

// --- toolbar icons (1.6 stroke, matching the dashboard set) -------------

const P = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const icons = {
  bold: <path {...P} d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />,
  italic: <path {...P} d="M10 5h8M6 19h8M14 5l-4 14" />,
  underline: <path {...P} d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" />,
  strike: <path {...P} d="M5 12h14M16.5 7.5C16 5.8 14.3 5 12 5c-2.6 0-4.5 1.2-4.5 3.2M7.5 16.5C8 18.2 9.7 19 12 19c2.8 0 4.5-1.3 4.5-3.3" />,
  bulletList: <path {...P} d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  orderedList: <path {...P} d="M10 6.5h10M10 12h10M10 17.5h10M4 5l1.5-1v5M3.8 13.5a1.4 1.4 0 1 1 2.2 1.2L4 16.5h2.5" />,
  indent: <path {...P} d="M11 6.5h9M11 12h9M11 17.5h9M4 8.5l3.5 3.5L4 15.5" />,
  outdent: <path {...P} d="M11 6.5h9M11 12h9M11 17.5h9M7.5 8.5 4 12l3.5 3.5" />,
  blockquote: <path {...P} d="M6 7h4v4H7.5c0 2 .8 3 2.5 3.5M14 7h4v4h-2.5c0 2 .8 3 2.5 3.5" />,
  link: <path {...P} d="M10 14a4 4 0 0 0 6 .4l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.1 1.1M14 10a4 4 0 0 0-6-.4l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.1-1.1" />,
  alignLeft: <path {...P} d="M4 6h16M4 10h10M4 14h16M4 18h10" />,
  alignCenter: <path {...P} d="M4 6h16M7 10h10M4 14h16M7 18h10" />,
  alignRight: <path {...P} d="M4 6h16M10 10h10M4 14h16M10 18h10" />,
  alignJustify: <path {...P} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
  undo: <path {...P} d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  redo: <path {...P} d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />,
  clear: <path {...P} d="M6 5h12M12 5l-3 14M4 20l16-16M14.5 12.5 16 19" />,
};

function ToolButton({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: keyof typeof icons;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection: don't let the button steal focus first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors duration-150",
        active ? "bg-garden-700 text-white" : "text-ink-soft hover:bg-limestone-200 hover:text-ink",
        "disabled:pointer-events-none disabled:opacity-35"
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {icons[icon]}
      </svg>
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px flex-shrink-0 bg-limestone-300" aria-hidden="true" />;
}

type BlockType = "paragraph" | "h2" | "h3" | "h4";

function currentBlock(editor: Editor): BlockType {
  for (const level of [2, 3, 4] as const) {
    if (editor.isActive("heading", { level })) return `h${level}`;
  }
  return "paragraph";
}

// --- link panel ------------------------------------------------------------

function normalizeHref(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  return `https://${value}`;
}

function LinkPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const existing = (editor.getAttributes("link").href as string | undefined) ?? "";
  const [href, setHref] = useState(existing);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  function apply() {
    const url = normalizeHref(href);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: url }).run();
    onClose();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-limestone-300 bg-white px-3 py-2">
      <label htmlFor={`${editor.instanceId}-link`} className="text-xs font-medium text-ink-soft">
        Link
      </label>
      <input
        ref={inputRef}
        id={`${editor.instanceId}-link`}
        type="text"
        inputMode="url"
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
            editor.commands.focus();
          }
        }}
        placeholder="https://example.com, /contact or name@email.com"
        className="min-w-0 flex-1 rounded border border-limestone-300 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-garden-500"
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={apply}
          className="rounded bg-garden-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-garden-600"
        >
          {existing ? "Update" : "Add link"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onClose();
            }}
            className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onClose();
            editor.commands.focus();
          }}
          className="rounded px-2 py-1.5 text-xs font-medium text-ink-soft hover:bg-limestone-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- editor ----------------------------------------------------------------

function plainLength(editor: Editor | null): number {
  return editor ? editor.getText().replace(/\s+/g, " ").trim().length : 0;
}

export function RichTextEditor({
  id,
  name,
  defaultValue,
  legacyFormat = "text",
  size = "md",
  maxLength,
  placeholder,
  invalid = false,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  // How an existing value that isn't HTML yet should be read.
  legacyFormat?: LegacyFormat;
  // Height of the writing area: "sm" for a sentence or two, "lg" for articles.
  size?: "sm" | "md" | "lg";
  // Shown as a live counter of *visible* characters (server enforces it).
  maxLength?: number;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [html, setHtml] = useState(() => toRichHtml(defaultValue, legacyFormat));
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: html,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class: cn(
          "rich-text rich-text-editor px-4 py-3 text-sm text-ink outline-none",
          size === "sm" && "min-h-[96px]",
          size === "md" && "min-h-[160px]",
          size === "lg" && "min-h-[360px]"
        ),
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  const count = plainLength(editor);
  const over = maxLength !== undefined && count > maxLength;
  const block = editor ? currentBlock(editor) : "paragraph";

  return (
    <div
      className={cn(
        "overflow-hidden rounded border bg-white transition-colors focus-within:border-garden-500",
        invalid || over ? "border-red-400" : "border-limestone-300"
      )}
    >
      <input type="hidden" name={name} value={isEmptyRichHtml(html) ? "" : html} />

      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-limestone-300 bg-limestone-100 px-1.5 py-1"
      >
        <select
          aria-label="Text style"
          value={block}
          disabled={!editor}
          onChange={(e) => {
            const value = e.target.value as BlockType;
            const chain = editor!.chain().focus();
            if (value === "paragraph") chain.setParagraph().run();
            else chain.setHeading({ level: Number(value[1]) as 2 | 3 | 4 }).run();
          }}
          className="mr-0.5 h-8 rounded-md border border-limestone-300 bg-white px-2 text-xs font-medium text-ink outline-none focus:border-garden-500"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <Divider />
        <ToolButton label="Bold (Ctrl+B)" icon="bold" active={!!editor?.isActive("bold")} disabled={!editor} onClick={() => editor!.chain().focus().toggleBold().run()} />
        <ToolButton label="Italic (Ctrl+I)" icon="italic" active={!!editor?.isActive("italic")} disabled={!editor} onClick={() => editor!.chain().focus().toggleItalic().run()} />
        <ToolButton label="Underline (Ctrl+U)" icon="underline" active={!!editor?.isActive("underline")} disabled={!editor} onClick={() => editor!.chain().focus().toggleUnderline().run()} />
        <ToolButton label="Strikethrough" icon="strike" active={!!editor?.isActive("strike")} disabled={!editor} onClick={() => editor!.chain().focus().toggleStrike().run()} />

        <Divider />
        <ToolButton label="Bulleted list" icon="bulletList" active={!!editor?.isActive("bulletList")} disabled={!editor} onClick={() => editor!.chain().focus().toggleBulletList().run()} />
        <ToolButton label="Numbered list" icon="orderedList" active={!!editor?.isActive("orderedList")} disabled={!editor} onClick={() => editor!.chain().focus().toggleOrderedList().run()} />
        {/* Nested / sub-lists: indent makes the item a sub-item of the one
            above (Tab), outdent moves it back up a level (Shift+Tab). Inside
            a sub-list, the list buttons switch just that level between
            bullets and numbers, so levels can be mixed. */}
        <ToolButton label="Indent list item (Tab)" icon="indent" disabled={!editor?.can().sinkListItem("listItem")} onClick={() => editor!.chain().focus().sinkListItem("listItem").run()} />
        <ToolButton label="Outdent list item (Shift+Tab)" icon="outdent" disabled={!editor?.can().liftListItem("listItem")} onClick={() => editor!.chain().focus().liftListItem("listItem").run()} />
        <ToolButton label="Quote" icon="blockquote" active={!!editor?.isActive("blockquote")} disabled={!editor} onClick={() => editor!.chain().focus().toggleBlockquote().run()} />
        <ToolButton label={editor?.isActive("link") ? "Edit link" : "Add link"} icon="link" active={linkOpen || !!editor?.isActive("link")} disabled={!editor} onClick={() => setLinkOpen((v) => !v)} />

        <Divider />
        <ToolButton label="Align left" icon="alignLeft" active={!!editor?.isActive({ textAlign: "left" })} disabled={!editor} onClick={() => editor!.chain().focus().setTextAlign("left").run()} />
        <ToolButton label="Align center" icon="alignCenter" active={!!editor?.isActive({ textAlign: "center" })} disabled={!editor} onClick={() => editor!.chain().focus().setTextAlign("center").run()} />
        <ToolButton label="Align right" icon="alignRight" active={!!editor?.isActive({ textAlign: "right" })} disabled={!editor} onClick={() => editor!.chain().focus().setTextAlign("right").run()} />
        <ToolButton label="Justify" icon="alignJustify" active={!!editor?.isActive({ textAlign: "justify" })} disabled={!editor} onClick={() => editor!.chain().focus().setTextAlign("justify").run()} />

        <Divider />
        <ToolButton label="Undo (Ctrl+Z)" icon="undo" disabled={!editor?.can().undo()} onClick={() => editor!.chain().focus().undo().run()} />
        <ToolButton label="Redo (Ctrl+Shift+Z)" icon="redo" disabled={!editor?.can().redo()} onClick={() => editor!.chain().focus().redo().run()} />
        <ToolButton label="Clear formatting" icon="clear" disabled={!editor} onClick={() => editor!.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run()} />
      </div>

      {linkOpen && editor && <LinkPanel editor={editor} onClose={() => setLinkOpen(false)} />}

      <EditorContent editor={editor} />
      {!editor && (
        <div
          className={cn(
            "rich-text px-4 py-3 text-sm text-ink",
            size === "sm" && "min-h-[96px]",
            size === "md" && "min-h-[160px]",
            size === "lg" && "min-h-[360px]"
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {maxLength !== undefined && (
        <p className={cn("border-t border-limestone-300 px-3 py-1.5 text-right text-xs", over ? "text-red-700" : "text-ink-soft")}>
          {count} / {maxLength}
        </p>
      )}
    </div>
  );
}
