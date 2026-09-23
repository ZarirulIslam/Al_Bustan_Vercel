import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Best-effort login throttling — not a hard guarantee. This is an
// in-memory map: it resets on every server restart/redeploy, and
// isn't shared across multiple serverless instances if this ever
// runs somewhere that spins up more than one (e.g. Vercel under
// load). For a single-admin internal CMS this is still a meaningful
// deterrent against casual brute-forcing without adding an external
// dependency (Redis, etc.) for a problem this small — worth
// revisiting with a shared store if that assumption stops holding.
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, AttemptRecord>();

function isLockedOut(email: string): boolean {
  const record = loginAttempts.get(email);
  if (!record?.lockedUntil) return false;
  if (Date.now() > record.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }
  return true;
}

function recordFailedLoginAttempt(email: string) {
  const record = loginAttempts.get(email) ?? { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(email, record);
}

function clearLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

export const authOptions: AuthOptions = {
  // 12 hours rather than NextAuth's 30-day default — this is an
  // admin CMS backend, not a consumer app; a shorter-lived session is
  // a meaningful reduction in the window a stolen/left-open session
  // stays usable, at the cost of signing in somewhat more often.
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        if (isLockedOut(email)) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email },
        });
        if (!user) {
          recordFailedLoginAttempt(email);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          recordFailedLoginAttempt(email);
          return null;
        }

        clearLoginAttempts(email);
        return { id: user.id, email: user.email, name: user.name ?? "Admin" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
      }
      return session;
    },
  },
};
