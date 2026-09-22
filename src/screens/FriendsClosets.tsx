import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Card, ImagePlaceholder } from '../components/ui'
import { useStore } from '../store'
import { ME } from '../data/seed'

export default function FriendsClosets() {
  const nav = useNavigate()
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const user = useStore((s) => s.user)

  const lendable = items.filter((i) => i.ownerId !== ME && i.lendable)

  return (
    <Screen>
      <div className="px-5 py-5">
        <h1 className="font-heading text-3xl font-semibold uppercase">Closets Near Me</h1>
        <p className="text-sm text-neutral-600">
          {user.school} · {people.length} friends · {lendable.length} lendable pieces
        </p>

        <div className="mt-4 rounded-md border border-accent-300 bg-accent-100 p-4 text-sm">
          <span className="font-heading text-2xl font-semibold text-accent-700">{lendable.length}</span>{' '}
          pieces you could borrow within a two-minute walk. Proximity is the whole unlock.
        </div>

        <div className="mt-4 space-y-3">
          {lendable.map((item) => {
            const owner = people.find((p) => p.id === item.ownerId)
            return (
              <button key={item.id} onClick={() => nav(`/borrow/${item.id}`)} className="block w-full text-left">
                <Card className="flex items-center gap-3 p-3">
                  <ImagePlaceholder className="h-14 w-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold uppercase">{item.name}</div>
                    <div className="truncate text-xs text-neutral-600">
                      {item.brand} · size {item.size}
                    </div>
                    <div className="truncate text-xs text-accent-600">
                      {owner?.name} · {owner?.distanceLabel}
                    </div>
                  </div>
                  <span className="text-neutral-400">›</span>
                </Card>
              </button>
            )
          })}
        </div>
      </div>
    </Screen>
  )
}
