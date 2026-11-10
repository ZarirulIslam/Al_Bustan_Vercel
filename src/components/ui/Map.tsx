import { cn } from "@/lib/utils";

// Google Maps embed (keyless "output=embed" URL — no API key or billing
// needed). Pins the exact coordinates when they're set; otherwise
// searches the address, so a project or office without coordinates yet
// still shows a map.
export function Map({
  latitude,
  longitude,
  label,
  address,
  zoom = 15,
  className,
}: {
  latitude: number | null;
  longitude: number | null;
  label: string;
  address?: string | null;
  zoom?: number;
  // Replaces the default box (16:9, small radius), e.g. a taller map.
  className?: string;
}) {
  const query =
    latitude !== null && longitude !== null ? `${latitude},${longitude}` : address?.trim() || null;

  if (!query) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center border border-dashed border-limestone-300 bg-limestone-200 text-center",
          className ?? "aspect-[16/9] rounded-lg"
        )}
      >
        <p className="text-sm text-ink-soft">
          Map will appear here once the location is confirmed.
        </p>
      </div>
    );
  }

  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&hl=en&output=embed`;

  return (
    <div className={cn("overflow-hidden border border-limestone-300 bg-limestone-200", className ?? "aspect-[16/9] rounded-lg")}>
      <iframe
        title={`Google Map showing the location of ${label}`}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        src={src}
      />
    </div>
  );
}
