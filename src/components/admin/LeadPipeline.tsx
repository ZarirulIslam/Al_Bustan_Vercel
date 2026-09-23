import { cn } from "@/lib/utils";

interface PipelineStage {
  label: string;
  value: number;
  barClass: string;
}

// Horizontal bars sized against the largest stage, so the pipeline's
// shape (not just raw counts) is visible at a glance — same idea as
// the reference dashboards' conversion funnels, built from the real
// lead-status counts already computed in getInquiryCounts.
export function LeadPipeline({ stages }: { stages: PipelineStage[] }) {
  const max = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{stage.label}</span>
            <span className="text-ink-soft">{stage.value}</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-limestone-200">
            <div
              className={cn("h-full rounded-full transition-all duration-500 ease-estate", stage.barClass)}
              style={{ width: `${(stage.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
