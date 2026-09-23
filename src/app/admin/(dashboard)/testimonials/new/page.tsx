import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { createTestimonial } from "@/app/admin/(dashboard)/testimonials/actions";
import { getProjectOptionsForTestimonials } from "@/lib/admin/testimonials";

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage() {
  const projects = await getProjectOptionsForTestimonials();

  return (
    <div>
      <h1 className="text-3xl">Add Testimonial</h1>
      <p className="mt-1 text-sm text-ink-soft">Add a customer quote to show on the homepage.</p>

      <div className="mt-8 max-w-2xl">
        <TestimonialForm action={createTestimonial} projects={projects} submitLabel="Add Testimonial" />
      </div>
    </div>
  );
}
