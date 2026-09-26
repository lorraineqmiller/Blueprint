// Self-reported building/floor, not GPS — this is exactly as precise as the
// original design's flavor text ("6 min · 113th") was always meant to be.
// Computed live from raw building/floor rather than stored, so it's always
// correct relative to whoever's looking, without needing a refetch when
// either side's location changes.
type Located = { building: string; floor: string }

export function proximityLabel(me: Located, other: Located): string {
  if (!other.building) return 'Location not set'
  if (!me.building) return other.building
  if (me.building.trim().toLowerCase() !== other.building.trim().toLowerCase()) return other.building
  if (me.floor && other.floor && me.floor.trim().toLowerCase() === other.floor.trim().toLowerCase()) {
    return `Same floor · ${other.building}`
  }
  return `Same building · ${other.building}`
}

export function isSameFloor(me: Located, other: Located): boolean {
  return (
    Boolean(me.building && other.building) &&
    me.building.trim().toLowerCase() === other.building.trim().toLowerCase() &&
    Boolean(me.floor && other.floor) &&
    me.floor.trim().toLowerCase() === other.floor.trim().toLowerCase()
  )
}

export function isSameBuilding(me: Located, other: Located): boolean {
  return Boolean(me.building && other.building) && me.building.trim().toLowerCase() === other.building.trim().toLowerCase()
}
