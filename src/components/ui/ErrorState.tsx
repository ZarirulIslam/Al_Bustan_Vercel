export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-limestone-300 bg-white px-8 py-12"
    >
      <h3 className="text-lg text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{description}</p>
    </div>
  );
}
