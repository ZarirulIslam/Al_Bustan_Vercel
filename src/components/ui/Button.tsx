import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-body font-medium transition-all duration-200 ease-estate disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-garden-500 text-white shadow-sm hover:bg-garden-600 hover:shadow-card active:bg-garden-700",
  secondary:
    "bg-transparent text-white border border-white/70 hover:border-white hover:bg-white hover:text-garden-700",
  ghost:
    "bg-transparent text-garden-600 border border-garden-300 hover:border-garden-500 hover:bg-garden-50",
  // Antique-gold fill — the highest-emphasis call to action, reserved
  // for the one or two moments (e.g. the hero CTA) that sit directly
  // on a deep-green or photographic background, where the gold reads
  // as a deliberate premium accent rather than the default action.
  accent:
    "bg-brass text-white shadow-sm hover:bg-brass-dark hover:shadow-card active:bg-brass-dark",
  // Compact, low-emphasis destructive action — used for row-level
  // "Delete" controls in admin tables/lists, alongside "ghost" for
  // "Edit", so table actions read as buttons rather than bare links.
  danger:
    "bg-transparent text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs rounded-full",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {props.children}
      </Link>
    );
  }

  const { ...rest } = props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {props.children}
    </button>
  );
}
