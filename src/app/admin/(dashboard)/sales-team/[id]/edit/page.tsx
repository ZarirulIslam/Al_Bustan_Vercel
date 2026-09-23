import { notFound } from "next/navigation";
import { SalesTeamForm } from "@/components/admin/SalesTeamForm";
import { updateSalesEmployee } from "@/app/admin/(dashboard)/sales-team/actions";
import { getSalesEmployeeByIdAdmin } from "@/lib/admin/salesTeam";

export const dynamic = "force-dynamic";

export default async function EditSalesEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getSalesEmployeeByIdAdmin(id);
  if (!employee) notFound();

  const boundUpdate = updateSalesEmployee.bind(null, employee.id);

  return (
    <div>
      <h1 className="text-3xl">Edit Sales Employee</h1>
      <p className="mt-1 text-sm text-ink-soft">{employee.name}</p>

      <div className="mt-8 max-w-2xl">
        <SalesTeamForm action={boundUpdate} employee={employee} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
