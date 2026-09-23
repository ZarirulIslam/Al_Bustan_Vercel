import { cn } from "@/lib/utils";

interface DonutSegment {
  label: string;
  value: number;
  strokeClass: string;
  dotClass: string;
}

// Plain SVG ring built from the project's real status counts — no
// charting library, no placeholder numbers. Each segment's arc length
// is its share of the circle's circumference.
export function ProjectMixDonut({
  segments,
  total,
  centerLabel,
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative h-36 w-36 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} strokeWidth="12" className="fill-none stroke-limestone-200" />
          {total > 0 &&
            segments
              .filter((segment) => segment.value > 0)
              .map((segment) => {
                const length = (segment.value / total) * circumference;
                const dashoffset = -cumulative;
                cumulative += length;
                return (
                  <circle
                    key={segment.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={dashoffset}
                    className={cn("fill-none", segment.strokeClass)}
                  />
                );
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-2xl text-ink">{total}</p>
          <p className="text-[11px] text-ink-soft">{centerLabel}</p>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", segment.dotClass)} />
              {segment.label}
            </span>
            <span className="font-medium text-ink">
              {segment.value}{" "}
              <span className="text-ink-soft">
                ({total > 0 ? Math.round((segment.value / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
