import { prisma } from "@/lib/prisma";
import { defaultAboutPageSettings } from "@/lib/constants";
import type { AboutPageSettings } from "@/lib/types";
import type { AboutPageSettings as PrismaAboutPageSettings } from "@prisma/client";

function mapAboutPageSettings(row: PrismaAboutPageSettings): AboutPageSettings {
  return {
    heroEyebrow: row.heroEyebrow,
    heroHeading: row.heroHeading,
    heroParagraph: row.heroParagraph,
    heroImageUrl: row.heroImageUrl,
    overviewParagraph: row.overviewParagraph,
    overviewImageUrl: row.overviewImageUrl,
    visionParagraph: row.visionParagraph,
    portfolioParagraph: row.portfolioParagraph,
    ctaHeading: row.ctaHeading,
  };
}

// Falls back to the placeholder defaults if the settings row hasn't
// been created yet — same convention as getSiteSettings/getHomepageSettings.
export async function getAboutPageSettings(): Promise<AboutPageSettings> {
  const row = await prisma.aboutPageSettings.findUnique({ where: { id: "singleton" } });
  return row ? mapAboutPageSettings(row) : defaultAboutPageSettings;
}
