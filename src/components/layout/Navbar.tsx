"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/constants";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ProjectsMenu } from "@/components/layout/ProjectsMenu";
import type { SiteSettings } from "@/lib/types";

export interface NavProjectLink {
  name: string;
  href: string;
}

// Land and Apartment projects listed separately under "Projects":
// hovering (or focusing) a type opens a flyout with its projects.
export interface ProjectMenu {
  land: NavProjectLink[];
  apartments: NavProjectLink[];
}

const PROJECT_TYPES: { key: keyof ProjectMenu; label: string }[] = [
  { key: "land", label: "Land Project" },
  { key: "apartments", label: "Apartment Project" },
];

function Chevron({ className }: { className?: string }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className={className}>
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Navbar({
  settings,
  projectMenu,
  hasBlogPosts = true,
}: {
  settings: SiteSettings;
  projectMenu: ProjectMenu;
  hasBlogPosts?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  // No "Blog" link until the first article is published; project types
  // without a published project are left out of the menu.
  const nav = primaryNav.filter((item) => item.label !== "Blog" || hasBlogPosts);
  const projectTypes = PROJECT_TYPES.filter((type) => projectMenu[type.key].length > 0);
  const isProjects = (href: string) => href === "/projects" && projectTypes.length > 0;
  const projectHrefs = [...projectMenu.land, ...projectMenu.apartments].map((p) => p.href);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);

      // Hide when scrolling down past the header's own height; reveal
      // again as soon as the user scrolls up, so navigation is never
      // more than a small upward scroll away.
      if (y > lastY && y > 96) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastY = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileProjectsOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-limestone-300 bg-limestone-100/95 backdrop-blur transition-transform duration-300 ease-estate",
        scrolled && "shadow-sm",
        hidden && !mobileOpen ? "-translate-y-full" : "translate-y-0"
      )}
    >
      {/* Slim signature accent — deep green into antique gold, the
          palette's two brand hues in one hairline. */}
      <div
        aria-hidden="true"
        className="h-[3px] w-full bg-gradient-to-r from-garden-700 via-garden-500 to-brass"
      />
      <Container>
        <div className="flex h-20 items-center justify-between gap-4 lg:h-24">
          <Link
            href="/"
            className={cn(
              "shrink-0",

              !settings.logoUrl &&
                "font-display text-xl tracking-tight text-garden-700"
            )}
          >
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={settings.companyName}
                className="h-14 w-auto max-w-[60vw] object-contain lg:h-20"
              />
            ) : (
              settings.companyName
            )}
          </Link>

          {/* Desktop nav — a pill-shaped bar with the active item as a
              solid dark-green segment inside it, rather than plain
              inline links. */}
          <nav className="hidden items-center gap-1 rounded-full border border-limestone-300 bg-white/70 p-1.5 backdrop-blur lg:flex">
            {nav.map((item) =>
              isProjects(item.href) ? (
                <ProjectsMenu
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  projectMenu={projectMenu}
                  active={isActive(item.href) || projectHrefs.includes(pathname)}
                />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                    isActive(item.href)
                      ? "bg-garden-700 text-white"
                      : "text-ink-soft hover:bg-limestone-200/70 hover:text-garden-700"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden lg:block">
            <Button href="/contact" variant="accent" size="md" className="rounded-full">
              Get in Touch
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink lg:hidden"
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
              {mobileOpen ? (
                <path
                  d="M1 1L21 15M21 1L1 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path d="M0 1H22" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M0 8H22" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M0 15H22" stroke="currentColor" strokeWidth="1.6" />
                </>
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-y-auto overscroll-contain border-t border-limestone-300 bg-limestone-100 transition-[max-height] duration-300 ease-estate lg:hidden",
          mobileOpen ? "max-h-[calc(100dvh-5rem)]" : "max-h-0 border-t-0"
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {nav.map((item) =>
            isProjects(item.href) ? (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setMobileProjectsOpen((v) => !v)}
                  aria-expanded={mobileProjectsOpen}
                  className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-base font-medium text-ink"
                >
                  {item.label}
                  <Chevron className={cn("transition-transform duration-200 ease-estate", mobileProjectsOpen && "rotate-180")} />
                </button>
                {mobileProjectsOpen && (
                  <div className="space-y-3 pb-2 pl-4">
                    {projectTypes.map((type) => (
                      <div key={type.key}>
                        <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-garden-700">
                          {type.label}
                        </p>
                        {projectMenu[type.key].map((project) => (
                          <Link
                            key={project.href}
                            href={project.href}
                            className={cn(
                              "block rounded-md px-3 py-2.5 text-sm",
                              pathname === project.href ? "bg-garden-100 text-garden-700" : "text-ink-soft"
                            )}
                          >
                            {project.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-3 text-base font-medium",
                  isActive(item.href) ? "bg-garden-100 text-garden-700" : "text-ink"
                )}
              >
                {item.label}
              </Link>
            )
          )}
          <Button href="/contact" variant="accent" size="md" className="mt-3 rounded-full">
            Get in Touch
          </Button>
        </Container>
      </div>
    </header>
  );
}
