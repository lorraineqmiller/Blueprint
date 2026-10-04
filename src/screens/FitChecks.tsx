import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Avatar, Card } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'
import { audienceLabel, closesLabel, isOpen, useNow } from '../lib/fitChecks'
import { communityName } from '../data/communities'
import type { FitCheck } from '../types'

export default function FitChecks() {
  const nav = useNavigate()
  const now = useNow()
  const fitChecks = useStore((s) => s.fitChecks)
  const user = useStore((s) => s.user)
  const people = useStore((s) => s.people)
  const groups = useStore((s) => s.friendGroups)
  const refreshFitChecks = useStore((s) => s.refreshFitChecks)

  useEffect(() => {
    refreshFitChecks()
  }, [refreshFitChecks])

  // Open ones first, then most recent activity.
  const sorted = [...fitChecks].sort((a, b) => {
    const open = Number(isOpen(b, now)) - Number(isOpen(a, now))
    return open !== 0 ? open : a.lastMessageAt < b.lastMessageAt ? 1 : -1
  })
  const isFriendOrMember = (c: FitCheck) => people.some((p) => p.id === c.createdBy) || c.memberIds.includes(user.id)
  const mine = sorted.filter((c) => c.createdBy === user.id)
  const fromFriends = sorted.filter((c) => c.createdBy !== user.id && isFriendOrMember(c))
  const fromCommunity = sorted.filter((c) => c.createdBy !== user.id && !isFriendOrMember(c))
  const community = communityName(user.communityId)

  const card = (c: FitCheck) => {
    const open = isOpen(c, now)
    const creator = c.createdBy === user.id ? null : (people.find((p) => p.id === c.createdBy) ?? c.participants?.find((p) => p.id === c.createdBy))
    // On your own it's a status; on someone else's it's what they want from you.
    const badge = !open
      ? c.status === 'decided'
        ? 'Decided'
        : 'Closed'
      : c.createdBy === user.id
        ? c.mode === 'ideas'
          ? `${c.suggestions.length} idea${c.suggestions.length === 1 ? '' : 's'}`
          : 'Voting'
        : c.mode === 'ideas'
          ? 'Send ideas'
          : 'Vote'
    return (
      <button
        key={c.id}
        onClick={() => nav(c.status === 'decided' ? `/fit-checks/${c.id}/confirmed` : `/fit-checks/${c.id}`)}
        className="block w-full text-left"
      >
        <Card className="flex gap-3 p-4">
          {creator && <Avatar src={creator.avatarUrl} name={creator.name} className="h-10 w-10" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-heading truncate text-base font-semibold uppercase">{c.eventName}</span>
              <span
                className={`eyebrow shrink-0 rounded-sm border px-2 py-0.5 text-[10px] ${
                  open ? 'border-accent-600 text-accent-600' : 'border-neutral-400 text-neutral-500'
                }`}
              >
                {badge}
              </span>
            </div>
            {c.vibe && <p className="truncate text-xs text-neutral-600">{c.vibe}</p>}
            <p className="mt-1 truncate text-sm text-neutral-700">{c.lastMessagePreview}</p>
            <p className="eyebrow mt-1.5 truncate text-[10px] text-neutral-500">
              {creator ? creator.name : audienceLabel(c, groups, people, user.communityId)} · {closesLabel(c, now)}
            </p>
          </div>
        </Card>
      </button>
    )
  }

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold uppercase">Fit Checks</h1>
            <p className="text-sm text-neutral-600">Where outfits actually get decided</p>
          </div>
          <button
            onClick={() => nav('/fit-checks/new')}
            aria-label="Start a fit check"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-600 text-xl text-white"
          >
            +
          </button>
        </div>

        <button
          onClick={() => nav('/fit-checks/groups')}
          className="mt-4 flex w-full items-center justify-between rounded-md border border-neutral-300 bg-white px-4 py-3 text-left"
        >
          <div>
            <div className="text-sm font-semibold">Your groups</div>
            <p className="text-xs text-neutral-600">
              {groups.length ? `${groups.length} group${groups.length === 1 ? '' : 's'} you ask for advice` : 'Make a group of friends you always ask'}
            </p>
          </div>
          <span className="text-neutral-400">›</span>
        </button>

        {fromFriends.length > 0 && (
          <>
            <h2 className="font-heading mt-6 text-lg font-semibold uppercase">From Friends</h2>
            <div className="mt-2 space-y-3">{fromFriends.map(card)}</div>
          </>
        )}

        <h2 className="font-heading mt-6 text-lg font-semibold uppercase">Yours</h2>
        <div className="mt-2 space-y-3">
          {mine.map(card)}
          <button
            onClick={() => nav('/fit-checks/new')}
            className="eyebrow block w-full rounded-md border border-dashed border-neutral-400 py-4 text-center text-sm text-accent-600"
          >
            + Start a fit check
          </button>
        </div>

        {isBackendEnabled && community && (
          <>
            <h2 className="font-heading mt-6 text-lg font-semibold uppercase">Around {community}</h2>
            <p className="text-sm text-neutral-600">Public fit checks from your school. Anyone here can vote.</p>
            <div className="mt-2 space-y-3">
              {fromCommunity.map(card)}
              {fromCommunity.length === 0 && <p className="text-sm text-neutral-500">Nothing right now.</p>}
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
