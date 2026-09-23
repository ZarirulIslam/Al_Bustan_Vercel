import { TestimonialTable } from "@/components/admin/TestimonialTable";
import { Button } from "@/components/ui/Button";
import { getAllTestimonialsAdmin } from "@/lib/admin/testimonials";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const testimonials = await getAllTestimonialsAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">Testimonials</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Customer quotes shown on the homepage. Use the arrows to reorder.
          </p>
        </div>
        <Button href="/admin/testimonials/new">Add Testimonial</Button>
      </div>

      <div className="mt-8">
        <TestimonialTable testimonials={testimonials} />
      </div>
    </div>
  );
}
