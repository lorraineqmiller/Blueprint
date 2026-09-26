import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { ImagePlaceholder, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import { useMyItems } from '../lib/selectors'
import { closetImpact } from '../lib/impact'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function Profile() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const items = useMyItems()
  const requests = useStore((s) => s.borrowRequests)
  const people = useStore((s) => s.people)
  const setPublic = useStore((s) => s.setPublic)
  const setProfile = useStore((s) => s.setProfile)
  const signOut = useStore((s) => s.signOut)
  const impact = closetImpact(items)

  const [editingLocation, setEditingLocation] = useState(false)
  const [buildingDraft, setBuildingDraft] = useState(user.building)
  const [floorDraft, setFloorDraft] = useState(user.floor)

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
            {user.building && (
              <div className="text-xs text-neutral-500">
                {user.building}
                {user.floor ? ` · Floor ${user.floor}` : ''}
              </div>
            )}
          </div>
        </div>

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

        <div className="mt-4 border-t border-neutral-300 pt-4">
          {editingLocation ? (
            <div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="eyebrow mb-1 text-[11px] text-neutral-600">Building</div>
                  <input
                    value={buildingDraft}
                    onChange={(e) => setBuildingDraft(e.target.value)}
                    placeholder="Sulzberger Hall"
                    className="w-full rounded-md border border-neutral-400 bg-white px-3 py-2 text-sm outline-none focus:border-accent-600"
                  />
                </div>
                <div className="w-20">
                  <div className="eyebrow mb-1 text-[11px] text-neutral-600">Floor</div>
                  <input
                    value={floorDraft}
                    onChange={(e) => setFloorDraft(e.target.value)}
                    placeholder="7"
                    className="w-full rounded-md border border-neutral-400 bg-white px-3 py-2 text-sm outline-none focus:border-accent-600"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={() => {
                    setProfile({ building: buildingDraft, floor: floorDraft })
                    setEditingLocation(false)
                  }}
                >
                  Save
                </PrimaryButton>
                <button
                  onClick={() => setEditingLocation(false)}
                  className="eyebrow rounded-md border border-neutral-400 text-xs text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Location</div>
                <p className="text-xs text-neutral-600">
                  {user.building ? `${user.building}${user.floor ? ` · Floor ${user.floor}` : ''}` : 'Not set'}
                </p>
              </div>
              <button
                onClick={() => {
                  setBuildingDraft(user.building)
                  setFloorDraft(user.floor)
                  setEditingLocation(true)
                }}
                className="eyebrow rounded-md border border-neutral-400 px-3 py-2 text-[11px] text-ink"
              >
                Edit
              </button>
            </div>
          )}
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
