import type { PaymentPlan as PrismaPaymentPlan } from "@prisma/client";
import type { PaymentPlan } from "@/lib/types";

export function mapPaymentPlan(row: PrismaPaymentPlan): PaymentPlan {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    bookingAmount: row.bookingAmount,
    downPayment: row.downPayment,
    installmentInfo: row.installmentInfo,
    description: row.description,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
