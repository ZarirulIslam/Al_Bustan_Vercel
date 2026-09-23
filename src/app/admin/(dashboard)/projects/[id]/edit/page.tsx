import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { PaymentPlanManager } from "@/components/admin/PaymentPlanManager";
import { ProjectFaqManager } from "@/components/admin/ProjectFaqManager";
import { updateProject } from "@/app/admin/(dashboard)/projects/actions";
import { getProjectByIdAdmin } from "@/lib/admin/projects";
import { getInventoryForProject } from "@/lib/data/inventory";
import { getPaymentPlansForProjectAdmin } from "@/lib/admin/paymentPlans";
import { getFaqsForProjectAdmin } from "@/lib/admin/projectFaqs";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectByIdAdmin(id);
  if (!project) notFound();

  const boundUpdate = updateProject.bind(null, project.id);
  const inventory = await getInventoryForProject(project.id);
  const inventoryLabel = project.category === "flat" ? "Unit" : "Plot";
  const [paymentPlans, faqs] = await Promise.all([
    getPaymentPlansForProjectAdmin(project.id),
    getFaqsForProjectAdmin(project.id),
  ]);

  return (
    <div>
      <h1 className="text-3xl">Edit Project</h1>
      <p className="mt-1 text-sm text-ink-soft">{project.name}</p>

      <div className="mt-8 max-w-3xl">
        <ProjectForm action={boundUpdate} project={project} submitLabel="Save Changes" />
      </div>

      <div className="mt-12 max-w-3xl border-t border-limestone-300 pt-10">
        <h2 className="text-xl">{inventoryLabel} Inventory</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Track individual {inventoryLabel.toLowerCase()}s for this project — add, edit, search,
          filter and update availability. This appears on the public project page.
        </p>
        <div className="mt-6">
          <InventoryManager projectId={project.id} category={project.category} items={inventory} />
        </div>
      </div>

      <div className="mt-12 max-w-3xl border-t border-limestone-300 pt-10">
        <h2 className="text-xl">Payment Plans</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Add booking amount, down payment and installment details. Enabled plans appear on the
          public project page.
        </p>
        <div className="mt-6">
          <PaymentPlanManager projectId={project.id} plans={paymentPlans} />
        </div>
      </div>

      <div className="mt-12 max-w-3xl border-t border-limestone-300 pt-10">
        <h2 className="text-xl">Project FAQ</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Add frequently asked questions for this project. Only published FAQs, in the order shown
          below, appear on the public project page.
        </p>
        <div className="mt-6">
          <ProjectFaqManager projectId={project.id} faqs={faqs} />
        </div>
      </div>
    </div>
  );
}
