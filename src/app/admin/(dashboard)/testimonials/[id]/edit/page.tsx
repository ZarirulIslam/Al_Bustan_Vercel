import { notFound } from "next/navigation";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { updateTestimonial } from "@/app/admin/(dashboard)/testimonials/actions";
import { getTestimonialByIdAdmin, getProjectOptionsForTestimonials } from "@/lib/admin/testimonials";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [testimonial, projects] = await Promise.all([
    getTestimonialByIdAdmin(id),
    getProjectOptionsForTestimonials(),
  ]);
  if (!testimonial) notFound();

  const boundUpdate = updateTestimonial.bind(null, testimonial.id);

  return (
    <div>
      <h1 className="text-3xl">Edit Testimonial</h1>
      <p className="mt-1 text-sm text-ink-soft">{testimonial.customerName}</p>

      <div className="mt-8 max-w-2xl">
        <TestimonialForm
          action={boundUpdate}
          testimonial={testimonial}
          projects={projects}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
