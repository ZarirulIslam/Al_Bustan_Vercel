// Admin session lifetime rules — shared by the server (src/lib/auth.ts,
// src/proxy.ts) and the browser-side idle timer
// (src/components/admin/AdminSessionTimeout.tsx). Safe to import from
// client components.
//
// How the idle timeout works:
//  - The session JWT and its cookie expire ADMIN_IDLE_TIMEOUT_MS after
//    they were last renewed (authOptions.session.maxAge). Once expired,
//    proxy.ts sends every admin page to the login screen and server
//    actions reject the request — this is the real enforcement.
//  - Every call to /api/auth/session renews both (NextAuth's sliding
//    JWT session). The admin UI calls it when the admin is actually
//    doing something — clicking, typing, scrolling — at most once per
//    ADMIN_ACTIVITY_RENEW_INTERVAL_MS, so a session only expires after
//    30 minutes with no activity at all.
//  - Independently of activity, a session can never outlive
//    ADMIN_SESSION_MAX_LIFETIME_MS from sign-in.

export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const ADMIN_IDLE_TIMEOUT_SECONDS = ADMIN_IDLE_TIMEOUT_MS / 1000;

export const ADMIN_SESSION_MAX_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours

// `loginAt` is the sign-in time stored in the session JWT. Tokens
// without one (issued before this rule existed) count as expired.
export function isWithinSessionLifetime(loginAt: number | undefined): boolean {
  return typeof loginAt === "number" && Date.now() - loginAt < ADMIN_SESSION_MAX_LIFETIME_MS;
}

// How often ongoing activity renews the session (throttle).
export const ADMIN_ACTIVITY_RENEW_INTERVAL_MS = 60 * 1000;

// How long before an idle sign-out the warning dialog appears.
export const ADMIN_IDLE_WARNING_MS = 2 * 60 * 1000;
