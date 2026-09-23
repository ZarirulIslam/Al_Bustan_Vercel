// Prisma 7 config file — required as of v7. Two things that used to
// live elsewhere now live here:
//   - the seed command (used to be package.json's "prisma.seed" field)
//   - the datasource connection URL (used to be `url = env("DATABASE_URL")`
//     directly in prisma/schema.prisma — v7 no longer allows a URL
//     there; see the datasource block in schema.prisma for the
//     provider declaration, which still stays in the schema)
//
// This file runs as a standalone Node script via the Prisma CLI
// (outside of Next.js's own env loading), so it loads .env itself.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // The CLI (generate/db push/migrate) is the only consumer of this
  // url — the running app never reads it, since src/lib/prisma.ts
  // builds its own adapter directly from DATABASE_URL (the
  // transaction-mode pooler). CLI schema operations use DIRECT_URL
  // (the session-mode pooler) instead, matching the old
  // `datasource.directUrl` schema property's intent, since Prisma 7's
  // config `datasource` type only supports `url`/`shadowDatabaseUrl`.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
