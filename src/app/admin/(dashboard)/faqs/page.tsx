import { SiteFaqManager } from "@/components/admin/SiteFaqManager";
import { getSiteFaqsAdmin } from "@/lib/admin/siteFaqs";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const faqs = await getSiteFaqsAdmin();

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">FAQs</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Frequently asked questions shown on the public Contact page, in the order shown below.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SiteFaqManager faqs={faqs} />
      </div>
    </div>
  );
}
