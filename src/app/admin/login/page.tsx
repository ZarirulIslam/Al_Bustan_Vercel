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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";
  const notice =
    searchParams.get("notice") === "password-reset"
      ? "Your password has been reset. Sign in with your new password."
      : searchParams.get("notice") === "password-changed"
        ? "Password changed. Please sign in again with your new password."
        : null;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push(from);
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
