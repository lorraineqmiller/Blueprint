import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Avatar, Photo } from '../components/ui'
import { usePersonById, useProximityLabel } from '../lib/selectors'
import { useStore } from '../store'

// A friend's closet: everything they haven't marked private. Pieces they've
// opened to lending link through to a borrow request; the rest are just to
// look at. Only reachable for friends — RLS wouldn't return anyone else's
// items anyway.
export default function FriendCloset() {
  const nav = useNavigate()
  const { personId } = useParams()
  const person = usePersonById(personId)
  const proximity = useProximityLabel(person)
  const allItems = useStore((s) => s.items)

  if (!person) return null
  const items = allItems.filter((i) => i.ownerId === person.id && !i.isPrivate)
  const lendableCount = items.filter((i) => i.lendable).length

  return (
    <Screen withNav={false}>
      <TopBar title={person.name} onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <Avatar src={person.avatarUrl} name={person.name} className="h-16 w-16" />
          <div className="min-w-0">
            <div className="font-heading truncate text-lg font-semibold">{person.name}</div>
            <div className="truncate text-sm text-neutral-600">{person.handle}</div>
            <div className="truncate text-xs text-accent-600">{proximity}</div>
          </div>
        </div>
        {person.bio && <p className="mt-3 text-sm text-ink">{person.bio}</p>}

        <div className="mt-5 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-semibold uppercase">Their Closet</h2>
          <span className="text-xs text-neutral-600">
            {items.length} pieces · {lendableCount} lendable
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              disabled={!item.lendable}
              onClick={() => nav(`/borrow/${item.id}`)}
              className="overflow-hidden rounded-xl border border-neutral-300 bg-white text-left"
            >
              <div className="relative">
                <Photo src={item.imageUrl} alt={item.name} className="h-36 w-full" />
                <span
                  className={`eyebrow absolute left-1 top-1 rounded-sm px-1.5 py-0.5 text-[9px] ${
                    item.lendable ? 'bg-accent-600 text-white' : 'bg-white/90 text-neutral-600'
                  }`}
                >
                  {item.lendable ? 'Lendable' : 'Not lending'}
                </span>
              </div>
              <div className="px-2 py-2">
                <div className="truncate text-sm font-semibold uppercase">{item.name}</div>
                <div className="truncate text-xs text-neutral-600">
                  {item.brand} · size {item.size}
                </div>
              </div>
            </button>
          ))}
        </div>
        {items.length === 0 && <p className="mt-2 text-sm text-neutral-500">Nothing in their closet yet.</p>}
      </div>
    </Screen>
  )
}
