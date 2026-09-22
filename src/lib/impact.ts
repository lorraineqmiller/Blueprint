import type { ClothingItem } from '../types'

// Simple, transparent estimates used across the app so every screen's math
// traces back to the same assumptions (useful for an accelerator demo where
// judges will ask "where do these numbers come from").
export const CO2_PER_WEAR_KG = 0.6
export const WATER_PER_WEAR_L = 45
export const WASTE_PER_WEAR_KG = 0.067

// One-time avoidance from borrowing an item outright instead of buying an
// equivalent new piece (retail price × replacement multiplier).
export const BORROW_CO2_PER_DOLLAR = 0.093
export const BORROW_WATER_PER_DOLLAR = 30
export const BORROW_MONEY_MULTIPLIER = 1.867

export function dollars(priceCents: number) {
  return priceCents / 100
}

export function costPerWear(item: ClothingItem) {
  if (item.wearCount === 0) return dollars(item.priceCents)
  return dollars(item.priceCents) / item.wearCount
}

export function borrowImpact(priceCents: number) {
  const price = dollars(priceCents)
  return {
    co2Kg: Math.round(price * BORROW_CO2_PER_DOLLAR * 10) / 10,
    waterL: Math.round(price * BORROW_WATER_PER_DOLLAR),
    moneyNotSpent: Math.round(price * BORROW_MONEY_MULTIPLIER),
  }
}

export function totalWears(items: ClothingItem[]) {
  return items.reduce((sum, i) => sum + i.wearCount, 0)
}

export function closetImpact(items: ClothingItem[]) {
  const wears = totalWears(items)
  return {
    co2Kg: Math.round(wears * CO2_PER_WEAR_KG * 10) / 10,
    waterL: Math.round(wears * WATER_PER_WEAR_L),
    wasteKg: Math.round(wears * WASTE_PER_WEAR_KG * 10) / 10,
    wears,
  }
}

export function daysSince(iso: string | null) {
  if (!iso) return Infinity
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function formatRelative(iso: string | null) {
  const d = daysSince(iso)
  if (!iso) return 'Never worn'
  if (d <= 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 60) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 7)} weeks ago`
}
