import type { ClothingItem, Person } from '../types'
import { useStore } from '../store'
import { proximityLabel } from './proximity'

export function useMyItems() {
  return useStore((s) => s.items.filter((i) => i.ownerId === s.user.id))
}

export function usePersonById(personId: string | undefined): Person | undefined {
  return useStore((s) => s.people.find((p) => p.id === personId))
}

export function useItemById(itemId: string | undefined): ClothingItem | undefined {
  return useStore((s) => s.items.find((i) => i.id === itemId))
}

// "Same building · John Jay Hall" / "6 min walk · Sulzberger Hall" for a friend.
export function useProximityLabel(person: Person | undefined): string {
  return useStore((s) => (person ? proximityLabel(s.user, person, s.distances[person.id], s.buildings) : ''))
}
