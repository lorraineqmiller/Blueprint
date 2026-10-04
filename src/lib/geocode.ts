// Turns a typed off-campus address into coordinates, once, when the user
// saves it. Uses OpenStreetMap's free Nominatim service, biased to NYC —
// fine for an MVP (their policy allows light, user-initiated lookups like
// this, never autocomplete-as-you-type). Before real launch traffic, swap
// this for a keyed geocoder (Mapbox, Google) behind an edge function so the
// address isn't sent from the browser to a third party directly.
import type { OffCampusAddress } from '../types'

const NYC_VIEWBOX = '-74.05,40.92,-73.70,40.68'

export async function geocodeAddress(query: string): Promise<OffCampusAddress | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
    viewbox: NYC_VIEWBOX,
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[]
  if (results.length === 0) return null
  const [first] = results
  return { address: first.display_name, lat: Number(first.lat), lng: Number(first.lon) }
}
