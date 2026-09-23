import { prisma } from "@/lib/prisma";
import { mapPaymentPlan } from "@/lib/data/mapPaymentPlan";
import type { PaymentPlan } from "@/lib/types";

// Public, enabled-only data access — mirrors src/lib/data/hero.ts's
// getPublishedHeroSlides. Admin CRUD (including disabled plans) lives
// separately in src/lib/admin/paymentPlans.ts.
export async function getEnabledPaymentPlansForProject(projectId: string): Promise<PaymentPlan[]> {
  const rows = await prisma.paymentPlan.findMany({
    where: { projectId, enabled: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapPaymentPlan);
}
