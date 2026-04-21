/**
 * Extract lat/lng from common Google Maps URL shapes (no API key required).
 */
export function parseLatLngFromGoogleMapsUrl(input: string): { lat: number; lng: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|\?|&|$)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  const llMatch = trimmed.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    const lat = Number(llMatch[1]);
    const lng = Number(llMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)(?:&|$)/);
  if (qMatch) {
    const lat = Number(qMatch[1]);
    const lng = Number(qMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}
