import { prisma } from "@/lib/prisma";
import { defaultSiteSettings } from "@/lib/constants";
import type { FooterOffice, SiteSettings } from "@/lib/types";
import type { WebsiteSettings } from "@prisma/client";

// footerOffices is a JSON column — keep only well-formed entries.
function parseOffices(value: unknown): FooterOffice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((o) =>
    o && typeof o === "object" && typeof (o as FooterOffice).name === "string" && typeof (o as FooterOffice).address === "string"
      ? [{ name: (o as FooterOffice).name, address: (o as FooterOffice).address }]
      : []
  );
}

function mapSettings(row: WebsiteSettings): SiteSettings {
  return {
    companyName: row.companyName,
    logoUrl: row.logoUrl,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    businessHours: row.businessHours,
    messengerUrl: row.messengerUrl,
    social: {
      facebook: row.facebookUrl ?? undefined,
      instagram: row.instagramUrl ?? undefined,
      linkedin: row.linkedinUrl ?? undefined,
      youtube: row.youtubeUrl ?? undefined,
    },
    seo: {
      defaultTitle: row.seoTitle,
      defaultDescription: row.seoDescription,
    },
    companyDescription: row.companyDescription,
    footerLegalText: row.footerLegalText,
    footerOffices: parseOffices(row.footerOffices),
    footerPhones: row.footerPhones,
    footerEmails: row.footerEmails,
    website: row.website,
  };
}

// Falls back to the placeholder defaults if the settings row hasn't
// been created yet (fresh database before seeding, or before the
// admin has saved settings once) — the site should never break just
// because /admin/settings hasn't been visited yet.
export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.websiteSettings.findUnique({ where: { id: "singleton" } });
  return row ? mapSettings(row) : defaultSiteSettings;
}
