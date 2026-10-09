import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Map } from "@/components/ui/Map";
import { ContactForm } from "@/components/ui/ContactForm";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { RichText } from "@/components/ui/RichText";
import { Eyebrow, EyebrowPill } from "@/components/ui/Eyebrow";
import { getSiteSettings } from "@/lib/data/settings";
import { getPublishedSiteFaqs } from "@/lib/data/siteFaqs";

export const metadata: Metadata = {
  title: "Contact Us",
};

export const revalidate = 0;

function ContactIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function ContactPage() {
  const [settings, faqs] = await Promise.all([getSiteSettings(), getPublishedSiteFaqs()]);
  // Always-current, since it's just a live read of the same address
  // shown above — an admin-editable FAQ answer would risk going stale
  // if the office ever moves.
  const officeFaq = { question: "Where is your office?", answer: settings.address };

  const contactItems: { label: string; value: string; href?: string; icon: React.ReactNode }[] = [
    {
      label: "Phone",
      value: settings.phone,
      href: `tel:${settings.phone.replace(/[^\d+]/g, "")}`,
      icon: <ContactIcon d="M5 4h3l1.5 4-2 1.2a10 10 0 0 0 4.3 4.3l1.2-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A14 14 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />,
    },
    {
      label: "Email",
      value: settings.email,
      href: `mailto:${settings.email}`,
      icon: <ContactIcon d="M3.5 6.5h15v10h-15zM3.5 7l7.5 5.5L18.5 7" />,
    },
    {
      label: "Office Address",
      value: settings.address,
      icon: <ContactIcon d="M11 19s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10zM11 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
    },
    {
      label: "Business Hours",
      value: settings.businessHours,
      icon: <ContactIcon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7v4l2.5 2" />,
    },
  ];

  return (
    <>
      <Section className="pt-16 md:pt-20">
        <Container>
          <Eyebrow>Contact Us</Eyebrow>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.1] md:text-5xl">
            Let&apos;s talk about your <em className="italic text-brass">future home</em>
          </h1>

          {/* Mobile/tablet order: details → form → map, so the form isn't
              buried below the map. Desktop: details + map left, form right. */}
          <div className="mt-12 grid grid-cols-1 gap-12 lg:mt-14 lg:grid-cols-[1fr_1.25fr] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8">
            <div className="lg:col-start-1 lg:row-start-1">
              <p className="max-w-prose text-base leading-relaxed text-ink-soft">
                Whether you want to learn about our projects, compare unit
                options or arrange a site visit, our team is ready to help.
              </p>

              <ul className="mt-8 divide-y divide-limestone-300 border-y border-limestone-300">
                {contactItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-4 py-5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-brass/30 bg-white text-brass">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
                        {item.label}
                      </h2>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-1 block break-words text-base text-ink-soft transition-colors duration-150 hover:text-garden-600"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 whitespace-pre-line text-base text-ink-soft">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="self-start rounded-lg border border-limestone-300 bg-white p-6 shadow-card sm:p-8 md:p-10 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <h2 className="text-2xl md:text-3xl">Send us a message</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Tell us which project or unit type interests you and the best time to call.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <div className="lg:col-start-1 lg:row-start-2">
              <Map
                latitude={settings.latitude}
                longitude={settings.longitude}
                label={settings.companyName}
                address={settings.address}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-garden-900">
        <Container className="max-w-4xl">
          <EyebrowPill>FAQ</EyebrowPill>
          <h2 className="mt-4 text-3xl text-white md:text-4xl">Frequently Asked Questions</h2>
          <p className="mt-3 max-w-prose text-base text-limestone-200/75">
            Answers to what buyers usually ask us before their first site visit.
          </p>
          <div className="mt-10">
            <FaqAccordion
              items={[...faqs, officeFaq].map((faq) => ({
                question: faq.question,
                answer: <RichText html={faq.answer} className="rich-text-on-dark" />,
              }))}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
