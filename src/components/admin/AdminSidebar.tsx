"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type IconName =
  | "dashboard"
  | "homepage"
  | "hero"
  | "projects"
  | "blog"
  | "gallery"
  | "testimonials"
  | "about"
  | "faqs"
  | "inquiries"
  | "salesTeam"
  | "redirects"
  | "activityLogs"
  | "settings";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

// Grouped under small section labels (Content / Sales / System) so the
// 11-item list scans the way the reference dashboards' sidebars do,
// rather than as one flat stack.
const navGroups: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }] },
  {
    label: "Content",
    items: [
      { label: "Homepage", href: "/admin/homepage", icon: "homepage" },
      { label: "Homepage Hero", href: "/admin/hero", icon: "hero" },
      { label: "About Page", href: "/admin/about", icon: "about" },
      { label: "Projects", href: "/admin/projects", icon: "projects" },
      { label: "Blog", href: "/admin/blog", icon: "blog" },
      { label: "Gallery", href: "/admin/gallery", icon: "gallery" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "testimonials" },
      { label: "FAQs", href: "/admin/faqs", icon: "faqs" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Leads & Inquiries", href: "/admin/inquiries", icon: "inquiries" },
      { label: "Sales Team", href: "/admin/sales-team", icon: "salesTeam" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "SEO Redirects", href: "/admin/redirects", icon: "redirects" },
      { label: "Activity Logs", href: "/admin/activity-logs", icon: "activityLogs" },
      { label: "Website Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "homepage":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9.5 20v-6h5v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "hero":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 15l4.5-4.5a1.5 1.5 0 0 1 2.1 0L13 14l2-2a1.5 1.5 0 0 1 2.1 0L21 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="8" cy="9" r="1.4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <path d="M3 20V10l9-6 9 6v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 20v-7h6v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "blog":
      return (
        <svg {...common}>
          <path d="M5 4h11l3 3v13H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 10h6M9 13.5h6M9 17h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "gallery":
      return (
        <svg {...common}>
          <rect x="3" y="3.5" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8.5" cy="8.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 15.5l4-4 3 3 3.5-3.5 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "inquiries":
      return (
        <svg {...common}>
          <path d="M4 5.5h16v10a1 1 0 0 1-1 1H9l-4 3.5v-3.5H5a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 9.5h8M8 12.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "testimonials":
      return (
        <svg {...common}>
          <path
            d="M7.5 6h-2A2.5 2.5 0 0 0 3 8.5v2A2.5 2.5 0 0 0 5.5 13H7v2.5L4 18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 6h-2A2.5 2.5 0 0 0 14 8.5v2a2.5 2.5 0 0 0 2.5 2.5H18v2.5l-3 2.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "faqs":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M9.5 9.3a2.5 2.5 0 1 1 3.3 2.36c-.6.22-.8.6-.8 1.14v.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "salesTeam":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M16 8.5a2.6 2.6 0 1 0 0-5.2M15 13.2c2.4.4 4.4 1.9 5 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "redirects":
      return (
        <svg {...common}>
          <path
            d="M4 6h9a5 5 0 0 1 5 5v1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m14.5 8.5 3.5-3.5-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M20 18H11a5 5 0 0 1-5-5v-1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m9.5 20.5-3.5-3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "activityLogs":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 3.5v2.2M12 18.3v2.2M4.6 7l1.9 1.1M17.5 15.9l1.9 1.1M4.6 17l1.9-1.1M17.5 8.1l1.9-1.1M3.5 12h2.2M18.3 12h2.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on every navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const initial = session?.user?.email?.[0]?.toUpperCase() ?? "A";

  const navList = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {navGroups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`}>
          {group.label && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft/60">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-estate",
                    active
                      ? "bg-garden-700 text-white shadow-card"
                      : "text-ink-soft hover:bg-limestone-200 hover:text-ink"
                  )}
                >
                  <span className={cn(active ? "text-brass-light" : "text-garden-500")}>
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-3 border-t border-limestone-300 px-4 py-4">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-soft transition-colors duration-200 ease-estate hover:bg-limestone-200 hover:text-garden-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14 4h6v6M20 4 10 14M6 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        View Website
      </Link>
      <div className="flex items-center gap-3 rounded-xl bg-limestone-200/60 px-3 py-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-garden-700 text-sm font-semibold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{session?.user?.email}</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-xs font-medium text-garden-700 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-limestone-300 bg-white px-4 py-3 md:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-garden-700 font-display text-sm text-white">
            AB
          </span>
          <span className="font-display text-lg text-garden-700">Al Bustan</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-limestone-300 text-ink-soft"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-card-hover transition-transform duration-300 ease-estate",
          "md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:flex-shrink-0 md:translate-x-0 md:border-r md:border-limestone-300 md:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-limestone-300 px-6 py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-garden-700 font-display text-base text-white">
              AB
            </span>
            <span>
              <p className="font-display text-lg leading-tight text-garden-700">Al Bustan</p>
              <p className="text-xs text-ink-soft">Admin Dashboard</p>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-limestone-200 md:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {navList}
        {footer}
      </aside>
    </>
  );
}
