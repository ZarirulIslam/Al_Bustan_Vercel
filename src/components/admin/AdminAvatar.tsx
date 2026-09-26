import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

// An admin's profile picture, or the first letter of their name/email
// on the dashboard's garden-green circle when they haven't set one.
export function AdminAvatar({
  url,
  label,
  size = "md",
  className,
}: {
  url?: string | null;
  label?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initial = label?.trim()?.[0]?.toUpperCase() ?? "A";

  return (
    <span
      className={cn(
        "relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-garden-700 font-semibold text-white",
        sizes[size],
        className
      )}
    >
      {url ? (
        <Image src={url} alt="" fill sizes={size === "lg" ? "80px" : "36px"} className="object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
