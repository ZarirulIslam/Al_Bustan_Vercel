"use client";

import type { SalesEmployee } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toggleSalesEmployeeActive } from "@/app/admin/(dashboard)/sales-team/actions";
import { useAdminAction } from "@/components/admin/AdminToaster";

export function SalesTeamTable({ employees }: { employees: SalesEmployee[] }) {
  const { run, isPending } = useAdminAction();

  if (employees.length === 0) {
    return (
      <EmptyState
        title="No sales employees yet"
        description='Click "Add Sales Employee" to add the first one.'
        action={<Button href="/admin/sales-team/new">Add Sales Employee</Button>}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3.5 font-semibold">Name</th>
            <th className="px-4 py-3.5 font-semibold">Designation</th>
            <th className="px-4 py-3.5 font-semibold">Phone</th>
            <th className="px-4 py-3.5 font-semibold">Email</th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
            >
              <td className="px-4 py-3.5 font-medium text-ink">{employee.name}</td>
              <td className="px-4 py-3.5 text-ink-soft">{employee.designation}</td>
              <td className="px-4 py-3.5 text-ink-soft">{employee.phone}</td>
              <td className="px-4 py-3.5 text-ink-soft">{employee.email}</td>
              <td className="px-4 py-3.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    run(() => toggleSalesEmployeeActive(employee.id, !employee.active), employee.active ? "Sales employee deactivated." : "Sales employee activated.")
                  }
                  className={
                    employee.active
                      ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                      : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${employee.active ? "bg-garden-500" : "bg-ink-soft/50"}`}
                  />
                  {employee.active ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-2">
                  <Button href={`/admin/sales-team/${employee.id}/edit`} variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
