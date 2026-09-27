import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { BlogCard } from "@/components/ui/BlogCard";
import { HeroSlider } from "@/components/ui/HeroSlider";
import { Eyebrow, EyebrowPill } from "@/components/ui/Eyebrow";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { getFeaturedProjects, getProjectsByStatus } from "@/lib/data/projects";
import { getLatestPosts } from "@/lib/data/blog";
import { getSiteSettings } from "@/lib/data/settings";
import { getPublishedHeroSlides } from "@/lib/data/hero";
import { getHomepageSettings } from "@/lib/data/homepageSettings";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { getPublishedTeamMembers } from "@/lib/data/teamMembers";
import { TeamSection } from "@/components/ui/TeamSection";
import { getPublishedContentItems } from "@/lib/data/contentItems";
import { RichText } from "@/components/ui/RichText";

export const revalidate = 0;

const toneStyles = {
  garden: "bg-garden-100 text-garden-700",
  sky: "bg-sky-50 text-sky-dark",
  brass: "bg-brass-50 text-brass-dark",
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true" className={className}>
      <path
        d="M1 5H13M13 5L9 1M13 5L9 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function testimonialInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function HomePage() {
  const homepageSettings = await getHomepageSettings();
  const featuredProjects = await getFeaturedProjects(6);
  const [ongoing, completed, upcoming] = await Promise.all([
    getProjectsByStatus("ongoing"),
    getProjectsByStatus("completed"),
    getProjectsByStatus("upcoming"),
  ]);
  const statusTiles = [
    {
      label: homepageSettings.ongoingStatLabel,
      enabled: homepageSettings.ongoingStatEnabled,
      href: "/projects/ongoing",
      count: ongoing.length,
      color: "text-garden-600",
    },
    {
      label: homepageSettings.completedStatLabel,
      enabled: homepageSettings.completedStatEnabled,
      href: "/projects/completed",
      count: completed.length,
      color: "text-sky-dark",
    },
    {
      label: homepageSettings.upcomingStatLabel,
      enabled: homepageSettings.upcomingStatEnabled,
      href: "/projects/upcoming",
      count: upcoming.length,
      color: "text-brass-dark",
    },
  ].filter((tile) => tile.enabled && tile.count > 0);

  // Fetch one extra post so the blog section can lead with a large
  // featured story and three smaller ones beneath it.
  const latestPosts = await getLatestPosts(4);
  const [featuredPost, ...restPosts] = latestPosts;
  const settings = await getSiteSettings();
  const heroSlides = await getPublishedHeroSlides();
  const testimonials = await getPublishedTestimonials();
  const teamMembers = homepageSettings.teamSectionEnabled ? await getPublishedTeamMembers() : [];
  const [developItems, valuePropItems] = await Promise.all([
    getPublishedContentItems("homepage_develop"),
    getPublishedContentItems("homepage_value_prop"),
  ]);

  return (
    <>
      {/* Hero — background images are admin-managed (see /admin/hero);
          the overlay text and buttons below are admin-managed too (see
          /admin/homepage), each independently toggleable. */}
      <section className="relative flex min-h-[640px] items-end overflow-hidden md:min-h-[720px]">
        <HeroSlider images={heroSlides} />
        <Container className="relative z-30 py-16 md:py-24">
          {homepageSettings.heroTextEnabled && (
            <>
              <p className="text-sm text-limestone-200/80">{homepageSettings.heroEyebrow}</p>
              <h1 className="mt-4 max-w-2xl text-4xl text-white md:text-6xl">
                {homepageSettings.heroHeadline}
              </h1>
              <p className="mt-5 max-w-lg text-base text-limestone-100/90 md:text-lg">
                {homepageSettings.heroDescription}
              </p>
            </>
          )}
          {(homepageSettings.heroPrimaryButtonEnabled || homepageSettings.heroSecondaryButtonEnabled) && (
            <div className={`flex flex-wrap gap-4 ${homepageSettings.heroTextEnabled ? "mt-8" : ""}`}>
              {homepageSettings.heroPrimaryButtonEnabled && (
                <Button href={homepageSettings.heroPrimaryButtonUrl} variant="accent" size="lg">
                  {homepageSettings.heroPrimaryButtonLabel}
                </Button>
              )}
              {homepageSettings.heroSecondaryButtonEnabled && (
                <Button href={homepageSettings.heroSecondaryButtonUrl} variant="secondary" size="lg">
                  {homepageSettings.heroSecondaryButtonLabel}
                </Button>
              )}
            </div>
          )}

          {/* Quick browse-by-status pills — a real-estate-developer
              stand-in for the reference layout's search bar; we have
              no live property search, but jumping straight to
              Ongoing/Completed/Upcoming serves the same "get moving
              fast" purpose. */}
          {statusTiles.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {statusTiles.map((tile) => (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur transition-colors duration-200 ease-estate hover:bg-white/20"
                >
                  {tile.label} Projects
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                    {tile.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Featured listings — admin-curated at /admin/homepage; hidden if none are featured/published */}
      {homepageSettings.featuredProjectsSectionEnabled && featuredProjects.length > 0 && (
        <Section>
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <Eyebrow>Our Portfolio</Eyebrow>
                <h2 className="mt-2 text-3xl md:text-4xl">Featured Listings</h2>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-full bg-garden-700 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 ease-estate hover:bg-garden-900"
              >
                View All
                <ArrowIcon />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Company introduction */}
      {homepageSettings.introSectionEnabled && (
        <Section className="bg-limestone-200">
          <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <Eyebrow>About Us</Eyebrow>
              <h2 className="mt-2 max-w-md text-3xl md:text-4xl">{homepageSettings.introHeading}</h2>
              <RichText html={homepageSettings.introBody} className="mt-5 max-w-prose text-base text-ink-soft" />
              <div className="mt-7">
                <Button href="/about" variant="ghost">
                  About Us
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-card">
              <Image
                src={homepageSettings.introImageUrl}
                alt="Planned residential building"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Container>
        </Section>
      )}

      {/* What we develop — admin-managed at /admin/homepage, hidden if no items are published */}
      {homepageSettings.whatWeDevelopSectionEnabled && developItems.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Our Focus</Eyebrow>
            <h2 className="mt-2 max-w-md text-3xl md:text-4xl">What we develop</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {developItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-limestone-300 bg-white p-6 transition-all duration-300 ease-estate hover:-translate-y-1 hover:border-garden-300 hover:shadow-card"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${toneStyles[item.tone]}`}>
                    <ContentIcon icon={item.icon} />
                  </div>
                  <h3 className="mt-4 text-lg">{item.title}</h3>
                  <p className="mt-2 text-base text-ink-soft">{item.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Blog highlights — one large featured story plus the next few;
          hidden until at least one article is published */}
      {homepageSettings.blogSectionEnabled && featuredPost && (
        <Section className="bg-limestone-200">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <Eyebrow>The Journal</Eyebrow>
                <h2 className="mt-2 text-3xl md:text-4xl">Blog Highlights</h2>
              </div>
              <Button href="/blog" variant="ghost">
                View All Articles
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-lg shadow-card"
              >
                <Image
                  src={featuredPost.featuredImage.url}
                  alt={featuredPost.featuredImage.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-estate group-hover:scale-[1.04]"
                />
              </Link>
              <div>
                <span className="inline-flex items-center rounded-full bg-garden-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-garden-700">
                  Featured Post
                </span>
                <h3 className="mt-4 text-2xl leading-snug md:text-3xl">
                  <Link href={`/blog/${featuredPost.slug}`} className="transition-colors hover:text-garden-700">
                    {featuredPost.title}
                  </Link>
                </h3>
                <p className="mt-3 max-w-prose text-base text-ink-soft">{featuredPost.excerpt}</p>
                <p className="mt-5 text-sm text-ink-soft">
                  By {featuredPost.author} ·{" "}
                  {new Date(featuredPost.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {restPosts.length > 0 && (
              <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
                {restPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </Container>
        </Section>
      )}

      {/* Why choose Al Bustan — the site's one dark, full-bleed panel
          outside the hero and closing CTA, so it reads as a deliberate
          premium moment rather than "just another value-props list" */}
      {homepageSettings.valuePropsSectionEnabled && valuePropItems.length > 0 && (
        <Section className="bg-garden-900">
          <Container>
            <Eyebrow tone="light">Our Philosophy</Eyebrow>
            <h2 className="mt-2 max-w-md text-3xl text-white md:text-4xl">Why Choose Al Bustan</h2>
            <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
              {valuePropItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass-light">
                    <ContentIcon icon={item.icon} />
                  </div>
                  <div>
                    <h3 className="text-lg text-white">{item.title}</h3>
                    <p className="mt-2 text-base text-limestone-200/75">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Meet our team — admin-managed at /admin/team; hidden if none are published */}
      {homepageSettings.teamSectionEnabled && teamMembers.length > 0 && <TeamSection members={teamMembers} />}

      {/* Customer testimonials — admin-managed at /admin/testimonials; hidden if none are published.
          Cards float over the bottom edge of a full-bleed photo, bridging into the
          section below, rather than sitting in a plain card grid. */}
      {homepageSettings.testimonialsSectionEnabled && testimonials.length > 0 && (
        <section className="relative">
          <div className="relative h-[320px] w-full overflow-hidden md:h-[400px]">
            <Image
              src={
                featuredProjects[0]?.coverImage.url ??
                "https://images.unsplash.com/photo-1758193431351-68538bf55ec3?auto=format&fit=crop&w=1600&q=80"
              }
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8,31,20,0.85) 0%, rgba(8,31,20,0.45) 50%, rgba(8,31,20,0.2) 100%)",
              }}
            />
            <Container className="relative z-10 flex h-full flex-col items-center justify-center text-center">
              <EyebrowPill>Client Stories</EyebrowPill>
              <h2 className="mt-4 text-3xl text-white md:text-4xl">What Our Clients Say</h2>
            </Container>
          </div>

          <Container>
            <div className="relative z-10 -mt-20 grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2 md:-mt-24 md:pb-24 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="relative flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-card-hover"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-6xl leading-none text-garden-100"
                  >
                    &ldquo;
                  </span>
                  <RichText html={testimonial.text} className="-mt-5 text-base text-ink-soft" />
                  <div className="mt-6 flex items-center gap-3">
                    {testimonial.photoUrl ? (
                      <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-garden-100">
                        <Image src={testimonial.photoUrl} alt="" fill sizes="44px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-garden-100 text-sm font-semibold text-garden-700 ring-2 ring-garden-100">
                        {testimonialInitials(testimonial.customerName)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">{testimonial.customerName}</p>
                      <p className="text-xs text-ink-soft">
                        {[testimonial.designation, testimonial.projectName].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Ongoing / Completed / Upcoming overview — only statuses with at least one published project */}
      {homepageSettings.statsSectionEnabled && statusTiles.length > 0 && (
        <Section className="bg-limestone-200">
          <Container>
            <Eyebrow>By The Numbers</Eyebrow>
            <h2 className="mt-2 text-3xl md:text-4xl">Where our projects stand</h2>
            <div className="mt-10 grid grid-cols-1 divide-y divide-limestone-300 border-y border-limestone-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {statusTiles.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col gap-2 px-2 py-8 transition-colors duration-200 ease-estate hover:bg-white sm:px-8"
                >
                  <span className={`text-4xl ${item.color}`}>{item.count}</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    {item.label} Project{item.count === 1 ? "" : "s"}
                    <ArrowIcon className="transition-transform duration-200 ease-estate group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      {homepageSettings.ctaSectionEnabled && (
        <Section className="bg-garden-700">
          <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <h2 className="max-w-md text-3xl text-white md:text-4xl">
              Ready to Find Your Perfect Place?
            </h2>
            <Button href="/contact" variant="accent" size="lg">
              Talk to Our Team
            </Button>
          </Container>
        </Section>
      )}

      {/* Contact CTA */}
      <Section>
        <Container className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Eyebrow>Get In Touch</Eyebrow>
            <h2 className="mt-2 max-w-md text-3xl md:text-4xl">
              Have a question about our projects?
            </h2>
            <p className="mt-4 max-w-prose text-base text-ink-soft">
              Send us your questions and our team will reply as soon as
              possible. You can also visit our Banani office or arrange a
              site visit.
            </p>
            <div className="mt-7">
              <Button href="/contact" variant="primary">
                Get in Touch
              </Button>
            </div>
          </div>
          <div className="space-y-3 border-t border-limestone-300 pt-6 text-sm text-ink-soft md:border-l md:border-t-0 md:pl-10 md:pt-0">
            <p>{settings.address}</p>
            <p>{settings.phone}</p>
            <p>{settings.email}</p>
            <p>{settings.businessHours}</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
