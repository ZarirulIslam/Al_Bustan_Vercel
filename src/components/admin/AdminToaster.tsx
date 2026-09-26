"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FLASH_COOKIE, parseFlash } from "@/lib/admin/flashCookie";

// One feedback system for the whole dashboard:
//  - forms that stay on their page call useActionFeedback(state, …)
//  - row buttons (publish, delete, …) go through useAdminAction()
//  - actions that finish by going back to a list call
//    redirectWithFlash() on the server; the message rides along in a
//    short-lived cookie and is shown here once the list page loads.

type Tone = "success" | "error";
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const GENERIC_ERROR = "Something went wrong and nothing was saved. Please try again.";

export function useAdminToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useAdminToast must be used inside AdminToastProvider.");
  return api;
}

// For useActionState forms that stay on the page after saving.
// Fires once per submission (the state object is new every time).
export function useActionFeedback(
  state: { success?: boolean; error?: string; fieldErrors?: object; message?: string },
  successMessage: string
) {
  const toast = useAdminToast();
  const lastHandled = useRef(state);

  useEffect(() => {
    if (state === lastHandled.current) return;
    lastHandled.current = state;
    if (state.success) toast.success(state.message ?? successMessage);
    else if (state.error) toast.error(state.error);
    else if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      toast.error("Some fields need attention. Please check the highlighted fields and try again.");
    }
  }, [state, successMessage, toast]);
}

// For one-click row actions. Server actions throw on failure (and in
// production their messages are hidden), so a failure shows a generic
// error; an action may also *return* { error } for a specific one.
export function useAdminAction() {
  const toast = useAdminToast();
  const [isPending, startTransition] = useTransition();

  const run = useCallback(
    (action: () => Promise<unknown>, successMessage?: string) => {
      startTransition(async () => {
        try {
          const result = (await action()) as { error?: string; message?: string } | undefined;
          if (result && typeof result === "object" && result.error) {
            toast.error(result.error);
            return;
          }
          const message = (result && typeof result === "object" && result.message) || successMessage;
          if (message) toast.success(message);
        } catch (error) {
          console.error(error);
          toast.error(GENERIC_ERROR);
        }
      });
    },
    [toast]
  );

  return { run, isPending };
}

function readAndClearFlash() {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${FLASH_COOKIE}=`))
    ?.slice(FLASH_COOKIE.length + 1);
  if (!raw) return null;
  document.cookie = `${FLASH_COOKIE}=; path=/admin; max-age=0`;
  return parseFlash(raw);
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const pathname = usePathname();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, tone, message }]);
      // Errors stay longer — they usually need reading.
      window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 4500);
    },
    [dismiss]
  );

  const [api] = useState<ToastApi>(() => ({
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  }));

  // A message left by redirectWithFlash() for the page we just landed on.
  useEffect(() => {
    const flash = readAndClearFlash();
    if (flash) push(flash.tone, flash.message);
  }, [pathname, push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-card-hover",
              toast.tone === "success" ? "border-garden-300 text-garden-700" : "border-red-300 text-red-700"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white",
                toast.tone === "success" ? "bg-garden-500" : "bg-red-600"
              )}
              aria-hidden="true"
            >
              {toast.tone === "success" ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="m2.5 6.5 2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M6 3v3.5M6 8.8v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <p className="flex-1 leading-relaxed text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="-mr-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-ink-soft hover:bg-limestone-200"
            >
              <svg width="10" height="10" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
