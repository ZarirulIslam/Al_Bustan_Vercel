import { prisma } from "@/lib/prisma";
import type { SalesEmployee } from "@/lib/types";

// A flat entity mapped 1:1 from the Prisma row (dates stringified) —
// no separate mapper needed, unlike ContactInquiry/BlogPost which
// pull in related records.
function mapSalesEmployee(row: {
  id: string;
  name: string;
  phone: string;
  email: string;
  designation: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SalesEmployee {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    designation: row.designation,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAllSalesEmployeesAdmin(): Promise<SalesEmployee[]> {
  const rows = await prisma.salesEmployee.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapSalesEmployee);
}

export async function getSalesEmployeeByIdAdmin(id: string): Promise<SalesEmployee | null> {
  const row = await prisma.salesEmployee.findUnique({ where: { id } });
  return row ? mapSalesEmployee(row) : null;
}

export async function getSalesEmployeeCounts() {
  const [total, active] = await Promise.all([
    prisma.salesEmployee.count(),
    prisma.salesEmployee.count({ where: { active: true } }),
  ]);
  return { total, active, inactive: total - active };
}
