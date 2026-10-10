import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Avatar, Card, Photo } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'
import { isSameBuilding, NEARBY_METERS, proximityLabel, walkingLabel } from '../lib/proximity'
import type { Person } from '../types'

export default function FriendsClosets() {
  const nav = useNavigate()
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const user = useStore((s) => s.user)
  const distances = useStore((s) => s.distances)
  const buildings = useStore((s) => s.buildings)

  // Same building counts as zero even if the rounded distance says 100 m;
  // unknown distance sorts last.
  const distanceTo = (p: Person | undefined) =>
    !p ? Infinity : isSameBuilding(user, p) ? 0 : (distances[p.id] ?? Infinity)

  // Friends' lendable pieces only — items from a stranger's public fit
  // check can be in the store too, but aren't borrowable.
  const lendable = items
    .filter((i) => i.ownerId !== user.id && i.lendable && !i.isPrivate)
    .map((item) => ({ item, owner: people.find((p) => p.id === item.ownerId) }))
    .filter(({ owner }) => owner)
    .sort((a, b) => distanceTo(a.owner) - distanceTo(b.owner))

  const nearby = people.filter((p) => distanceTo(p) <= NEARBY_METERS).sort((a, b) => distanceTo(a) - distanceTo(b))

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold uppercase">Your Friends' Closets</h1>
          {isBackendEnabled && (
            <button onClick={() => nav('/friends')} className="eyebrow text-xs text-accent-600">
              Friends
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-600">
          {user.school ? `${user.school} · ` : ''}
          {people.length} friends · {lendable.length} lendable pieces
        </p>

        <div className="mt-4 rounded-md border border-accent-300 bg-accent-100 p-4 text-sm">
          <span className="font-heading text-2xl font-semibold text-accent-700">{lendable.length}</span>{' '}
          pieces you could borrow from friends.
        </div>

        {nearby.length > 0 && (
          <div className="mt-4">
            <h2 className="font-heading text-lg font-semibold uppercase">Friends Close By</h2>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {nearby.map((p) => {
                const same = isSameBuilding(user, p)
                return (
                  <button
                    key={p.id}
                    onClick={() => nav(`/friends/${p.id}`)}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center ${
                      same ? 'border-accent-300 bg-accent-100' : 'border-neutral-300 bg-white'
                    }`}
                  >
                    <Avatar src={p.avatarUrl} name={p.name} className="h-8 w-8" />
                    <div className="mt-1 text-xs font-semibold">{p.name}</div>
                    <div className={`eyebrow text-[10px] ${same ? 'text-accent-700' : 'text-neutral-500'}`}>
                      {same ? 'Same building' : walkingLabel(distanceTo(p))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {lendable.map(({ item, owner }) => (
            <button key={item.id} onClick={() => nav(`/borrow/${item.id}`)} className="block w-full text-left">
              <Card className="flex items-center gap-3 p-3">
                <Photo src={item.imageUrl} alt={item.name} className="h-14 w-14 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold uppercase">{item.name}</div>
                  <div className="truncate text-xs text-neutral-600">
                    {item.brand} · size {item.size}
                  </div>
                  <div className="truncate text-xs text-accent-600">
                    {owner?.name} · {owner ? proximityLabel(user, owner, distances[owner.id], buildings) : 'Unknown'}
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Card>
            </button>
          ))}
          {lendable.length === 0 && isBackendEnabled && people.length === 0 && (
            <button
              onClick={() => nav('/friends')}
              className="block w-full rounded-xl border border-dashed border-accent-300 bg-accent-100 p-4 text-left"
            >
              <div className="text-sm font-semibold text-accent-700">You haven't added any friends yet</div>
              <p className="mt-1 text-xs text-ink">Find people on Blueprint to start browsing lendable closets.</p>
            </button>
          )}
          {lendable.length === 0 && isBackendEnabled && people.length > 0 && (
            <p className="text-sm text-neutral-500">
              Nothing here yet — once a friend marks something lendable, it'll show up in this list.
            </p>
          )}
        </div>
      </div>
    </Screen>
  )
}
