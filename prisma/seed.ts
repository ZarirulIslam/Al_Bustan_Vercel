// Run directly via `tsx prisma/seed.ts` (see package.json's db:seed
// script) rather than through the Prisma CLI, so prisma.config.ts's
// own "import dotenv/config" doesn't apply here — load it explicitly
// so DATABASE_URL (and ADMIN_EMAIL/ADMIN_PASSWORD below) are populated.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Prisma 7 requires a driver adapter — see src/lib/prisma.ts for the
// same pattern used by the app itself.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Admin user ---
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding. See .env.example."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // The seeded account is the initial Super Admin (it can invite
  // everyone else from /admin/users).
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "super_admin", isActive: true },
    create: { email, passwordHash, name: "Admin", role: "super_admin", emailVerifiedAt: new Date() },
  });
  console.log(`Admin user ready: ${email}`);

  // --- Real project: Al Bustan Purbachal City ---
  // Skip if any projects already exist, so re-running the seed never
  // clobbers real admin edits — this only ever creates the project
  // once, on a fresh database.
  const existingCount = await prisma.project.count();
  if (existingCount > 0) {
    console.log(`Skipping project seed — ${existingCount} project(s) already in the database.`);
  } else {
    await prisma.project.create({
      data: {
        slug: "al-bustan-purbachal-city",
        name: "Al Bustan Purbachal City",
        status: "ongoing",
        category: "land_plot",
        location: "Mouza Purba Kaladi, Kanchan Pourashava, Rupganj, Narayanganj",
        shortDescription:
          "An integrated community of about 350 bigha in Rupganj, Narayanganj, connected to the 180-foot Asian Highway and planned around education, healthcare, worship and recreation.",
        fullDescription:
          "Al Bustan Purbachal City is a planned, self-sufficient community by Al Bustan Communities Limited. Set on about 350 bigha of land in Rupganj, Narayanganj, it is not just a housing project. Every part of family life, from living and schooling to healthcare, worship, recreation and social gatherings, is placed within one master plan.\n\nThe project connects directly to the 180-foot Asian Highway. Residents can choose from three plot sizes: 3 katha, 5 katha and 10 katha.",
        projectType: "Integrated community project (residential plots)",
        totalArea: "About 350 bigha",
        unitInfo: "Residential plots of 3 katha, 5 katha and 10 katha",
        timeline: "Handover dates will be announced by the company",
        sizesOffered: "3, 5 & 10 Katha",
        pricingInfo: null,
        features: "<ul><li><p>Direct connection to the 180-foot Asian Highway</p></li><li><p>Plots of 3, 5 and 10 katha</p></li><li><p>Planned university, school and madrasah</p></li><li><p>Planned medical college and hospital</p></li><li><p>Planned central mosque for about 5,000 worshippers</p></li><li><p>Planned shopping mall and commercial zone</p></li><li><p>Sports fields, swimming pool, jogging track and playground</p></li><li><p>Lake and community centre</p></li><li><p>CCTV surveillance, parking, utilities and fire safety</p></li></ul>",
        nearbyFacilities: "<ul><li><p>Kanchan Bridge Toll Plaza — about 2 km</p></li><li><p>300-foot Purbachal road — about 3 km</p></li><li><p>Kuril Flyover, Dhaka — about 15 km</p></li><li><p>Hazrat Shahjalal International Airport — about 19 km</p></li><li><p>Nearby landmarks: US-Bangla American City, Green University of Bangladesh, State University, OMC Footwear Limited, Asian Duplex Town</p></li></ul>",
        latitude: null,
        longitude: null,
        published: true,
        coverImage: {
          create: {
            url: "https://images.unsplash.com/photo-1637119106192-036fbe26d38d?auto=format&fit=crop&w=1600&q=80",
            alt: "Conceptual view of Al Bustan Purbachal City",
          },
        },
        gallery: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1637119106192-036fbe26d38d?auto=format&fit=crop&w=1600&q=80",
              alt: "Conceptual aerial view of the planned community at Al Bustan Purbachal City",
            },
            {
              url: "https://images.unsplash.com/photo-1748324687716-022bec19fe9b?auto=format&fit=crop&w=1600&q=80",
              alt: "Conceptual streetscape view at Al Bustan Purbachal City",
            },
          ],
        },
      },
    });
    console.log("Seeded project: Al Bustan Purbachal City.");
  }

  // --- Website settings (singleton row) ---
  // Safe to re-run: `update: {}` means an existing row (including one
  // the admin has since edited via /admin/settings) is left untouched
  // — this only ever fills in real values on first run.
  await prisma.websiteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      companyName: "Al Bustan Communities Limited",
      logoUrl: "/images/logo.png",
      phone: "01403-777333",
      whatsapp: "https://wa.me/8801403777333",
      email: "albustancommunitieslimited@gmail.com",
      address: "3rd Floor, House 72-B, Road 21, Block B, Banani, Dhaka",
      latitude: null,
      longitude: null,
      // Placeholder — confirm your real office hours and update via
      // /admin/settings; not stated in the source content.
      businessHours: "Sunday – Thursday, 9:00 AM – 6:00 PM",
      messengerUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      linkedinUrl: null,
      youtubeUrl: null,
      seoTitle: "Al Bustan Communities Limited | Real Estate Developer, Dhaka",
      seoDescription:
        "Al Bustan Communities Limited is a Dhaka-based real estate developer creating well-planned land, plots and apartments.",
    },
  });
  console.log("Website settings ready.");

  // --- Homepage settings (singleton row) ---
  // Same safe-to-re-run convention as website settings above: only
  // fills in defaults (everything visible) on first run, never
  // overwrites admin edits made via /admin/homepage since.
  await prisma.homepageSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("Homepage settings ready.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
