import { prisma } from "@/lib/prisma";
import { mapPaymentPlan } from "@/lib/data/mapPaymentPlan";
import type { PaymentPlan } from "@/lib/types";

export async function getPaymentPlansForProjectAdmin(projectId: string): Promise<PaymentPlan[]> {
  const rows = await prisma.paymentPlan.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapPaymentPlan);
}
