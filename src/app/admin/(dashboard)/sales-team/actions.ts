"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { salesEmployeeFormSchema, type SalesEmployeeFormState } from "@/lib/admin/salesTeamSchema";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated.");
}

function revalidateSalesTeamPages() {
  revalidatePath("/admin/sales-team");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

export async function createSalesEmployee(
  _prevState: SalesEmployeeFormState,
  formData: FormData
): Promise<SalesEmployeeFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = salesEmployeeFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: SalesEmployeeFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existingEmail = await prisma.salesEmployee.findUnique({ where: { email: data.email } });
  if (existingEmail) {
    return { fieldErrors: { email: "This email is already in use by another sales employee." } };
  }

  const employee = await prisma.salesEmployee.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      designation: data.designation,
      active: data.active === "on",
    },
  });

  await logActivity({
    action: "created",
    resource: "SalesEmployee",
    resourceId: employee.id,
    description: `Added sales employee "${employee.name}"`,
  });

  revalidateSalesTeamPages();
  redirect("/admin/sales-team");
}

export async function updateSalesEmployee(
  id: string,
  _prevState: SalesEmployeeFormState,
  formData: FormData
): Promise<SalesEmployeeFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = salesEmployeeFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: SalesEmployeeFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.salesEmployee.findUnique({ where: { id } });
  if (!existing) return { error: "Sales employee not found." };

  if (data.email !== existing.email) {
    const emailTaken = await prisma.salesEmployee.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      return { fieldErrors: { email: "This email is already in use by another sales employee." } };
    }
  }

  await prisma.salesEmployee.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      designation: data.designation,
      active: data.active === "on",
    },
  });

  await logActivity({
    action: "updated",
    resource: "SalesEmployee",
    resourceId: id,
    description: `Updated sales employee "${data.name}"`,
  });

  revalidateSalesTeamPages();
  redirect("/admin/sales-team");
}

export async function toggleSalesEmployeeActive(id: string, active: boolean) {
  await requireAdmin();
  const employee = await prisma.salesEmployee.update({ where: { id }, data: { active } });
  await logActivity({
    action: active ? "published" : "unpublished",
    resource: "SalesEmployee",
    resourceId: id,
    description: `${active ? "Activated" : "Deactivated"} sales employee "${employee.name}"`,
  });
  revalidateSalesTeamPages();
}
