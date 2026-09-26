import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "h-8 w-8 text-xs", px: "32px" },
  md: { box: "h-9 w-9 text-sm", px: "36px" },
  card: { box: "h-12 w-12 text-sm", px: "48px" },
  lg: { box: "h-20 w-20 text-2xl", px: "80px" },
} as const;

const tones = {
  solid: "bg-garden-700 text-white",
  soft: "bg-limestone-200 text-ink ring-1 ring-limestone-300",
} as const;

// "Sarah Johnson" → "SJ", "admin@x.com" → "A".
export function initialsFor(label?: string | null): string {
  const clean = label?.trim() ?? "";
  if (!clean) return "A";
  if (clean.includes("@")) return clean[0].toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

// An admin's profile picture, or their initials when they haven't set
// one.
export function AdminAvatar({
  url,
  label,
  size = "md",
  tone = "solid",
  className,
}: {
  url?: string | null;
  label?: string | null;
  size?: keyof typeof sizes;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        sizes[size].box,
        tones[tone],
        className
      )}
    >
      {url ? (
        <Image src={url} alt="" fill sizes={sizes[size].px} className="object-cover" />
      ) : (
        initialsFor(label)
      )}
    </span>
  );
}
