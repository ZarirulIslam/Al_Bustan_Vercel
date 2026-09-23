import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { getAboutPageSettings } from "@/lib/data/aboutPageSettings";
import { getPublishedContentItems } from "@/lib/data/contentItems";

export const metadata: Metadata = {
  title: "About Us",
};

export const revalidate = 0;

const coreValueToneStyles = {
  garden: "bg-garden-100 text-garden-700",
  sky: "bg-sky-50 text-sky-dark",
  brass: "bg-brass-50 text-brass-dark",
};

export default async function AboutPage() {
  const [settings, whatWeDo, missionPoints, coreValues, approachSteps] = await Promise.all([
    getAboutPageSettings(),
    getPublishedContentItems("about_what_we_do"),
    getPublishedContentItems("about_mission_points"),
    getPublishedContentItems("about_core_values"),
    getPublishedContentItems("about_approach_steps"),
  ]);

  return (
    <>
      {/* Page header */}
      <section className="relative flex min-h-[420px] items-end overflow-hidden md:min-h-[480px]">
        <Image
          src={settings.heroImageUrl}
          alt="Aerial view of a planned residential community"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgba(8,31,20,0.85) 0%, rgba(8,31,20,0.5) 45%, rgba(8,31,20,0.2) 75%)",
          }}
        />
        <Container className="relative py-14 md:py-20">
          <p className="text-sm text-limestone-200/80">{settings.heroEyebrow}</p>
          <h1 className="mt-3 max-w-2xl text-4xl text-white md:text-5xl">{settings.heroHeading}</h1>
          <p className="mt-5 max-w-prose text-base text-limestone-100/90">{settings.heroParagraph}</p>
        </Container>
      </section>

      {/* Overview */}
      <Section>
        <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg md:order-2">
            <Image
              src={settings.overviewImageUrl}
              alt="Planned residential towers"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl">Company overview</h2>
            <p className="mt-5 max-w-prose text-base text-ink-soft">{settings.overviewParagraph}</p>

            {whatWeDo.length > 0 && (
              <>
                <h3 className="mt-8 text-lg">What we do</h3>
                <ul className="mt-4 space-y-3">
                  {whatWeDo.map((item) => (
                    <li key={item.id} className="text-base text-ink-soft">
                      <span className="font-medium text-ink">{item.title}.</span> {item.description}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Container>
      </Section>

      {/* Vision & Mission */}
      <Section className="bg-limestone-200">
        <Container className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-limestone-300 bg-white p-8">
            <h2 className="text-2xl">Vision</h2>
            <p className="mt-4 text-base text-ink-soft">{settings.visionParagraph}</p>
          </div>
          {missionPoints.length > 0 && (
            <div className="rounded-lg border border-limestone-300 bg-white p-8">
              <h2 className="text-2xl">Mission</h2>
              <ul className="mt-4 space-y-2.5">
                {missionPoints.map((point) => (
                  <li key={point.id} className="flex items-start gap-2.5 text-base text-ink-soft">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-1 flex-shrink-0 text-garden-500">
                      <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {point.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>

      {/* Core values */}
      {coreValues.length > 0 && (
        <Section>
          <Container>
            <h2 className="max-w-md text-3xl md:text-4xl">Core values</h2>
            <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {coreValues.map((value) => (
                <div key={value.id}>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${coreValueToneStyles[value.tone]}`}
                  >
                    <ContentIcon icon={value.icon} />
                  </div>
                  <h3 className="mt-4 text-lg">{value.title}</h3>
                  <p className="mt-2 text-base text-ink-soft">{value.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Our approach */}
      {approachSteps.length > 0 && (
        <Section className="bg-limestone-200">
          <Container>
            <h2 className="max-w-md text-3xl md:text-4xl">Our approach</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {approachSteps.map((step, index) => (
                <div key={step.id}>
                  <span className="text-sm text-brass">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-lg">{step.title}</h3>
                  <p className="mt-2 text-base text-ink-soft">{step.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Our portfolio */}
      <Section>
        <Container className="flex flex-col items-start justify-between gap-6 rounded-lg border border-limestone-300 bg-limestone-100 p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl">Our portfolio</h2>
            <p className="mt-2 max-w-prose text-base text-ink-soft">{settings.portfolioParagraph}</p>
          </div>
          <Button href="/projects" variant="primary">
            View Our Projects
          </Button>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="bg-garden-700">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h2 className="max-w-md text-3xl text-white md:text-4xl">{settings.ctaHeading}</h2>
          <Button href="/contact" variant="secondary" size="lg">
            Contact Us
          </Button>
        </Container>
      </Section>
    </>
  );
}
