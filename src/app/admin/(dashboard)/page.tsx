import Link from "next/link";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { ProjectMixDonut } from "@/components/admin/ProjectMixDonut";
import { LeadPipeline } from "@/components/admin/LeadPipeline";
import { Button } from "@/components/ui/Button";
import { getProjectCounts } from "@/lib/admin/projects";
import { getBlogCounts } from "@/lib/admin/blog";
import { getInquiryCounts } from "@/lib/admin/inquiries";
import { getSalesEmployeeCounts } from "@/lib/admin/salesTeam";
import { getSiteSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

const quickLinks = [
  { label: "Manage Projects", href: "/admin/projects" },
  { label: "Manage Blog", href: "/admin/blog" },
  { label: "Manage Gallery", href: "/admin/gallery" },
  { label: "Manage Homepage", href: "/admin/homepage" },
  { label: "Manage Homepage Hero", href: "/admin/hero" },
  { label: "View Inquiries", href: "/admin/inquiries" },
  { label: "Manage Sales Team", href: "/admin/sales-team" },
  { label: "Website Settings", href: "/admin/settings" },
  { label: "View Public Projects Page ↗", href: "/projects", external: true },
  { label: "View Public Blog Page ↗", href: "/blog", external: true },
];

function SectionHeader({ title, manageHref }: { title: string; manageHref: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h2>
      <Link
        href={manageHref}
        className="text-sm font-medium text-garden-700 transition-colors duration-200 ease-estate hover:text-garden-600 hover:underline"
      >
        Manage {title} →
      </Link>
    </div>
  );
}

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

function HeroStatIcon({ icon }: { icon: "projects" | "leads" | "blog" | "team" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  switch (icon) {
    case "projects":
      return (
        <svg {...common}>
          <path d="M3 20V10l9-6 9 6v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 20v-7h6v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "leads":
      return (
        <svg {...common}>
          <path d="M4 5.5h16v10a1 1 0 0 1-1 1H9l-4 3.5v-3.5H5a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 9.5h8M8 12.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "blog":
      return (
        <svg {...common}>
          <path d="M5 4h11l3 3v13H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 10h6M9 13.5h6M9 17h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "team":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 8.5a2.6 2.6 0 1 0 0-5.2M15 13.2c2.4.4 4.4 1.9 5 3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

// Greeting is computed against the business's own timezone (Dhaka),
// not the server's — this app can run on infrastructure anywhere, but
// "morning" should mean morning in Bangladesh, not in whatever region
// happens to host the deployment.
function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboardPage() {
  const [projectCounts, blogCounts, inquiryCounts, salesEmployeeCounts, settings] = await Promise.all([
    getProjectCounts(),
    getBlogCounts(),
    getInquiryCounts(),
    getSalesEmployeeCounts(),
    getSiteSettings(),
  ]);

  return (
    <div>
      {/* Welcome hero — the same dark deep-green glass-card language as
          the public site's "Why Choose Al Bustan" panel, so the admin
          and the public site read as one system rather than two. */}
      <section className="relative overflow-hidden rounded-2xl bg-garden-900 p-6 md:p-10">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-limestone-200/70">{getGreeting()}</p>
            <h1 className="mt-2 font-display text-3xl text-white md:text-4xl">Welcome back</h1>
            <p className="mt-2 max-w-md text-sm text-limestone-200/75">
              Here&apos;s what&apos;s happening across {settings.companyName} today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/admin/projects/new" variant="accent">
              Add Project
            </Button>
            <Button href="/admin/blog/new" variant="secondary">
              Add Blog Post
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Projects", value: projectCounts.total, icon: "projects" as const },
            { label: "Total Leads", value: inquiryCounts.total, icon: "leads" as const },
            { label: "Total Articles", value: blogCounts.total, icon: "blog" as const },
            { label: "Sales Team", value: salesEmployeeCounts.active, icon: "team" as const },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brass/20 text-brass-light">
                <HeroStatIcon icon={stat.icon} />
              </div>
              <p className="mt-3 font-display text-2xl text-white">{stat.value}</p>
              <p className="text-xs text-limestone-200/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project mix + lead pipeline — built entirely from the real
          counts above, not illustrative/placeholder chart data. */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-limestone-300 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Project Mix</h2>
            <Link href="/admin/projects" className="text-sm font-medium text-garden-700 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="mt-6">
            <ProjectMixDonut
              total={projectCounts.total}
              centerLabel="Projects"
              segments={[
                { label: "Ongoing", value: projectCounts.ongoing, strokeClass: "stroke-garden-500", dotClass: "bg-garden-500" },
                { label: "Completed", value: projectCounts.completed, strokeClass: "stroke-sky", dotClass: "bg-sky" },
                { label: "Upcoming", value: projectCounts.upcoming, strokeClass: "stroke-brass", dotClass: "bg-brass" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-limestone-300 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Lead Pipeline</h2>
            <Link href="/admin/inquiries" className="text-sm font-medium text-garden-700 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="mt-6">
            <LeadPipeline
              stages={[
                { label: "New", value: inquiryCounts.new, barClass: "bg-garden-500" },
                { label: "Contacted", value: inquiryCounts.contacted, barClass: "bg-brass" },
                { label: "Follow-up", value: inquiryCounts.followUp, barClass: "bg-sky" },
                { label: "Converted", value: inquiryCounts.converted, barClass: "bg-garden-700" },
                { label: "Closed", value: inquiryCounts.closed, barClass: "bg-ink-soft/40" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <SectionHeader title="Projects" manageHref="/admin/projects" />
        <div className="mt-4">
          <DashboardStats
            stats={[
              { label: "Total Projects", value: projectCounts.total, tone: "garden" },
              { label: "Ongoing", value: projectCounts.ongoing, tone: "garden" },
              { label: "Completed", value: projectCounts.completed, tone: "sky" },
              { label: "Upcoming", value: projectCounts.upcoming, tone: "brass" },
              { label: "Published", value: projectCounts.published, tone: "garden" },
              { label: "Unpublished", value: projectCounts.unpublished, tone: "neutral" },
            ]}
          />
        </div>
      </div>

      <div className="mt-10">
        <SectionHeader title="Blog" manageHref="/admin/blog" />
        <div className="mt-4">
          <DashboardStats
            stats={[
              { label: "Total Articles", value: blogCounts.total, tone: "garden" },
              { label: "Published", value: blogCounts.published, tone: "garden" },
              { label: "Unpublished", value: blogCounts.unpublished, tone: "neutral" },
            ]}
          />
        </div>
      </div>

      <div className="mt-10">
        <SectionHeader title="Leads & Inquiries" manageHref="/admin/inquiries" />
        <div className="mt-4">
          <DashboardStats
            stats={[
              { label: "Total Leads", value: inquiryCounts.total, tone: "garden" },
              { label: "New", value: inquiryCounts.new, tone: "garden" },
              { label: "Contacted", value: inquiryCounts.contacted, tone: "brass" },
              { label: "Follow-up", value: inquiryCounts.followUp, tone: "sky" },
              { label: "Converted", value: inquiryCounts.converted, tone: "garden" },
              { label: "Closed", value: inquiryCounts.closed, tone: "neutral" },
            ]}
          />
        </div>
        <div className="mt-4">
          <DashboardStats
            stats={[
              { label: "Follow-ups Due Today", value: inquiryCounts.followUpsDueToday, tone: "brass" },
              { label: "Follow-ups Overdue", value: inquiryCounts.followUpsOverdue, tone: "danger" },
              { label: "Unassigned Leads", value: inquiryCounts.unassigned, tone: "neutral" },
            ]}
          />
        </div>
      </div>

      <div className="mt-10">
        <SectionHeader title="Sales Team" manageHref="/admin/sales-team" />
        <div className="mt-4">
          <DashboardStats
            stats={[
              { label: "Total Sales Employees", value: salesEmployeeCounts.total, tone: "garden" },
              { label: "Active", value: salesEmployeeCounts.active, tone: "garden" },
              { label: "Inactive", value: salesEmployeeCounts.inactive, tone: "neutral" },
            ]}
          />
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-limestone-300 bg-white p-6 shadow-card">
        <h2 className="text-lg">Quick Links</h2>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              className="group flex items-center justify-between gap-2 rounded-xl border border-limestone-300 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors duration-200 ease-estate hover:border-garden-300 hover:bg-garden-50 hover:text-garden-700"
            >
              {link.label}
              <ArrowIcon className="flex-shrink-0 text-garden-500 transition-transform duration-200 ease-estate group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
