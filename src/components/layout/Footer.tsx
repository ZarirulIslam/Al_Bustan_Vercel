import Link from "next/link";
import type { ReactNode } from "react";
import { primaryNav } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { RichText } from "@/components/ui/RichText";

const S = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

const contactIcons = {
  address: (
    <>
      <path {...S} d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle {...S} cx="12" cy="9.5" r="2.5" />
    </>
  ),
  phone: (
    <path
      {...S}
      d="M5 4h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"
    />
  ),
  email: (
    <>
      <rect {...S} x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path {...S} d="m4 7 8 6 8-6" />
    </>
  ),
  hours: (
    <>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path {...S} d="M12 7.5V12l3 2" />
    </>
  ),
};

const socialIcons: Record<keyof SiteSettings["social"], { label: string; icon: ReactNode }> = {
  facebook: {
    label: "Facebook",
    icon: <path fill="currentColor" d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4a20 20 0 0 0-2.2-.1c-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z" />,
  },
  instagram: {
    label: "Instagram",
    icon: (
      <>
        <rect {...S} x="4" y="4" width="16" height="16" rx="4.5" />
        <circle {...S} cx="12" cy="12" r="3.6" />
        <circle fill="currentColor" cx="16.8" cy="7.2" r="1" />
      </>
    ),
  },
  linkedin: {
    label: "LinkedIn",
    icon: (
      <path
        fill="currentColor"
        d="M6.9 8.8H4V20h2.9zM5.4 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM20 13.6c0-3-1.6-5-4.3-5-1.4 0-2.3.7-2.8 1.4V8.8H10V20h2.9v-5.8c0-1.5.6-2.6 2-2.6s1.9 1.1 1.9 2.6V20H20z"
      />
    ),
  },
  youtube: {
    label: "YouTube",
    icon: (
      <path
        fill="currentColor"
        d="M21.2 8.2a2.5 2.5 0 0 0-1.8-1.8C17.9 6 12 6 12 6s-5.9 0-7.4.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2.4 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.8 1.8C6.1 18 12 18 12 18s5.9 0 7.4-.4a2.5 2.5 0 0 0 1.8-1.8 26 26 0 0 0 .4-3.8 26 26 0 0 0-.4-3.8zM10 14.6V9.4l4.6 2.6z"
      />
    ),
  },
};

function ColumnHeading({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-light">{children}</p>;
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm transition-colors duration-200 hover:text-white">
      {children}
    </Link>
  );
}

function ContactItem({ icon, children }: { icon: keyof typeof contactIcons; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 flex-shrink-0 text-brass-light">
        {contactIcons[icon]}
      </svg>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  // Only real web links — the settings form stores whatever was typed.
  const socials = (Object.keys(socialIcons) as (keyof SiteSettings["social"])[]).flatMap((key) => {
    const url = settings.social[key];
    return url && /^https?:\/\//i.test(url) ? [{ key, url, ...socialIcons[key] }] : [];
  });

  return (
    <footer className="border-t border-white/10 bg-garden-900 text-limestone-200/80">
      <Container className="grid grid-cols-1 gap-x-12 gap-y-12 py-16 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,1.5fr)] lg:gap-x-12 xl:gap-x-16">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="max-w-xs font-display text-2xl leading-snug text-white">{settings.companyName}</p>
          <span className="mt-4 block h-px w-12 bg-brass-light/60" aria-hidden="true" />
          <RichText
            html={settings.companyDescription}
            className="rich-text-on-dark mt-5 max-w-sm text-sm leading-relaxed text-limestone-200/70"
          />
          {socials.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-limestone-200/80 transition-colors duration-200 hover:border-brass-light hover:bg-brass-light hover:text-garden-900"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      {s.icon}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer">
          <ColumnHeading>Navigate</ColumnHeading>
          <ul className="mt-5 space-y-3">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <FooterLink href={item.href}>{item.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <ColumnHeading>Projects</ColumnHeading>
          <ul className="mt-5 space-y-3">
            <li>
              <FooterLink href="/projects/ongoing">Ongoing</FooterLink>
            </li>
            <li>
              <FooterLink href="/projects/completed">Completed</FooterLink>
            </li>
            <li>
              <FooterLink href="/projects/upcoming">Upcoming</FooterLink>
            </li>
          </ul>
        </div>

        <div>
          <ColumnHeading>Contact</ColumnHeading>
          <ul className="mt-5 space-y-4 text-sm">
            {settings.address && <ContactItem icon="address">{settings.address}</ContactItem>}
            {settings.phone && (
              <ContactItem icon="phone">
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-white">
                  {settings.phone}
                </a>
              </ContactItem>
            )}
            {settings.email && (
              <ContactItem icon="email">
                <a href={`mailto:${settings.email}`} className="transition-colors hover:text-white">
                  {/* Prefer wrapping after "@" over breaking mid-word. */}
                  {settings.email.split("@")[0]}
                  {settings.email.includes("@") && (
                    <>
                      @<wbr />
                      {settings.email.slice(settings.email.indexOf("@") + 1)}
                    </>
                  )}
                </a>
              </ContactItem>
            )}
            {settings.businessHours && <ContactItem icon="hours">{settings.businessHours}</ContactItem>}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-start justify-between gap-2 py-6 text-xs text-limestone-200/60 md:flex-row md:items-center">
          <p>
            © {year} {settings.companyName}. All rights reserved.
          </p>
          <RichText html={settings.footerLegalText} className="rich-text-on-dark [&_a]:no-underline [&_a:hover]:underline" />
        </Container>
      </div>
    </footer>
  );
}
