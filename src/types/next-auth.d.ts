import type { AdminRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Fields src/lib/auth.ts adds to the session and JWT.
declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      role?: AdminRole;
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    sv?: number;
    // Sign-in time (ms since epoch) — enforces the absolute session
    // lifetime (src/lib/sessionPolicy.ts).
    loginAt?: number;
    role?: AdminRole;
    permissions?: string[];
  }
}
