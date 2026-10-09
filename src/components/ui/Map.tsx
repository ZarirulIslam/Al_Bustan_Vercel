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
}: {
  latitude: number | null;
  longitude: number | null;
  label: string;
  address?: string | null;
  zoom?: number;
}) {
  const query =
    latitude !== null && longitude !== null ? `${latitude},${longitude}` : address?.trim() || null;

  if (!query) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center rounded-lg border border-dashed border-limestone-300 bg-limestone-200 text-center">
        <p className="text-sm text-ink-soft">
          Map will appear here once the location is confirmed.
        </p>
      </div>
    );
  }

  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&hl=en&output=embed`;

  return (
    <div className="aspect-[16/9] overflow-hidden rounded-lg border border-limestone-300">
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
