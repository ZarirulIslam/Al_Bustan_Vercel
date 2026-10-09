import Image from "next/image";
import { RichText } from "@/components/ui/RichText";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { Map } from "@/components/ui/Map";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";
import { ImageCarousel } from "@/components/project/ImageCarousel";
import { VideoShowcase } from "@/components/project/VideoShowcase";
import { LiteYouTube } from "@/components/project/LiteYouTube";
import { PlotTypeTabs } from "@/components/project/PlotTypeTabs";
import { PlotBookingForm } from "@/components/project/PlotBookingForm";
import { Reveal } from "@/components/project/Reveal";
import { ArrowIcon, DownloadIcon, IconChip, IconTileGrid, directionsUrl } from "@/components/project/shared";
import { isEmptyRichHtml } from "@/lib/richText/shared";
import type { ProjectSectionItemsBySection } from "@/lib/data/projectSectionItems";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

// Land / Plot project detail page — Bangla. Holds exactly the sections of
// the land reference design, in its order:
//  01 Hero · 02 প্রকল্প পরিচিতি · 03 অবস্থান (video + cards scroll past
//  fixed text) · 04 বৈশিষ্ট্যসমূহ · 05 উপলব্ধ প্লটসমূহ · 06 লক্ষ্য (photo
//  cards scroll past fixed text) · 07 গ্যালারি · 08 ভিডিও · 09 লোকেশন
//  ম্যাপ · 10 সুরক্ষিত জোন · 11 সুযোগ-সুবিধা · 12 অঙ্গপ্রতিষ্ঠান ·
//  13 মাস্টার প্ল্যান ও প্লট বুকিং
// Content comes from the Land editor in the CMS; a section with nothing
// to show is skipped.

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

// Bullet texts of a rich-text list — shown as chips in the location section.
function listItems(html: string): string[] {
  return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim())
    .filter(Boolean);
}

function Eyebrow({ children, tone = "dark", center }: { children: React.ReactNode; tone?: "dark" | "light"; center?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-sm font-semibold",
        center && "justify-center",
        tone === "light" ? "text-garden-300" : "text-garden-600"
      )}
    >
      {children}
      <span aria-hidden className="h-px w-12 bg-current opacity-40" />
    </p>
  );
}

function Pill({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold",
        tone === "light" ? "bg-white/10 text-garden-300 ring-1 ring-white/15" : "bg-garden-50 text-garden-700 ring-1 ring-garden-100"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function CenteredHeading({
  pill,
  eyebrow,
  title,
  lead,
  tone = "dark",
}: {
  pill?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {pill && <Pill tone={tone}>{pill}</Pill>}
      {eyebrow && (
        <Eyebrow center tone={tone}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className={cn("mt-4 text-3xl font-bold leading-snug md:text-[2.6rem]", tone === "light" && "text-white")}>{title}</h2>
      <span aria-hidden className="mx-auto mt-5 block h-1 w-12 rounded-full bg-gradient-to-r from-garden-500 to-brass-light" />
      {lead && <p className={cn("mt-5 text-lg leading-relaxed", tone === "light" ? "text-white/70" : "text-ink-soft")}>{lead}</p>}
    </div>
  );
}

const pillBtn =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200";
const btn = {
  solid: cn(pillBtn, "bg-garden-500 text-white shadow-card hover:bg-garden-600 hover:shadow-card-hover"),
  outline: cn(pillBtn, "border border-garden-500 text-garden-600 hover:bg-garden-50"),
};

export function LandProjectView({ project, sections }: { project: Project; sections: ProjectSectionItemsBySection }) {
  const name = project.name;
  const photos = [project.coverImage, ...project.gallery].filter((img) => img.url);
  const carouselImages = project.gallery.length > 0 ? project.gallery : photos;
  const hasNearby = !isEmptyRichHtml(project.nearbyFacilities);
  const chips = listItems(project.features);
  const firstVideo = project.videoUrls[0];
  const blocks = (project.block ?? "")
    .split(/[,،]/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div lang="bn">
      {/* ── 01 Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-20 md:pb-20 md:pt-28">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-garden-50 via-limestone-100 to-limestone" />
        <div aria-hidden className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-garden-100/70 blur-3xl" />
        <div aria-hidden className="absolute -right-32 top-16 h-80 w-80 rounded-full bg-brass-50 blur-3xl" />
        <div className="container-content relative mx-auto max-w-3xl text-center">
          {project.tagline && <Eyebrow center>{project.tagline}</Eyebrow>}
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">{name}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl">{project.shortDescription}</p>
        </div>
      </section>

      {/* ── 02 প্রকল্প পরিচিতি ──────────────────────────────── */}
      <section id="about" className="scroll-mt-24 pb-20 md:pb-28">
        <div className="container-content grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <Pill>প্রকল্প পরিচিতি</Pill>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">প্রকল্প পরিচিতি</h2>
            {!isEmptyRichHtml(project.fullDescription) && (
              <RichText html={project.fullDescription} className="mt-6 text-base leading-relaxed text-ink-soft" />
            )}

            {sections.stat.length > 0 && (
              <dl
                className={cn(
                  "mt-8 grid gap-px overflow-hidden rounded-2xl border border-limestone-300 bg-limestone-300 shadow-card",
                  sections.stat.length >= 3 ? "grid-cols-3" : "grid-cols-2"
                )}
              >
                {sections.stat.slice(0, 3).map((stat) => (
                  <div key={stat.id} className="flex flex-col-reverse bg-white px-5 py-5">
                    <dt className="mt-1 text-xs text-ink-soft sm:text-sm">{stat.description}</dt>
                    <dd className="text-2xl font-bold text-garden-600">{stat.title}</dd>
                  </div>
                ))}
              </dl>
            )}

            {(project.masterPlanUrl || project.brochureUrl) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {project.masterPlanUrl && (
                  <a href="#master-plan" className={btn.outline}>
                    <ContentIcon icon="grid" className="h-4 w-4" />
                    মাস্টার প্ল্যান
                  </a>
                )}
                {project.brochureUrl && (
                  <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer" className={btn.solid}>
                    <DownloadIcon />
                    ব্রোশিওর ডাউনলোড
                  </a>
                )}
              </div>
            )}
          </div>

          <Reveal className="relative">
            <div aria-hidden className="absolute -inset-3 -rotate-2 rounded-[2rem] bg-gradient-to-br from-garden-100 to-brass-50" />
            <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border-[6px] border-white shadow-card-hover">
              <Image src={project.coverImage.url} alt={project.coverImage.alt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              <span className="absolute left-4 top-4">
                <ProjectStatusBadge status={project.status} />
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 03 অবস্থান — media scrolls, text stays ──────────────── */}
      {(firstVideo || sections.location_highlight.length > 0 || hasNearby) && (
        <section id="location" className="relative scroll-mt-24 bg-gradient-to-b from-limestone-100 to-white py-20 md:py-28">
          <div className="container-content grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="flex flex-col gap-4">
              {firstVideo ? (
                <Reveal>
                  <LiteYouTube url={firstVideo} title={`${name} — ভিডিও`} playLabel="ভিডিওটি দেখুন" />
                </Reveal>
              ) : (
                photos[1] && (
                  <Reveal className="relative aspect-video overflow-hidden rounded-3xl shadow-card-hover ring-4 ring-white">
                    <Image src={photos[1].url} alt={photos[1].alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                  </Reveal>
                )
              )}
              {sections.location_highlight.length > 0 && (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sections.location_highlight.map((item, i) => (
                    <Reveal
                      as="li"
                      key={item.id}
                      delay={(i % 2) * 120}
                      className="rounded-2xl border border-garden-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      <div className="flex items-center gap-3">
                        <IconChip icon={item.icon} size="sm" />
                        <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>
                      </div>
                      {item.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.description}</p>}
                    </Reveal>
                  ))}
                </ul>
              )}
            </div>

            <div className="lg:sticky lg:top-32 lg:self-start">
              <Eyebrow>{name}-এর অবস্থান</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold leading-snug md:text-4xl">স্বাচ্ছন্দ্য, যোগাযোগ এবং দৈনন্দিন সুবিধার সেরা সংযোগস্থল</h2>
              {hasNearby && (
                <RichText
                  html={project.nearbyFacilities}
                  className="rich-marker-list rich-marker-ring mt-6 text-base leading-relaxed text-ink-soft [&>ul]:sm:grid-cols-1"
                />
              )}
              {chips.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {chips.map((chip) => (
                    <li
                      key={chip}
                      className="inline-flex items-center gap-2 rounded-full border border-garden-100 bg-garden-50 px-3.5 py-1.5 text-sm text-garden-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-garden-500" />
                      {chip}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={directionsUrl(project)} target="_blank" rel="noopener noreferrer" className={btn.solid}>
                  <ContentIcon icon="pin" className="h-4 w-4" />
                  গুগল ম্যাপে দিকনির্দেশনা দেখুন
                </a>
                {project.masterPlanUrl && (
                  <a href="#master-plan" className={btn.outline}>
                    ম্যাপ প্ল্যান দেখুন
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 04 বৈশিষ্ট্যসমূহ ───────────────────────────────────── */}
      {sections.key_feature.length > 0 && (
        <section id="features" className="scroll-mt-24 py-20 md:py-28">
          <div className="container-content">
            <CenteredHeading
              eyebrow="বিনিয়োগের সেরা সুযোগ"
              title={`${name}-এর বৈশিষ্ট্যসমূহ`}
              lead="পরিকল্পিত নগর পরিকল্পনার সমন্বয়ে তৈরি এক অনন্য, সবুজ ও আধুনিক নাগরিক সুযোগ-সুবিধা সম্বলিত স্বয়ংসম্পূর্ণ টাউনশিপ।"
            />
            <div className="mt-14 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <ul className="space-y-8">
                {sections.key_feature.map((item, i) => (
                  <Reveal as="li" key={item.id} delay={i * 80} className="flex gap-5">
                    <IconChip icon={item.icon} />
                    <div>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      {item.description && <p className="mt-1.5 leading-relaxed text-ink-soft">{item.description}</p>}
                    </div>
                  </Reveal>
                ))}
              </ul>
              <Reveal>
                <ImageCarousel images={carouselImages} label="প্রকল্প পরিচিতি" aspect="aspect-[4/4.6]" autoPlay />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── 05 উপলব্ধ প্লটসমূহ ─────────────────────────────────── */}
      {sections.plot_type.length > 0 && (
        <section id="plots" className="relative scroll-mt-24 overflow-hidden bg-white py-20 md:py-28">
          <div aria-hidden className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-garden-50 blur-3xl" />
          <div className="container-content relative">
            <CenteredHeading
              eyebrow="আপনার প্রয়োজন অনুযায়ী প্রপার্টি বেছে নিন"
              title="উপলব্ধ প্লটসমূহ"
              lead="আমাদের মাস্টার প্ল্যান অনুযায়ী আবাসিক, বাণিজ্যিক এবং অন্যান্য জোনগুলো এমনভাবে সাজানো হয়েছে যা একটি সুশৃঙ্খল ও আধুনিক জীবনযাপনের নিশ্চয়তা দেয়।"
            />
            <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <Reveal>
                <PhotoCollage images={photos} />
              </Reveal>
              <PlotTypeTabs items={sections.plot_type} />
            </div>
          </div>
        </section>
      )}

      {/* ── 06 লক্ষ্য — photos scroll, text stays ───────────────── */}
      {sections.goal.length > 0 && (
        <section id="goals" className="relative scroll-mt-24 py-20 md:py-28">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-garden-50/80 via-limestone to-brass-50/40" />
          <div className="container-content relative grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Eyebrow>একটি স্বপ্নের ঠিকানা</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold leading-snug md:text-[2.6rem]">{name}-এর লক্ষ্য</h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-soft">
                আমাদের মূল লক্ষ্য হলো স্থায়িত্ব, সামাজিক কল্যাণ এবং সুপরিকল্পিত নগরায়ন। প্রকল্পের প্রতিটি দিক এমনভাবে সাজানো হয়েছে
                যা প্রকৃতির ভারসাম্য রক্ষা করে আধুনিক ও উন্নত জীবনযাত্রার নিশ্চয়তা দেয়।
              </p>
              <div className="mt-8 flex items-center gap-4 text-sm font-semibold text-garden-600">
                <span aria-hidden className="h-px flex-1 bg-garden-300/60" />
                ভিশন ও মিশন
              </div>
            </div>

            <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {sections.goal.map((item, i) => {
                const wide = sections.goal.length % 2 === 1 && i === sections.goal.length - 1;
                return (
                  <Reveal
                    as="li"
                    key={item.id}
                    delay={(i % 2) * 140}
                    className={cn(
                      "group relative overflow-hidden rounded-[2rem] bg-garden-900 shadow-card-hover",
                      wide ? "aspect-[16/9] sm:col-span-2 sm:aspect-[2.2/1]" : "aspect-[4/5]"
                    )}
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes={wide ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw"}
                        className="object-cover transition-transform duration-700 ease-estate group-hover:scale-105"
                      />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-garden-900/90 via-garden-900/20 to-transparent" />
                    <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="absolute inset-x-5 bottom-5 flex gap-3 text-base font-medium leading-snug text-white sm:text-lg">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-garden-500 ring-2 ring-white/40">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {item.title}
                    </p>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* ── 07 ভিজ্যুয়াল ট্যুর ─────────────────────────────────── */}
      {project.gallery.length > 0 && (
        <section id="gallery" className="scroll-mt-24 bg-white py-20 md:py-28">
          <div className="container-content">
            <CenteredHeading eyebrow="প্রজেক্ট গ্যালারি" title={`ভিজ্যুয়াল ট্যুর - ${name}`} />
            <div className="mt-12">
              <ImageGallery images={project.gallery} showCategories={false} locale="bn" />
            </div>
          </div>
        </section>
      )}

      {/* ── 08 ভিডিও ─────────────────────────────────────────── */}
      {project.videoUrls.length > 0 && (
        <section
          id="video"
          className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-[#0a1a14] via-garden-900 to-[#0a1a14] py-20 md:py-28"
        >
          <div aria-hidden className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-garden-500/20 blur-3xl" />
          <div className="container-content relative">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <Pill tone="light">
                  <span className="uppercase tracking-[0.14em]">{name} Films</span>
                </Pill>
                <h2 className="mt-4 text-3xl font-bold text-white md:text-[2.6rem]">ভিডিওতে দেখুন {name}</h2>
                <p className="mt-4 text-lg text-white/70">এক নজরে আমাদের প্রকল্প। পছন্দের ভিডিও বেছে নিন, আরও কাছ থেকে দেখুন {name}।</p>
              </div>
              <span className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/75">
                {bn(project.videoUrls.length)}টি ভিডিও
              </span>
            </div>
            <div className="mt-12">
              <VideoShowcase urls={project.videoUrls} projectName={name} locale="bn" />
            </div>
          </div>
        </section>
      )}

      {/* ── 09 লোকেশন ম্যাপ ─────────────────────────────────────── */}
      <section id="master-plan" className="scroll-mt-24 py-20 md:py-28">
        <div className="container-content grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal className="rounded-[2rem] bg-white p-4 shadow-card-hover">
            {project.masterPlanUrl ? (
              <a
                href={project.masterPlanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[4/3.4] overflow-hidden rounded-3xl bg-limestone-100"
                aria-label="মাস্টার প্ল্যান বড় করে দেখুন"
              >
                <Image
                  src={project.masterPlanUrl}
                  alt={`${name} — মাস্টার প্ল্যান`}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </a>
            ) : (
              <Map latitude={project.latitude} longitude={project.longitude} label={name} address={project.location} />
            )}
          </Reveal>

          <div>
            <Eyebrow>ভবিষ্যতের সম্ভাবনা</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold md:text-[2.6rem]">{name} লোকেশন ম্যাপ</h2>
            <p className="mt-5 flex items-start gap-2 text-lg text-ink-soft">
              <ContentIcon icon="pin" className="mt-1 h-5 w-5 flex-shrink-0 text-garden-500" />
              {project.location}
            </p>
            {sections.route.length > 0 && (
              <ul className="mt-8 space-y-6">
                {sections.route.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <IconChip icon={item.icon} size="sm" className="bg-brass-50 text-brass-dark ring-brass-50" />
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {item.description && <p className="mt-1 text-ink-soft">{item.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <a href={directionsUrl(project)} target="_blank" rel="noopener noreferrer" className={cn(btn.outline, "mt-8")}>
              দিকনির্দেশনা পান
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* ── 10 সুরক্ষিত জোন ─────────────────────────────────────── */}
      {sections.security.length > 0 && (
        <section id="security" className="scroll-mt-24 bg-white py-20 md:py-28">
          <div className="container-content">
            <CenteredHeading
              pill="সর্বোচ্চ সুরক্ষিত জোন"
              title="নিরাপদ ও আধুনিক টাউনশিপ জীবনের জন্য পরিকল্পিত"
              lead="আধুনিক টাউনশিপের জন্য পরিকল্পিত ও সুরক্ষিত পরিবেশ।"
            />
            <div className="mt-12">
              <IconTileGrid items={sections.security} columns={3} showDescription={false} />
            </div>
          </div>
        </section>
      )}

      {/* ── 11 সুযোগ-সুবিধা ──────────────────────────────────────── */}
      {sections.amenity.length > 0 && (
        <section id="amenities" className="relative scroll-mt-24 overflow-hidden py-20 md:py-28">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-limestone to-garden-50/60" />
          <div className="container-content relative">
            <CenteredHeading
              pill="সকল সুযোগ-সুবিধার সমাহার"
              title="দৈনন্দিন জীবনযাত্রার জন্য আধুনিক সকল নাগরিক সুবিধা"
              lead="আধুনিক জীবনযাত্রার জন্য বিশ্বমানের নাগরিক সুযোগ-সুবিধা।"
            />
            <div className="mt-12">
              <IconTileGrid items={sections.amenity} showDescription={false} />
            </div>
          </div>
        </section>
      )}

      {/* ── 12 অঙ্গপ্রতিষ্ঠান ─────────────────────────────────────── */}
      {sections.partner.length > 0 && (
        <section id="partners" className="scroll-mt-24 bg-white py-20 md:py-24">
          <div className="container-content">
            <CenteredHeading eyebrow="গর্বের সাথে জানাচ্ছি" title="আমাদের অঙ্গপ্রতিষ্ঠান" />
            <ul className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-4">
              {sections.partner.map((item) => (
                <li
                  key={item.id}
                  title={item.title}
                  className="flex h-28 w-[calc(50%-0.5rem)] items-center justify-center rounded-2xl border border-limestone-300/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:w-[calc(25%-0.75rem)]"
                >
                  {item.imageUrl ? (
                    <span className="relative block h-full w-full">
                      <Image src={item.imageUrl} alt={item.title} fill sizes="200px" className="object-contain" />
                    </span>
                  ) : (
                    <span className="text-center text-sm font-semibold text-ink">{item.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 13 মাস্টার প্ল্যান ও প্লট বুকিং ──────────────────────── */}
      <section id="booking" className="relative scroll-mt-24 overflow-hidden py-20 md:py-28">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-garden-50 via-limestone to-brass-50/60" />
        <div className="container-content relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col rounded-[2rem] border border-white bg-white/80 p-7 shadow-card backdrop-blur sm:p-9">
            <Eyebrow>মাস্টার প্ল্যান ও ব্রোশিওর</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold leading-snug md:text-4xl">লেআউট দেখুন এবং আপনার পছন্দের প্লট বুক করুন</h2>
            <p className="mt-4 text-ink-soft">সম্পূর্ণ তথ্যের জন্য প্রজেক্ট ব্রোশিওরটি ডাউনলোড করুন।</p>
            {project.masterPlanUrl && (
              <a
                href={project.masterPlanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative mt-6 block aspect-[16/10] overflow-hidden rounded-2xl border border-limestone-300 bg-white"
                aria-label="মাস্টার প্ল্যান বড় করে দেখুন"
              >
                <Image
                  src={project.masterPlanUrl}
                  alt={`${name} — মাস্টার প্ল্যান`}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </a>
            )}
            {project.brochureUrl && (
              <div className="mt-auto pt-7 text-center">
                <p className="text-sm text-ink-soft">বিস্তারিত তথ্যের জন্য প্রকল্পের ব্রোশিওরটি ডাউনলোড করুন।</p>
                <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer" className={cn(btn.solid, "mt-4")}>
                  <DownloadIcon />
                  ব্রোশিওর PDF ডাউনলোড করুন
                </a>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-card-hover ring-1 ring-limestone-300/70 sm:p-9">
            <h2 className="text-3xl font-bold">প্লট বুকিং</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              আপনার কাঙ্ক্ষিত প্লটের সাইজ, ব্লক ও প্রয়োজনীয় তথ্য দিয়ে বুকিং ফর্মটি পূরণ করুন, আমাদের প্রতিনিধি অতি দ্রুত আপনার সাথে
              যোগাযোগ করবেন।
            </p>
            <div className="mt-7">
              <PlotBookingForm projectId={project.id} projectName={name} blocks={blocks} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Overlapping circular photo composition beside the plot cards.
function PhotoCollage({ images }: { images: Project["gallery"] }) {
  const [main, second, third] = [images[0], images[1] ?? images[0], images[2] ?? images[1] ?? images[0]];
  if (!main) return null;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div aria-hidden className="absolute inset-6 rounded-full border border-dashed border-garden-300/60" />
      <div className="absolute left-[6%] top-[6%] h-[72%] w-[72%] overflow-hidden rounded-full border-[6px] border-white shadow-card-hover">
        <Image src={main.url} alt={main.alt} fill sizes="(min-width: 1024px) 30vw, 70vw" className="object-cover" />
      </div>
      <div className="absolute bottom-[14%] right-[2%] h-[38%] w-[38%] overflow-hidden rounded-full border-[5px] border-white shadow-card-hover">
        <Image src={second.url} alt="" fill sizes="20vw" className="object-cover" />
      </div>
      <div className="absolute bottom-[2%] left-[30%] h-[20%] w-[20%] overflow-hidden rounded-full border-4 border-white shadow-card">
        <Image src={third.url} alt="" fill sizes="10vw" className="object-cover" />
      </div>
      <span aria-hidden className="absolute bottom-[26%] left-[4%] h-3 w-3 rounded-full bg-brass-light" />
      <span aria-hidden className="absolute right-[12%] top-[8%] h-2 w-2 rounded-full bg-garden-300" />
    </div>
  );
}
