import Link from "next/link";
import { primaryNav } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import { Container } from "@/components/ui/Container";

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-garden-900 text-limestone-200/80">
      <Container className="grid grid-cols-1 gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-lg text-white">
            {settings.companyName}
          </p>
          <p className="mt-3 max-w-[38ch] text-sm text-limestone-200/70">
            {settings.companyDescription}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-brass-light">Navigate</p>
          <ul className="mt-4 space-y-2.5">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-brass-light">Projects</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/projects/ongoing" className="text-sm transition-colors hover:text-white">
                Ongoing
              </Link>
            </li>
            <li>
              <Link href="/projects/completed" className="text-sm transition-colors hover:text-white">
                Completed
              </Link>
            </li>
            <li>
              <Link href="/projects/upcoming" className="text-sm transition-colors hover:text-white">
                Upcoming
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-brass-light">Contact</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>{settings.address}</li>
            <li>{settings.phone}</li>
            <li>{settings.email}</li>
            <li>{settings.businessHours}</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-start justify-between gap-2 py-6 text-xs text-limestone-200/60 md:flex-row md:items-center">
          <p>
            © {year} {settings.companyName}. All rights reserved.
          </p>
          <p>{settings.footerLegalText}</p>
        </Container>
      </div>
    </footer>
  );
}
