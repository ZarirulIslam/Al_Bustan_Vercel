import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingContactWidget } from "@/components/ui/FloatingContactWidget";
import { getSiteSettings } from "@/lib/data/settings";
import { getProjectsByStatus } from "@/lib/data/projects";
import { getAllPublishedPosts } from "@/lib/data/blog";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, completedProjects, upcomingProjects, posts] = await Promise.all([
    getSiteSettings(),
    getProjectsByStatus("completed"),
    getProjectsByStatus("upcoming"),
    getAllPublishedPosts(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        settings={settings}
        hasCompletedProjects={completedProjects.length > 0}
        hasUpcomingProjects={upcomingProjects.length > 0}
        hasBlogPosts={posts.length > 0}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingContactWidget settings={settings} />
    </div>
  );
}
