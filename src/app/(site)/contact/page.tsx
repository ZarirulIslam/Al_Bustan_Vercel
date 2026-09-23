import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Map } from "@/components/ui/Map";
import { ContactForm } from "@/components/ui/ContactForm";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { EyebrowPill } from "@/components/ui/Eyebrow";
import { getSiteSettings } from "@/lib/data/settings";
import { getPublishedSiteFaqs } from "@/lib/data/siteFaqs";

export const metadata: Metadata = {
  title: "Contact Us",
};

export const revalidate = 0;

export default async function ContactPage() {
  const [settings, faqs] = await Promise.all([getSiteSettings(), getPublishedSiteFaqs()]);
  // Always-current, since it's just a live read of the same address
  // shown above — an admin-editable FAQ answer would risk going stale
  // if the office ever moves.
  const officeFaq = { question: "Where is your office?", answer: settings.address };

  return (
    <>
      <Section className="pt-16 md:pt-20">
        <Container>
          <p className="text-sm text-brass">Contact Us</p>
          <h1 className="mt-3 max-w-xl text-4xl md:text-5xl">
            Let&apos;s talk about your future home
          </h1>
          <p className="mt-4 max-w-prose text-base text-ink-soft">
            Whether you want to learn about our projects, compare unit
            options or arrange a site visit, our team is ready to help.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-8">
              <div>
                <h2 className="text-lg">Office Address</h2>
                <p className="mt-2 text-base text-ink-soft">{settings.address}</p>
              </div>
              <div>
                <h2 className="text-lg">Business Hours</h2>
                <p className="mt-2 text-base text-ink-soft">{settings.businessHours}</p>
              </div>
              <div>
                <h2 className="text-lg">Phone</h2>
                <p className="mt-2 text-base text-ink-soft">{settings.phone}</p>
              </div>
              <div>
                <h2 className="text-lg">Email</h2>
                <p className="mt-2 text-base text-ink-soft">{settings.email}</p>
              </div>

              <Map
                latitude={settings.latitude}
                longitude={settings.longitude}
                label={settings.companyName}
              />
            </div>

            <div className="rounded-lg border border-limestone-300 bg-limestone-100 p-6 md:p-8">
              <h2 className="text-xl">Send Us a Message</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Tell us which project or unit type interests you and the
                best time to call. We usually reply within one working day.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
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
            <FaqAccordion items={[...faqs, officeFaq]} />
          </div>
        </Container>
      </Section>
    </>
  );
}
