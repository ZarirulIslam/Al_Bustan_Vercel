"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.92C21.96 6.45 17.5 2 12.04 2zm5.8 14.1c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.3-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.55-1.17-2.96s.73-2.1 1-2.39c.24-.28.53-.35.71-.35h.5c.16 0 .38-.03.58.44.24.57.8 1.98.87 2.12.07.14.12.3.02.49-.1.19-.15.3-.29.47-.14.16-.3.36-.43.48-.14.14-.29.29-.13.57.17.28.75 1.24 1.6 2.01 1.1 1 2.03 1.31 2.31 1.46.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.13.07.71-.17 1.4z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.15 2 11.28c0 2.92 1.46 5.53 3.75 7.23V22l3.43-1.88c.9.25 1.86.38 2.82.38 5.52 0 10-4.15 10-9.28C22 6.15 17.52 2 12 2zm1.02 12.49-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1 1L17 17M17 1L1 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FloatingContactWidget({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);

  const options = [
    settings.whatsapp && {
      key: "whatsapp",
      label: "WhatsApp",
      href: settings.whatsapp,
      icon: <WhatsAppIcon />,
      className: "bg-[#25D366] text-white hover:bg-[#1fb959]",
    },
    settings.phone && {
      key: "phone",
      label: "Call Us",
      href: `tel:${settings.phone.replace(/[^+\d]/g, "")}`,
      icon: <PhoneIcon />,
      className: "bg-garden-500 text-white hover:bg-garden-600",
    },
    settings.messengerUrl && {
      key: "messenger",
      label: "Messenger",
      href: settings.messengerUrl,
      icon: <MessengerIcon />,
      className: "bg-[#0084FF] text-white hover:bg-[#0073e0]",
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    className: string;
  }[];

  if (options.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex flex-col items-end gap-2.5">
          {options.map((option) => (
            <a
              key={option.key}
              href={option.href}
              target={option.key === "phone" ? undefined : "_blank"}
              rel={option.key === "phone" ? undefined : "noopener noreferrer"}
              aria-label={option.label}
              className={cn(
                "flex items-center gap-2.5 rounded-full py-2.5 pl-4 pr-5 text-sm font-medium shadow-card transition-transform duration-150 ease-estate hover:scale-[1.03]",
                option.className
              )}
            >
              {option.icon}
              {option.label}
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close contact options" : "Open contact options"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-garden-700 text-white shadow-card transition-transform duration-150 ease-estate hover:scale-105"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}
