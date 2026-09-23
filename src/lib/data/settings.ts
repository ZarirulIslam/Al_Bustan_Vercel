import { prisma } from "@/lib/prisma";
import { defaultSiteSettings } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import type { WebsiteSettings } from "@prisma/client";

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
