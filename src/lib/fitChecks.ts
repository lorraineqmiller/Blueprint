import { useEffect, useState } from 'react'
import type { FitCheck, FriendGroup, Person } from '../types'
import { communityName } from '../data/communities'
import { useStore } from '../store'

export const MAX_OPTIONS = 4

// Open = still taking votes/suggestions: not locked in, and not past its end
// time (the database enforces the same cutoff).
export function isOpen(fc: FitCheck, now = Date.now()): boolean {
  return fc.status === 'voting' && (!fc.endsAt || new Date(fc.endsAt).getTime() > now)
}

export function closesLabel(fc: FitCheck, now = Date.now()): string {
  if (fc.status === 'decided') return 'Decided'
  if (!fc.endsAt) return 'Open'
  const ms = new Date(fc.endsAt).getTime() - now
  if (ms <= 0) return 'Closed'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `Closes in ${Math.max(1, mins)}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Closes in ${hours}h${mins % 60 ? ` ${mins % 60}m` : ''}`
  return `Closes ${new Date(fc.endsAt).toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`
}

// Re-renders every 30s so countdowns tick and fit checks close on screen.
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

// An unnamed group reads as its members: "Priya, Jules".
export function groupName(group: Pick<FriendGroup, 'name' | 'memberIds'>, people: Person[]): string {
  if (group.name) return group.name
  const names = group.memberIds.map((id) => people.find((p) => p.id === id)?.name.split(' ')[0] ?? 'Someone')
  if (names.length === 0) return 'Empty group'
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

export function audienceLabel(fc: FitCheck, groups: FriendGroup[], people: Person[], communityId: string | null): string {
  if (fc.audience === 'community') return communityName(communityId) ?? 'Your community'
  if (fc.audience === 'friends') return 'All friends'
  const group = groups.find((g) => g.id === fc.groupId)
  return group ? groupName(group, people) : 'A group'
}

export function leadingOption(fc: FitCheck) {
  if (fc.options.length === 0) return undefined
  return fc.options.reduce((a, b) => (b.votes > a.votes ? b : a))
}

export function useFitCheck(id: string | undefined): FitCheck | undefined {
  return useStore((s) => s.fitChecks.find((c) => c.id === id))
}

// Who can comment and suggest looks: the creator's own circle. Community
// viewers who aren't the creator's friends can vote but not post.
export function canParticipate(fc: FitCheck, meId: string, friendIds: string[]): boolean {
  return (
    fc.createdBy === meId ||
    fc.memberIds.includes(meId) ||
    (fc.audience !== 'group' && friendIds.includes(fc.createdBy))
  )
}

// Can I send a borrow request for this piece? Either it's open to lending,
// or its owner offered it to me in a suggestion on one of my fit checks.
export function useCanBorrow(itemId: string | undefined): boolean {
  return useStore((s) => {
    const item = s.items.find((i) => i.id === itemId)
    if (!item || item.isPrivate || item.ownerId === s.user.id) return false
    if (!s.people.some((p) => p.id === item.ownerId)) return false
    if (item.lendable) return true
    return s.fitChecks.some(
      (c) =>
        c.createdBy === s.user.id &&
        c.suggestions.some((sg) => sg.authorId === item.ownerId && sg.lendItemIds.includes(item.id)),
    )
  })
}
