"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavProjectLink, ProjectMenu } from "@/components/layout/Navbar";

const PROJECT_TYPES: { key: keyof ProjectMenu; label: string }[] = [
  { key: "land", label: "Land Projects" },
  { key: "apartments", label: "Apartment Projects" },
];

function Chevron({ className }: { className?: string }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className={className}>
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypeIcon({ type }: { type: keyof ProjectMenu }) {
  return type === "land" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20h18M4 20l5-9 4 6 3-4 4 7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="17" cy="6" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 21V4h10v17M15 9h4v12M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

// Desktop "Projects" menu: one panel with Land and Apartment projects
// side by side. State-driven rather than CSS :hover/:focus-within — a
// client-side navigation leaves the mouse and focus where they were, so
// a CSS-only menu stayed open on the project page after a click. Opens
// on hover or the chevron (touch / keyboard); closes on navigation, a
// click inside or outside, Esc, scrolling, or the mouse leaving.
export function ProjectsMenu({
  label,
  href,
  projectMenu,
  active,
}: {
  label: string;
  href: string;
  projectMenu: ProjectMenu;
  active: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // After a pick or a page change the cursor is usually still over the
  // menu, and the browser fires a fresh mouseenter as the new page
  // renders under it. Ignore hover until the mouse has left once.
  const hoverLocked = useRef(false);
  const types = PROJECT_TYPES.filter((t) => projectMenu[t.key].length > 0);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  const onEnter = () => {
    if (!hoverLocked.current) openNow();
  };
  const onLeave = () => {
    hoverLocked.current = false;
    closeSoon();
  };
  // Short grace period so moving the mouse down into the panel doesn't drop it.
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  const close = () => {
    cancelClose();
    setOpen(false);
    hoverLocked.current = rootRef.current?.matches(":hover") ?? false;
    // Drop focus too, so nothing in the menu stays highlighted on the new page.
    if (document.activeElement instanceof HTMLElement && rootRef.current?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };

  // Close whenever the page changes.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onScroll = () => close();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    <div ref={rootRef} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div
        className={cn(
          "flex items-center rounded-full transition-colors duration-200 ease-estate",
          active
            ? "bg-garden-700 text-white"
            : open
              ? "bg-limestone-200/70 text-garden-700"
              : "text-ink-soft hover:bg-limestone-200/70 hover:text-garden-700"
        )}
      >
        <Link href={href} onClick={close} className="py-2 pl-4 pr-1 text-sm font-medium">
          {label}
        </Link>
        <button
          type="button"
          aria-label={open ? "Hide projects" : "Show projects"}
          aria-expanded={open}
          aria-controls="projects-menu"
          onClick={() => (open ? close() : openNow())}
          className="flex h-9 items-center rounded-full pl-1 pr-3"
        >
          <Chevron className={cn("transition-transform duration-200 ease-estate", open && "rotate-180")} />
        </button>
      </div>

      <div
        id="projects-menu"
        className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200 ease-estate",
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-limestone-300 bg-white shadow-card-hover",
            types.length > 1 ? "w-[36rem]" : "w-[20rem]"
          )}
        >
          <div className={cn("grid gap-2 p-3", types.length > 1 && "grid-cols-2")}>
            {types.map((type) => (
              <TypeColumn
                key={type.key}
                type={type.key}
                label={type.label}
                projects={projectMenu[type.key]}
                pathname={pathname}
                onPick={close}
              />
            ))}
          </div>
          <Link
            href={href}
            onClick={close}
            className="group/all flex items-center justify-between border-t border-limestone-300 bg-limestone-100 px-6 py-3.5 text-sm font-semibold text-garden-700 transition-colors hover:bg-garden-50"
          >
            View all projects
            <span aria-hidden="true" className="transition-transform duration-150 group-hover/all:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TypeColumn({
  type,
  label,
  projects,
  pathname,
  onPick,
}: {
  type: keyof ProjectMenu;
  label: string;
  projects: NavProjectLink[];
  pathname: string;
  onPick: () => void;
}) {
  return (
    <div className="min-w-0 rounded-xl p-1">
      <div className="flex items-center gap-3 px-3 pb-2 pt-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-garden-50 text-garden-700">
          <TypeIcon type={type} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-ink-soft">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <ul className="space-y-0.5">
        {projects.map((project) => {
          const current = pathname === project.href;
          return (
            <li key={project.href}>
              <Link
                href={project.href}
                onClick={onPick}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "group/item flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  current ? "bg-garden-50 text-garden-700" : "text-ink-soft hover:bg-limestone-100 hover:text-garden-700"
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", current ? "bg-garden-500" : "bg-limestone-300")}
                  />
                  <span className="truncate">{project.name}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-garden-600 transition-all duration-150",
                    current ? "opacity-100" : "-translate-x-1 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                  )}
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
