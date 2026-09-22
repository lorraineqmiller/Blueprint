import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { ImagePlaceholder } from '../components/ui'
import { useStore } from '../store'
import { useMyItems } from '../lib/selectors'
import { closetImpact } from '../lib/impact'

export default function Profile() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const items = useMyItems()
  const requests = useStore((s) => s.borrowRequests)
  const people = useStore((s) => s.people)
  const setPublic = useStore((s) => s.setPublic)
  const impact = closetImpact(items)

  const borrowsCount = requests.filter((r) => r.requesterId === user.id || r.ownerId === user.id).length
  const recentlyAdded = [...items].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1)).slice(0, 3)

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <ImagePlaceholder className="h-16 w-16 rounded-full" />
          <div>
            <div className="font-heading text-lg font-semibold">{user.handle}</div>
            <div className="text-sm text-neutral-600">
              {user.school} · {user.classYear}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-neutral-300 bg-white py-3 text-center">
            <div className="font-heading text-2xl font-semibold">{items.length}</div>
            <div className="eyebrow text-[10px] text-neutral-600">Pieces</div>
          </div>
          <div className="rounded-md border border-neutral-300 bg-white py-3 text-center">
            <div className="font-heading text-2xl font-semibold">{people.length}</div>
            <div className="eyebrow text-[10px] text-neutral-600">Friends</div>
          </div>
          <div className="rounded-md border border-neutral-300 bg-white py-3 text-center">
            <div className="font-heading text-2xl font-semibold">{borrowsCount}</div>
            <div className="eyebrow text-[10px] text-neutral-600">Borrows</div>
          </div>
        </div>

        <button
          onClick={() => nav('/closet-impact')}
          className="mt-4 flex w-full items-center justify-between rounded-md border border-accent-300 bg-accent-100 p-4 text-left"
        >
          <div>
            <span className="font-heading text-lg font-semibold text-accent-700">{impact.co2Kg} kg avoided</span>
            <p className="text-sm text-ink">See the full impact report</p>
          </div>
          <span className="text-accent-700">›</span>
        </button>

        <button
          onClick={() => nav('/plus')}
          className="grid-paper mt-4 block w-full rounded-md bg-navy p-5 text-left text-white"
        >
          <div className="font-heading text-lg font-semibold uppercase">Blueprint Plus</div>
          <p className="mt-1 text-sm text-white/70">
            Deeper closet analytics, unlimited fit checks, early features.
          </p>
        </button>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold uppercase">Recently Added</h2>
          <button onClick={() => nav('/closet')} className="eyebrow text-xs text-accent-600">
            My Closet
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {recentlyAdded.map((item) => (
            <button key={item.id} onClick={() => nav(`/closet/${item.id}`)} className="overflow-hidden rounded-md border border-neutral-300 bg-white text-left">
              <ImagePlaceholder className="h-24 w-full" />
              <div className="truncate px-2 py-1 text-[11px] font-semibold uppercase">{item.name}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-neutral-300 pt-4">
          <div>
            <div className="text-sm font-semibold">Profile visibility</div>
            <p className="text-xs text-neutral-600">{user.isPublic ? 'Public — friends can browse your closet' : 'Private — only you can see it'}</p>
          </div>
          <button
            onClick={() => setPublic(!user.isPublic)}
            className={`eyebrow rounded-md border px-3 py-2 text-[11px] ${
              user.isPublic ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
            }`}
          >
            {user.isPublic ? 'Public' : 'Private'}
          </button>
        </div>
      </div>
    </Screen>
  )
}
