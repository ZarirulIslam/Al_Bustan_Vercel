import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 removed the built-in Rust query engine — a driver adapter
// is now required for every database, not optional. `new PrismaClient()`
// with no adapter is invalid in v7. This also means the connection
// string is passed explicitly here (via DATABASE_URL) rather than
// Prisma Client reading it implicitly from the schema/generated code.
const connectionString = process.env.DATABASE_URL;

// Standard Next.js dev-mode singleton: without this, hot-reloading
// creates a new PrismaClient (and a new DB connection) on every save.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
