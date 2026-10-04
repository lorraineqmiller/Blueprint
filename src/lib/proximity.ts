// Distance between people, at building granularity. With a backend
// connected, friend distances come from the friend_distances() RPC (rounded
// to 100 m, and computed server-side so nobody's off-campus coordinates ever
// reach another person's device). In the local demo they're computed here
// from the same building coordinates.
import type { Building } from '../data/buildings'
import type { Location, OffCampusAddress } from '../types'

const WALKING_METERS_PER_MINUTE = 80
// Anything within this is "close enough to grab it tonight" — surfaces in
// the Friends Nearby strip.
export const NEARBY_METERS = 500

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

export function coordsFor(
  loc: Location & { offCampusAddress?: OffCampusAddress | null },
  buildings: Building[],
): { lat: number; lng: number } | null {
  if (loc.buildingId) {
    const b = buildings.find((x) => x.id === loc.buildingId)
    return b ? { lat: b.lat, lng: b.lng } : null
  }
  if (loc.offCampus && loc.offCampusAddress) return { lat: loc.offCampusAddress.lat, lng: loc.offCampusAddress.lng }
  return null
}

export function locationName(loc: Location, buildings: Building[]): string {
  if (loc.buildingId) return buildings.find((b) => b.id === loc.buildingId)?.name ?? 'On campus'
  if (loc.offCampus) return 'Off campus'
  return ''
}

export function isSameBuilding(me: Location, other: Location): boolean {
  return Boolean(me.buildingId && other.buildingId && me.buildingId === other.buildingId)
}

export function walkingLabel(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / WALKING_METERS_PER_MINUTE))
  return `${minutes} min walk`
}

// "Same building · John Jay Hall", "6 min walk · Sulzberger Hall",
// "12 min walk · Off campus", or just the place when distance is unknown.
export function proximityLabel(me: Location, other: Location, meters: number | undefined, buildings: Building[]): string {
  const place = locationName(other, buildings)
  if (!place) return 'Location not set'
  if (isSameBuilding(me, other)) return `Same building · ${place}`
  if (meters === undefined) return place
  return `${walkingLabel(meters)} · ${place}`
}
