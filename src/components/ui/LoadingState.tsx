export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 py-16 text-sm text-ink-soft"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-limestone-300 border-t-garden-500" />
      {label}…
    </div>
  );
}
