import type { ClothingItem, Person } from '../types'
import { useStore } from '../store'

export function useMyItems() {
  return useStore((s) => s.items.filter((i) => i.ownerId === s.user.id))
}

export function usePersonById(personId: string | undefined): Person | undefined {
  return useStore((s) => s.people.find((p) => p.id === personId))
}

export function useItemById(itemId: string | undefined): ClothingItem | undefined {
  return useStore((s) => s.items.find((i) => i.id === itemId))
}
