"use client";

import { useRef } from "react";

// "Read bio" link + modal for a team member card. The bio arrives as
// already-sanitized, server-rendered children (see TeamSection), so
// nothing here touches raw HTML. Native <dialog> gives focus trapping,
// Esc-to-close and a backdrop for free.
export function TeamBioDialog({
  name,
  designation,
  children,
}: {
  name: string;
  designation: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="mt-2 text-sm font-medium text-garden-700 underline-offset-4 transition-colors duration-150 hover:text-garden-500 hover:underline"
      >
        Read bio
      </button>
      <dialog
        ref={ref}
        aria-label={`${name} — bio`}
        // Clicking the backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-xl bg-limestone-100 p-0 text-ink shadow-card-hover backdrop:bg-garden-900/60"
      >
        <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl">{name}</h3>
              <p className="mt-0.5 text-sm text-ink-soft">{designation}</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => ref.current?.close()}
              className="-mr-2 -mt-1 rounded p-2 text-ink-soft transition-colors duration-150 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mt-5 text-[15px] leading-relaxed text-ink-soft">{children}</div>
        </div>
      </dialog>
    </>
  );
}
