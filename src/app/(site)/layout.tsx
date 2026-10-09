import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingContactWidget } from "@/components/ui/FloatingContactWidget";
import { getSiteSettings } from "@/lib/data/settings";
import { getAllPublishedProjects } from "@/lib/data/projects";
import { getAllPublishedPosts } from "@/lib/data/blog";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, projects, posts] = await Promise.all([
    getSiteSettings(),
    getAllPublishedProjects(),
    getAllPublishedPosts(),
  ]);

  // Navbar "Projects" menu: Land and Apartment projects listed separately.
  const toLink = (p: (typeof projects)[number]) => ({ name: p.name, href: `/projects/${p.slug}` });
  const projectMenu = {
    land: projects.filter((p) => p.category === "land_plot").map(toLink),
    apartments: projects.filter((p) => p.category === "flat").map(toLink),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar settings={settings} projectMenu={projectMenu} hasBlogPosts={posts.length > 0} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} projectMenu={projectMenu} hasBlogPosts={posts.length > 0} />
      <FloatingContactWidget settings={settings} />
    </div>
  );
}
