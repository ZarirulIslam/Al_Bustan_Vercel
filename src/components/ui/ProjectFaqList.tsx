import type { ProjectFaq } from "@/lib/types";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

// Read-only display shown on the public project detail page — admin
// management lives at /admin/projects/[id]/edit (see ProjectFaqManager).
// Renders the shared FaqAccordion so per-project FAQs collapse/expand
// the same way as the site-wide FAQ on the Contact page. Only
// published FAQs, already in display order, ever reach this component
// (see getPublishedFaqsForProject).
export function ProjectFaqList({ faqs }: { faqs: ProjectFaq[] }) {
  if (faqs.length === 0) return null;

  return <FaqAccordion items={faqs} />;
}
