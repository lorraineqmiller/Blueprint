import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Avatar, Photo } from '../components/ui'
import { useStore } from '../store'
import { useMyItems } from '../lib/selectors'
import { closetImpact } from '../lib/impact'
import { locationName } from '../lib/proximity'
import { communityName } from '../data/communities'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function Profile() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const items = useMyItems()
  const requests = useStore((s) => s.borrowRequests)
  const people = useStore((s) => s.people)
  const buildings = useStore((s) => s.buildings)
  const signOut = useStore((s) => s.signOut)
  const impact = closetImpact(items)
  const place = locationName(user, buildings)
  const community = communityName(user.communityId)

  const borrowsCount = requests.filter((r) => r.requesterId === user.id || r.ownerId === user.id).length
  const recentlyAdded = [...items].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1)).slice(0, 3)

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.name} className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <div className="font-heading truncate text-lg font-semibold">{user.name}</div>
            <div className="truncate text-sm text-neutral-600">{user.handle}</div>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {community && (
                <span className="eyebrow rounded-sm bg-navy px-1.5 py-0.5 text-[9px] text-white">{user.school}</span>
              )}
              <span className="eyebrow rounded-sm bg-neutral-200 px-1.5 py-0.5 text-[9px] text-neutral-700">
                {user.isPublic ? 'Public' : 'Private'}
              </span>
              {place && <span className="eyebrow rounded-sm bg-neutral-200 px-1.5 py-0.5 text-[9px] text-neutral-700">{place}</span>}
            </div>
          </div>
        </div>
        {user.bio && <p className="mt-3 text-sm text-ink">{user.bio}</p>}
        <button
          onClick={() => nav('/profile/edit')}
          className="eyebrow mt-3 w-full rounded-md border border-neutral-400 bg-white py-2.5 text-center text-xs tracking-wide text-ink"
        >
          Edit profile
        </button>
        {!community && (
          <button
            onClick={() => nav('/verify-school')}
            className="mt-3 block w-full rounded-md border border-dashed border-accent-300 bg-accent-100 p-3 text-left"
          >
            <div className="text-sm font-semibold text-accent-700">Join your school community</div>
            <p className="text-xs text-ink">Verify your Columbia or Barnard email to find classmates.</p>
          </button>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-neutral-300 bg-white py-3 text-center">
            <div className="font-heading text-2xl font-semibold">{items.length}</div>
            <div className="eyebrow text-[10px] text-neutral-600">Pieces</div>
          </div>
          <button
            onClick={() => nav('/friends')}
            className="rounded-md border border-neutral-300 bg-white py-3 text-center"
          >
            <div className="font-heading text-2xl font-semibold">{people.length}</div>
            <div className="eyebrow text-[10px] text-neutral-600">Friends</div>
          </button>
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
              <Photo src={item.imageUrl} alt={item.name} className="h-24 w-full" />
              <div className="truncate px-2 py-1 text-[11px] font-semibold uppercase">{item.name}</div>
            </button>
          ))}
        </div>

        {isBackendEnabled && (
          <button
            onClick={async () => {
              await signOut()
              nav('/')
            }}
            className="eyebrow mt-4 w-full py-2 text-center text-xs tracking-wide text-neutral-500"
          >
            Sign out
          </button>
        )}
      </div>
    </Screen>
  )
}
