import { SalesTeamForm } from "@/components/admin/SalesTeamForm";
import { createSalesEmployee } from "@/app/admin/(dashboard)/sales-team/actions";

export default function NewSalesEmployeePage() {
  return (
    <div>
      <h1 className="text-3xl">Add Sales Employee</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Add a sales team member so leads can be assigned to them.
      </p>

      <div className="mt-8 max-w-2xl">
        <SalesTeamForm action={createSalesEmployee} submitLabel="Add Sales Employee" />
      </div>
    </div>
  );
}
