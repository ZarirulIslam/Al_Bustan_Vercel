import type { MetadataRoute } from "next";
import { getAllPublishedProjects } from "@/lib/data/projects";
import { getAllPublishedPosts } from "@/lib/data/blog";
import { getBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/projects/ongoing`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/projects/completed`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/projects/upcoming`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/gallery`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const [projects, posts] = await Promise.all([
    getAllPublishedProjects(),
    getAllPublishedPosts(),
  ]);

  // A noindex'd project/post shouldn't be listed in the sitemap —
  // submitting a URL search engines are also told not to index is a
  // known SEO anti-pattern.
  const projectPages: MetadataRoute.Sitemap = projects
    .filter((project) => !project.noIndex)
    .map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => !post.noIndex)
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticPages, ...projectPages, ...blogPages];
}
