"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { redirectWithFlash } from "@/lib/admin/flash";
import { teamMemberFormSchema, type TeamMemberFormState } from "@/lib/admin/teamMemberSchema";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("team");
}

// Photo is optional — an empty string just means "no photo" (initials
// are shown instead), not an error.
function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/");
}

// Team members appear on both the homepage and the About page.
function revalidateTeamPages() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin/team");
}

export async function createTeamMember(
  _prevState: TeamMemberFormState,
  formData: FormData
): Promise<TeamMemberFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = teamMemberFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: TeamMemberFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const photoUrl = String(formData.get("photoUrl") || "");

  const last = await prisma.teamMember.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const member = await prisma.teamMember.create({
    data: {
      name: data.name,
      designation: data.designation,
      shortTitle: data.shortTitle,
      bio: data.bio,
      photoUrl: isPlausibleImageUrl(photoUrl) ? photoUrl : null,
      published: data.published === "on",
      order: nextOrder,
    },
  });

  await logActivity({
    action: "created",
    resource: "TeamMember",
    resourceId: member.id,
    description: `Added team member "${member.name}"`,
  });

  revalidateTeamPages();
  return redirectWithFlash("/admin/team", `Team member "${member.name}" added.`);
}

export async function updateTeamMember(
  id: string,
  _prevState: TeamMemberFormState,
  formData: FormData
): Promise<TeamMemberFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = teamMemberFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: TeamMemberFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) return { error: "Team member not found." };

  const rawPhotoUrl = String(formData.get("photoUrl") || "");
  const newPhotoUrl = isPlausibleImageUrl(rawPhotoUrl) ? rawPhotoUrl : undefined;

  await prisma.teamMember.update({
    where: { id },
    data: {
      name: data.name,
      designation: data.designation,
      shortTitle: data.shortTitle,
      bio: data.bio,
      ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
      published: data.published === "on",
    },
  });

  if (newPhotoUrl && existing.photoUrl && existing.photoUrl !== newPhotoUrl) {
    await deleteImage(existing.photoUrl);
  }

  await logActivity({
    action: "updated",
    resource: "TeamMember",
    resourceId: id,
    description: `Updated team member "${data.name}"`,
  });

  revalidateTeamPages();
  return redirectWithFlash("/admin/team", `Team member "${data.name}" saved.`);
}

export async function deleteTeamMember(id: string) {
  await requireAdmin();
  const member = await prisma.teamMember.delete({ where: { id } }).catch(() => null);
  if (member) {
    if (member.photoUrl) await deleteImage(member.photoUrl);
    await logActivity({
      action: "deleted",
      resource: "TeamMember",
      resourceId: id,
      description: `Deleted team member "${member.name}"`,
    });
  }
  revalidateTeamPages();
}

export async function toggleTeamMemberPublished(id: string, published: boolean) {
  await requireAdmin();
  const member = await prisma.teamMember.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "TeamMember",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} team member "${member.name}"`,
  });
  revalidateTeamPages();
}

// Same order-swap pattern as Testimonial/HeroSlide — swaps `order`
// with the immediate neighbor in the sorted list.
export async function moveTeamMember(id: string, direction: "up" | "down") {
  await requireAdmin();

  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= members.length) return;

  const current = members[index];
  const neighbor = members[swapIndex];

  await prisma.$transaction([
    prisma.teamMember.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.teamMember.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateTeamPages();
}

// Section-level visibility, independent per page. These write the same
// fields as the checkboxes in the Homepage and About Page settings
// forms, so either place can be used. Member data is shared; only
// whether the section is displayed differs per page.
export async function setTeamSectionVisibility(page: "home" | "about", enabled: boolean) {
  await requireAdmin();

  if (page === "home") {
    await prisma.homepageSettings.upsert({
      where: { id: "singleton" },
      update: { teamSectionEnabled: enabled },
      create: { id: "singleton", teamSectionEnabled: enabled },
    });
    revalidatePath("/admin/homepage");
  } else {
    await prisma.aboutPageSettings.upsert({
      where: { id: "singleton" },
      update: { teamSectionEnabled: enabled },
      create: { id: "singleton", teamSectionEnabled: enabled },
    });
    revalidatePath("/admin/about");
  }

  const label = page === "home" ? "homepage" : "About page";
  await logActivity({
    action: "updated",
    resource: page === "home" ? "HomepageSettings" : "AboutPageSettings",
    resourceId: "singleton",
    description: `${enabled ? "Showed" : "Hid"} the team section on the ${label}`,
  });

  revalidateTeamPages();
}
