import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { InventoryTable } from "@/components/ui/InventoryTable";
import { PaymentPlanCards } from "@/components/ui/PaymentPlanCards";
import { ProjectFaqList } from "@/components/ui/ProjectFaqList";
import { EyebrowPill } from "@/components/ui/Eyebrow";
import { Map } from "@/components/ui/Map";
import { InquiryForm } from "@/components/ui/InquiryForm";
import { getProjectBySlug } from "@/lib/data/projects";
import { getInventoryForProject } from "@/lib/data/inventory";
import { getEnabledPaymentPlansForProject } from "@/lib/data/paymentPlans";
import { getPublishedFaqsForProject } from "@/lib/data/projectFaqs";
import { RichText } from "@/components/ui/RichText";
import { isEmptyRichHtml } from "@/lib/richText/shared";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const title = project.seoTitle || project.name;
  const description = project.metaDescription || project.shortDescription;
  const ogImage = project.ogImageUrl || project.coverImage.url;

  return {
    title,
    description,
    alternates: {
      canonical: project.canonicalUrl || `/projects/${project.slug}`,
    },
    ...(project.noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const inventory = await getInventoryForProject(project.id);
  const paymentPlans = await getEnabledPaymentPlansForProject(project.id);
  const faqs = await getPublishedFaqsForProject(project.id);

  const isFlat = project.category === "flat";
  const unitLabel = isFlat ? "Flats" : "Plots";

  const infoRows = [
    { label: "Status", value: project.status[0].toUpperCase() + project.status.slice(1) },
    { label: "Category", value: isFlat ? "Flat / Apartment" : "Land / Plot" },
    { label: "Project Type", value: project.projectType },
    { label: "Total Area", value: project.totalArea },
    ...(project.totalUnits !== null ? [{ label: `Total ${unitLabel}`, value: String(project.totalUnits) }] : []),
    ...(project.availableUnits !== null
      ? [{ label: `Available ${unitLabel}`, value: String(project.availableUnits) }]
      : []),
    ...(project.sizesOffered ? [{ label: "Sizes Offered", value: project.sizesOffered }] : []),
    ...(isFlat && project.bedroomOptions ? [{ label: "Bedroom Options", value: project.bedroomOptions }] : []),
    { label: "Units / Plots", value: project.unitInfo },
    { label: "Timeline", value: project.timeline },
    { label: "Location", value: project.location },
    ...(project.block ? [{ label: "Block", value: project.block }] : []),
    ...(project.facing ? [{ label: "Facing", value: project.facing }] : []),
    ...(project.frontRoadWidth ? [{ label: "Front Road Width", value: project.frontRoadWidth }] : []),
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[420px] items-end overflow-hidden md:min-h-[520px]">
        <Image
          src={project.coverImage.url}
          alt={project.coverImage.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgba(24,38,32,0.85) 0%, rgba(24,38,32,0.35) 55%, rgba(24,38,32,0.05) 85%)",
          }}
        />
        <Container className="relative py-10 md:py-14">
          <ProjectStatusBadge status={project.status} />
          <h1 className="mt-4 max-w-2xl text-3xl text-white md:text-5xl">
            {project.name}
          </h1>
          <p className="mt-2 text-limestone-100/90">{project.location}</p>
        </Container>
      </section>

      {/* Overview + quick info */}
      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="text-2xl md:text-3xl">Overview</h2>
            <RichText html={project.fullDescription} className="mt-4 max-w-prose text-base text-ink-soft" />

            {/* Rich text — top-level bullets keep the check-mark / ring grid
                (.rich-marker-list in globals.css). */}
            {!isEmptyRichHtml(project.features) && (
              <>
                <h2 className="mt-12 text-2xl md:text-3xl">Features</h2>
                <RichText
                  html={project.features}
                  className="rich-marker-list rich-marker-check mt-4 text-base text-ink-soft"
                />
              </>
            )}

            {!isEmptyRichHtml(project.nearbyFacilities) && (
              <>
                <h2 className="mt-12 text-2xl md:text-3xl">Nearby Facilities</h2>
                <RichText
                  html={project.nearbyFacilities}
                  className="rich-marker-list rich-marker-ring mt-4 text-base text-ink-soft"
                />
              </>
            )}

            {project.pricingInfo && (
              <>
                <h2 className="mt-12 text-2xl md:text-3xl">Pricing &amp; Payment</h2>
                <RichText html={project.pricingInfo} className="mt-4 max-w-prose text-base text-ink-soft" />
              </>
            )}

            {project.masterPlanUrl && (
              <>
                <h2 className="mt-12 text-2xl md:text-3xl">Master Plan</h2>
                <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-limestone-300">
                  <Image
                    src={project.masterPlanUrl}
                    alt={`Master plan of ${project.name}`}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-contain bg-limestone-100"
                  />
                </div>
              </>
            )}
          </div>

          <aside className="rounded-lg border border-limestone-300 bg-limestone-100 p-6">
            <h3 className="text-lg">Project Information</h3>
            <dl className="mt-4 space-y-3.5">
              {infoRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 border-t border-limestone-300 pt-3.5 first:border-t-0 first:pt-0">
                  <dt className="text-sm text-ink-soft">{row.label}</dt>
                  <dd className="text-right text-base font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            {project.brochureUrl && (
              <a
                href={project.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 rounded border border-garden-500 px-4 py-2.5 text-sm font-medium text-garden-700 transition-colors hover:bg-garden-50"
              >
                Download Brochure
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M7 1V9M7 9L4 6M7 9L10 6M1 11V12.5C1 12.7761 1.22386 13 1.5 13H12.5C12.7761 13 13 12.7761 13 12.5V11"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}
          </aside>
        </Container>
      </Section>

      {/* Gallery */}
      {project.gallery.length > 0 && (
        <Section className="bg-limestone-200">
          <Container>
            <h2 className="text-2xl md:text-3xl">Gallery</h2>
            <div className="mt-8">
              <ImageGallery images={project.gallery} />
            </div>
          </Container>
        </Section>
      )}

      {/* Availability — individual plot/unit inventory, if the admin has added any */}
      {inventory.length > 0 && (
        <Section className="bg-limestone-200">
          <Container>
            <h2 className="text-2xl md:text-3xl">Availability</h2>
            <p className="mt-2 max-w-prose text-sm text-ink-soft">
              {isFlat
                ? "Current status of individual units in this project."
                : "Current status of individual plots in this project."}
            </p>
            <div className="mt-8">
              <InventoryTable items={inventory} category={project.category} />
            </div>
          </Container>
        </Section>
      )}

      {/* Payment Plans — admin-managed at /admin/projects/[id]/edit, shown only when at least one is enabled */}
      {paymentPlans.length > 0 && (
        <Section>
          <Container>
            <h2 className="text-2xl md:text-3xl">Payment Plans</h2>
            <div className="mt-8">
              <PaymentPlanCards plans={paymentPlans} />
            </div>
          </Container>
        </Section>
      )}

      {/* Project FAQ — admin-managed at /admin/projects/[id]/edit, shown only when at least one is published */}
      {faqs.length > 0 && (
        <Section className="bg-garden-900">
          <Container className="max-w-4xl">
            <EyebrowPill>FAQ</EyebrowPill>
            <h2 className="mt-4 text-2xl text-white md:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-8">
              <ProjectFaqList faqs={faqs} />
            </div>
          </Container>
        </Section>
      )}

      {/* Location + Inquiry */}
      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl md:text-3xl">Location</h2>
            <p className="mt-3 text-ink-soft">{project.location}</p>
            <div className="mt-5">
              <Map
                latitude={project.latitude}
                longitude={project.longitude}
                label={project.name}
              />
            </div>
          </div>

          <div className="rounded-lg border border-limestone-300 bg-limestone-100 p-6">
            <h2 className="text-xl">Interested in this project?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Send an inquiry and our team will get back to you with more
              details about {project.name}.
            </p>
            <div className="mt-6">
              <InquiryForm projectId={project.id} projectName={project.name} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Disclaimer */}
      <Section className="bg-limestone-200 py-10">
        <Container>
          <p className="max-w-3xl text-xs text-ink-soft">
            All designs, layouts, images, facilities and descriptions on
            this site are conceptual and for information only. Al Bustan
            Communities Limited reserves the right to change, extend or
            amend any element, design or master plan according to company
            decisions and government or relevant authority directions. Plot
            prices, handover timing and other legal and commercial terms
            will be finalised by the company and are not final until
            confirmed in writing.
          </p>
        </Container>
      </Section>
    </>
  );
}
