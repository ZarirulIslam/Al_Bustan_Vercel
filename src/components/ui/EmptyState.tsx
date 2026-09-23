import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start rounded-lg border border-dashed border-limestone-300 px-8 py-16">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 max-w-prose text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
