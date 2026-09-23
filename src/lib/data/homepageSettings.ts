import { prisma } from "@/lib/prisma";
import { defaultHomepageSettings } from "@/lib/constants";
import type { HomepageSettings } from "@/lib/types";
import type { HomepageSettings as PrismaHomepageSettings } from "@prisma/client";

function mapHomepageSettings(row: PrismaHomepageSettings): HomepageSettings {
  return {
    heroTextEnabled: row.heroTextEnabled,
    heroEyebrow: row.heroEyebrow,
    heroHeadline: row.heroHeadline,
    heroDescription: row.heroDescription,
    heroPrimaryButtonEnabled: row.heroPrimaryButtonEnabled,
    heroPrimaryButtonLabel: row.heroPrimaryButtonLabel,
    heroPrimaryButtonUrl: row.heroPrimaryButtonUrl,
    heroSecondaryButtonEnabled: row.heroSecondaryButtonEnabled,
    heroSecondaryButtonLabel: row.heroSecondaryButtonLabel,
    heroSecondaryButtonUrl: row.heroSecondaryButtonUrl,
    statsSectionEnabled: row.statsSectionEnabled,
    ongoingStatLabel: row.ongoingStatLabel,
    ongoingStatEnabled: row.ongoingStatEnabled,
    completedStatLabel: row.completedStatLabel,
    completedStatEnabled: row.completedStatEnabled,
    upcomingStatLabel: row.upcomingStatLabel,
    upcomingStatEnabled: row.upcomingStatEnabled,
    introSectionEnabled: row.introSectionEnabled,
    whatWeDevelopSectionEnabled: row.whatWeDevelopSectionEnabled,
    featuredProjectsSectionEnabled: row.featuredProjectsSectionEnabled,
    valuePropsSectionEnabled: row.valuePropsSectionEnabled,
    testimonialsSectionEnabled: row.testimonialsSectionEnabled,
    ctaSectionEnabled: row.ctaSectionEnabled,
    blogSectionEnabled: row.blogSectionEnabled,
    introHeading: row.introHeading,
    introBody: row.introBody,
    introImageUrl: row.introImageUrl,
  };
}

// Falls back to defaults (everything visible) if the settings row
// hasn't been created yet — same convention as getSiteSettings.
export async function getHomepageSettings(): Promise<HomepageSettings> {
  const row = await prisma.homepageSettings.findUnique({ where: { id: "singleton" } });
  return row ? mapHomepageSettings(row) : defaultHomepageSettings;
}
