import { cn } from "@/lib/utils";

type Tone = "garden" | "sky" | "brass" | "neutral" | "danger";

interface Stat {
  label: string;
  value: number;
  tone?: Tone;
}

// Same semantic colors already used for status badges/pipelines
// elsewhere in the admin (ProjectStatusBadge, InquiryTable) — applied
// here too so a number's color always means the same thing across
// the dashboard.
const toneText: Record<Tone, string> = {
  garden: "text-garden-600",
  sky: "text-sky-dark",
  brass: "text-brass-dark",
  neutral: "text-ink-soft",
  danger: "text-red-600",
};

const toneDot: Record<Tone, string> = {
  garden: "bg-garden-500",
  sky: "bg-sky",
  brass: "bg-brass",
  neutral: "bg-ink-soft/40",
  danger: "bg-red-500",
};

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => {
        const tone = stat.tone ?? "garden";
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-limestone-300 bg-white p-5 shadow-card transition-all duration-300 ease-estate hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span className={cn("inline-block h-2 w-2 rounded-full", toneDot[tone])} aria-hidden="true" />
            <p className={cn("mt-2 font-display text-3xl", toneText[tone])}>{stat.value}</p>
            <p className="mt-1.5 text-sm text-ink-soft">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
