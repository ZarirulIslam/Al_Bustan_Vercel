"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, signOut, useSession } from "next-auth/react";
import {
  ADMIN_ACTIVITY_RENEW_INTERVAL_MS,
  ADMIN_IDLE_TIMEOUT_MS,
  ADMIN_IDLE_WARNING_MS,
} from "@/lib/sessionPolicy";

// Browser half of the 30-minute inactivity timeout (the server half —
// the session cookie/JWT expiring — is what actually enforces it; see
// src/lib/sessionPolicy.ts).
//
//  - Real admin activity (pointer, keyboard, scroll, wheel, touch)
//    renews the server session, throttled to once a minute, with a
//    trailing renewal so the last bit of activity always counts.
//  - Every renewal restarts the local countdown. Renewals made by other
//    admin tabs reach this one through NextAuth's cross-tab broadcast
//    (SessionProvider refetches, `session.expires` changes), so working
//    in one tab keeps the others signed in.
//  - Two minutes before the deadline a warning offers to stay signed
//    in; at the deadline the session is ended and the admin is sent to
//    the login page, which returns them here after signing in.

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;

// Sign out slightly before the server-side expiry, so the local timer —
// not a failed save — is what the admin sees.
const CLOCK_MARGIN_MS = 5 * 1000;

function localDeadline() {
  return Date.now() + ADMIN_IDLE_TIMEOUT_MS - CLOCK_MARGIN_MS;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function AdminSessionTimeout() {
  const { data: session, status } = useSession();
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const lastRenewRef = useRef(0);
  const renewingRef = useRef(false);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedRef = useRef(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  const endSession = useCallback(async (notice: "idle" | "session-expired") => {
    if (endedRef.current) return;
    endedRef.current = true;
    const from = `${window.location.pathname}${window.location.search}`;
    try {
      // Clears the session cookie server-side too (and tells other tabs).
      await signOut({ redirect: false });
    } catch {
      // The session may already be gone — the redirect below still applies.
    }
    window.location.assign(`/admin/login?notice=${notice}&from=${encodeURIComponent(from)}`);
  }, []);

  // Any session fetch in this tab (SessionProvider's own on load/focus,
  // or one triggered by another tab's broadcast) renewed the server
  // session — restart the countdown from now.
  useEffect(() => {
    if (!session?.expires) return;
    lastRenewRef.current = Date.now();
    setDeadline(localDeadline());
  }, [session?.expires]);

  const renew = useCallback(async () => {
    if (renewingRef.current || endedRef.current) return;
    renewingRef.current = true;
    lastRenewRef.current = Date.now();
    try {
      const fresh = await getSession(); // renews the cookie + broadcasts to other tabs
      if (fresh) setDeadline(localDeadline());
      else void endSession("session-expired");
    } finally {
      renewingRef.current = false;
    }
  }, [endSession]);

  // Activity → renew, at most once per interval (plus one trailing call).
  useEffect(() => {
    function onActivity() {
      if (endedRef.current) return;
      const elapsed = Date.now() - lastRenewRef.current;
      if (elapsed >= ADMIN_ACTIVITY_RENEW_INTERVAL_MS) {
        void renew();
      } else if (!trailingTimerRef.current) {
        trailingTimerRef.current = setTimeout(() => {
          trailingTimerRef.current = null;
          void renew();
        }, ADMIN_ACTIVITY_RENEW_INTERVAL_MS - elapsed);
      }
    }
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true, capture: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity, { capture: true });
      }
      if (trailingTimerRef.current) clearTimeout(trailingTimerRef.current);
    };
  }, [renew]);

  // Clock tick. Background tabs throttle timers, so also re-check the
  // moment the tab becomes visible again (e.g. after a laptop sleeps).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const remaining = deadline === null ? null : deadline - now;

  const idleExpired = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (idleExpired) void endSession("idle");
  }, [idleExpired, endSession]);

  // Signed out some other way (another tab, a deactivated account, the
  // server rejecting the session). Deliberate sign-outs in this tab
  // (the sidebar button, a password change) navigate away on their own
  // with their own login message, so give them a moment to do that
  // before stepping in.
  useEffect(() => {
    if (status !== "unauthenticated") return;
    const timer = setTimeout(() => void endSession("session-expired"), 1500);
    return () => clearTimeout(timer);
  }, [status, endSession]);

  const warning = remaining !== null && remaining > 0 && remaining <= ADMIN_IDLE_WARNING_MS;

  useEffect(() => {
    if (warning) stayButtonRef.current?.focus();
  }, [warning]);

  if (!warning || remaining === null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-garden-900/50 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-body"
        className="w-full max-w-sm rounded-xl border border-limestone-300 bg-white p-6 shadow-card-hover"
      >
        <h2 id="session-timeout-title" className="text-xl">
          Still there?
        </h2>
        <p id="session-timeout-body" className="mt-2 text-sm text-ink-soft">
          For security, you&apos;ll be signed out after 30 minutes of inactivity. Signing out in{" "}
          <span className="font-semibold tabular-nums text-ink" aria-live="polite">
            {formatRemaining(remaining)}
          </span>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => void endSession("idle")}
            className="rounded px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-limestone-200"
          >
            Sign out now
          </button>
          <button
            ref={stayButtonRef}
            type="button"
            onClick={() => void renew()}
            className="rounded bg-garden-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-garden-600"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
