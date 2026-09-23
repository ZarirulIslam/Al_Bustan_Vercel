"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { redirectFormSchema, type RedirectFormState } from "@/lib/admin/redirectSchema";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated.");
}

// /admin and /api are never checked by proxy.ts's redirect lookup
// (it explicitly excludes them — see proxy.ts's matcher), so a
// redirect rule for either would silently never fire. Rejecting it
// here avoids an admin creating one and wondering why it does
// nothing.
function isReservedPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path === "/api" || path.startsWith("/api/");
}

function validateRedirectPaths(fromPath: string, toPath: string): string | null {
  if (isReservedPath(fromPath)) {
    return "Can't redirect an /admin or /api path — those are never checked for redirects.";
  }
  if (fromPath === toPath) {
    return "The destination can't be the same as the source path.";
  }
  return null;
}

export async function createRedirect(
  _prevState: RedirectFormState,
  formData: FormData
): Promise<RedirectFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = redirectFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: RedirectFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const pathError = validateRedirectPaths(data.fromPath, data.toPath);
  if (pathError) return { fieldErrors: { fromPath: pathError } };

  const existing = await prisma.redirect.findUnique({ where: { fromPath: data.fromPath } });
  if (existing) {
    return { fieldErrors: { fromPath: "A redirect from this path already exists." } };
  }

  const rule = await prisma.redirect.create({
    data: {
      fromPath: data.fromPath,
      toPath: data.toPath,
      kind: data.kind,
      enabled: data.enabled === "on",
    },
  });

  await logActivity({
    action: "created",
    resource: "Redirect",
    resourceId: rule.id,
    description: `Created redirect from "${rule.fromPath}" to "${rule.toPath}"`,
  });

  revalidatePath("/admin/redirects");
  redirect("/admin/redirects");
}

export async function updateRedirect(
  id: string,
  _prevState: RedirectFormState,
  formData: FormData
): Promise<RedirectFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = redirectFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: RedirectFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const pathError = validateRedirectPaths(data.fromPath, data.toPath);
  if (pathError) return { fieldErrors: { fromPath: pathError } };

  const existing = await prisma.redirect.findUnique({ where: { id } });
  if (!existing) return { error: "Redirect not found." };

  if (data.fromPath !== existing.fromPath) {
    const taken = await prisma.redirect.findUnique({ where: { fromPath: data.fromPath } });
    if (taken) return { fieldErrors: { fromPath: "A redirect from this path already exists." } };
  }

  await prisma.redirect.update({
    where: { id },
    data: {
      fromPath: data.fromPath,
      toPath: data.toPath,
      kind: data.kind,
      enabled: data.enabled === "on",
    },
  });

  await logActivity({
    action: "updated",
    resource: "Redirect",
    resourceId: id,
    description: `Updated redirect from "${data.fromPath}" to "${data.toPath}"`,
  });

  revalidatePath("/admin/redirects");
  redirect("/admin/redirects");
}

export async function deleteRedirect(id: string) {
  await requireAdmin();
  const rule = await prisma.redirect.delete({ where: { id } }).catch(() => null);
  if (rule) {
    await logActivity({
      action: "deleted",
      resource: "Redirect",
      resourceId: id,
      description: `Deleted redirect from "${rule.fromPath}"`,
    });
  }
  revalidatePath("/admin/redirects");
}

export async function toggleRedirectEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  const rule = await prisma.redirect.update({ where: { id }, data: { enabled } });
  await logActivity({
    action: enabled ? "published" : "unpublished",
    resource: "Redirect",
    resourceId: id,
    description: `${enabled ? "Enabled" : "Disabled"} redirect from "${rule.fromPath}"`,
  });
  revalidatePath("/admin/redirects");
}
