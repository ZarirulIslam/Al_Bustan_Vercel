import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@/lib/types";

// Records a consequential admin action (create/update/delete/publish/
// unpublish) — a lightweight audit trail, not an exhaustive one; see
// the ActivityLog model comment in prisma/schema.prisma for scope.
// Looks up the current session itself so every call site is one line
// dropped in right after the existing requireAdmin() check, without
// having to change requireAdmin() to return/thread the session
// through every actions.ts file. A logging failure must never break
// or roll back the action it's describing, so errors are swallowed,
// not propagated.
export async function logActivity(params: {
  action: ActivityAction;
  resource: string;
  resourceId?: string;
  description: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return;

    const adminUserId = (session?.user as { id?: string } | undefined)?.id ?? null;

    await prisma.activityLog.create({
      data: {
        adminUserId,
        adminEmail: email,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        description: params.description,
      },
    });
  } catch {
    // Best-effort — never let an audit-log write failure break the
    // actual admin action it's recording.
  }
}
