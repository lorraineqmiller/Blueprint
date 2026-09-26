import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Card, ImagePlaceholder } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'
import { isSameBuilding, isSameFloor, proximityLabel } from '../lib/proximity'

export default function FriendsClosets() {
  const nav = useNavigate()
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const user = useStore((s) => s.user)

  const lendable = items
    .filter((i) => i.ownerId !== user.id && i.lendable)
    .map((item) => ({ item, owner: people.find((p) => p.id === item.ownerId) }))
    .sort((a, b) => {
      const rank = (p: typeof a.owner) => (!p ? 2 : isSameFloor(user, p) ? 0 : isSameBuilding(user, p) ? 1 : 2)
      return rank(a.owner) - rank(b.owner)
    })

  const onYourFloor = people.filter((p) => isSameFloor(user, p))
  const inYourBuilding = people.filter((p) => isSameBuilding(user, p) && !isSameFloor(user, p))

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold uppercase">Closets Near Me</h1>
          {isBackendEnabled && (
            <button onClick={() => nav('/friends')} className="eyebrow text-xs text-accent-600">
              Friends
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-600">
          {user.school} · {people.length} friends · {lendable.length} lendable pieces
        </p>

        <div className="mt-4 rounded-md border border-accent-300 bg-accent-100 p-4 text-sm">
          <span className="font-heading text-2xl font-semibold text-accent-700">{lendable.length}</span>{' '}
          pieces you could borrow within a two-minute walk. Proximity is the whole unlock.
        </div>

        {(onYourFloor.length > 0 || inYourBuilding.length > 0) && (
          <div className="mt-4">
            <h2 className="font-heading text-lg font-semibold uppercase">Friends Nearby</h2>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {onYourFloor.map((p) => (
                <div key={p.id} className="shrink-0 rounded-md border border-accent-300 bg-accent-100 px-3 py-2 text-center">
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="eyebrow text-[10px] text-accent-700">Same floor</div>
                </div>
              ))}
              {inYourBuilding.map((p) => (
                <div key={p.id} className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-2 text-center">
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="eyebrow text-[10px] text-neutral-500">Same building</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {lendable.map(({ item, owner }) => (
            <button key={item.id} onClick={() => nav(`/borrow/${item.id}`)} className="block w-full text-left">
              <Card className="flex items-center gap-3 p-3">
                <ImagePlaceholder className="h-14 w-14 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold uppercase">{item.name}</div>
                  <div className="truncate text-xs text-neutral-600">
                    {item.brand} · size {item.size}
                  </div>
                  <div className="truncate text-xs text-accent-600">
                    {owner?.name} · {owner ? proximityLabel(user, owner) : 'Unknown'}
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Card>
            </button>
          ))}
          {lendable.length === 0 && isBackendEnabled && (
            <p className="text-sm text-neutral-500">
              Nothing here yet — once a friend marks something lendable, it'll show up in this list.
            </p>
          )}
        </div>
      </div>
    </Screen>
  )
}
