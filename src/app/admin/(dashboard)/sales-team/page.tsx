import { SalesTeamTable } from "@/components/admin/SalesTeamTable";
import { Button } from "@/components/ui/Button";
import { getAllSalesEmployeesAdmin } from "@/lib/admin/salesTeam";

export const dynamic = "force-dynamic";

export default async function AdminSalesTeamPage() {
  const employees = await getAllSalesEmployeesAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">Sales Team</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Manage sales employees who leads can be assigned to.
          </p>
        </div>
        <Button href="/admin/sales-team/new">Add Sales Employee</Button>
      </div>

      <div className="mt-8">
        <SalesTeamTable employees={employees} />
      </div>
    </div>
  );
}
