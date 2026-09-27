"use client";

// This page must not be statically prerendered at build time: it's
// inherently per-request (a login form), and NextAuth's client
// module resolves its base URL from NEXTAUTH_URL at render time —
// during `next build`'s static-generation pass that value may not
// be the one meant for the deployed URL yet, which crashed the build
// with "TypeError: Invalid URL". Forcing dynamic rendering here is
// also simply more correct for an auth page, independent of that.
export const dynamic = "force-dynamic";

import { useState, type FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { defaultSiteSettings } from "@/lib/constants";

// Where to go after signing in. Only a same-site path inside /admin is
// accepted — never an absolute URL (which could send the admin to
// another host, e.g. an old http://localhost:3000 link, or be abused as
// an open redirect). Anything else falls back to the dashboard.
function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/admin";
  if (value !== "/admin" && !value.startsWith("/admin/") && !value.startsWith("/admin?")) return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = safeReturnPath(searchParams.get("from"));
  const notices: Record<string, string> = {
    "password-reset": "Your password has been reset. Sign in with your new password.",
    "password-changed": "Password changed. Please sign in again with your new password.",
    "invite-accepted": "Your account is ready. Sign in with your email and new password.",
    idle: "You were signed out after 30 minutes of inactivity. Please sign in again.",
    "session-expired": "Your session has ended. Please sign in again.",
  };
  const notice = notices[searchParams.get("notice") ?? ""] ?? null;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // redirect: false — we navigate ourselves with a relative path below,
    // so the result never depends on NextAuth's absolute base URL.
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: from,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "AccountDisabled"
          ? "This account has been deactivated. Contact a Super Admin."
          : "Incorrect email or password."
      );
      return;
    }

    router.replace(from);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-limestone-200">
      <Container className="max-w-sm">
        <div className="rounded-md border border-limestone-300 bg-white p-8 shadow-card">
          <p className="font-display text-lg text-garden-700">
            {defaultSiteSettings.companyName}
          </p>
          <h1 className="mt-2 text-2xl">Admin Login</h1>

          {notice && (
            <p className="mt-4 rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
              {notice}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className="mt-1.5 w-full rounded border border-limestone-300 px-3.5 py-2.5 text-sm outline-none focus:border-garden-500"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="text-sm text-ink">
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs font-medium text-garden-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded border border-limestone-300 px-3.5 py-2.5 text-sm outline-none focus:border-garden-500"
              />
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
