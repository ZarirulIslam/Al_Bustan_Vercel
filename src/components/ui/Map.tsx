export function Map({
  latitude,
  longitude,
  label,
}: {
  latitude: number | null;
  longitude: number | null;
  label: string;
}) {
  if (latitude === null || longitude === null) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center rounded-lg border border-dashed border-limestone-300 bg-limestone-200 text-center">
        <p className="text-sm text-ink-soft">
          Map will appear here once the project&apos;s location is confirmed.
        </p>
      </div>
    );
  }

  const delta = 0.01;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join("%2C");

  return (
    <div className="aspect-[16/9] overflow-hidden rounded-lg border border-limestone-300">
      <iframe
        title={`Map showing the location of ${label}`}
        className="h-full w-full"
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`}
      />
    </div>
  );
}
