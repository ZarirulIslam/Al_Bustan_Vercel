import type { Components } from "react-markdown";

// Shared between the admin editor's live preview (TestimonialForm's
// sibling, BlogForm's MarkdownEditor) and the actual public blog post
// page, so what the admin sees while writing matches what visitors
// see exactly — one typography mapping, not two to keep in sync.
export const proseMarkdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h2 className="mb-3 mt-8 font-display text-2xl text-ink first:mt-0" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h3 className="mb-3 mt-8 font-display text-xl text-ink first:mt-0" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h4 className="mb-2 mt-6 font-display text-lg text-ink first:mt-0" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mb-5 text-lg text-ink-soft last:mb-0" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
  em: ({ node, ...props }) => <em {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="text-garden-700 underline underline-offset-2 hover:text-garden-600"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ node, ...props }) => (
    <ul className="mb-5 ml-5 list-disc space-y-1.5 text-lg text-ink-soft" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="mb-5 ml-5 list-decimal space-y-1.5 text-lg text-ink-soft" {...props} />
  ),
  li: ({ node, ...props }) => <li {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="mb-5 border-l-4 border-garden-300 pl-4 text-lg italic text-ink-soft"
      {...props}
    />
  ),
  hr: ({ node, ...props }) => <hr className="my-8 border-limestone-300" {...props} />,
  code: ({ node, ...props }) => (
    <code className="rounded bg-limestone-200 px-1.5 py-0.5 text-[0.9em] text-ink" {...props} />
  ),
};
