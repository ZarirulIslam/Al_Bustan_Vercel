// One-off / break-glass admin setup:  npm run admin:bootstrap -- you@example.com
//
//  1. Upgrades admin accounts that predate roles/verification (created
//     directly by the seed, never through an invite, so they have no
//     invite token — anyone still mid-invite is left alone): marks
//     them verified and grants every dashboard section, so nobody loses
//     access they had before section permissions existed.
//  2. Promotes the given email (or ADMIN_EMAIL from .env) to an active
//     Super Admin — needed once after adding roles, since existing
//     accounts default to plain "admin", and handy if every Super Admin
//     ever gets locked out.
//
// Safe to run repeatedly.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ADMIN_SECTIONS } from "../src/lib/admin/permissions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("Pass the email to promote (npm run admin:bootstrap -- you@example.com) or set ADMIN_EMAIL.");
  }

  const legacy = await prisma.adminUser.updateMany({
    where: { emailVerifiedAt: null, tokens: { none: { type: "invite" } } },
    data: { emailVerifiedAt: new Date(), permissions: ADMIN_SECTIONS.map((s) => s.key) },
  });
  console.log(`Upgraded ${legacy.count} pre-existing admin account(s): verified, access to all sections.`);

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    const known = await prisma.adminUser.findMany({ select: { email: true } });
    throw new Error(
      `No admin account with email ${email}. Existing accounts: ${known.map((a) => a.email).join(", ") || "(none)"}`
    );
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      role: "super_admin",
      permissions: [],
      isActive: true,
      emailVerifiedAt: admin.emailVerifiedAt ?? new Date(),
    },
  });
  console.log(`${email} is now an active Super Admin.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
