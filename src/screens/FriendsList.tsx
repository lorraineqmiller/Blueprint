import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Avatar, Card } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'
import { communityName } from '../data/communities'
import { proximityLabel } from '../lib/proximity'

export default function FriendsList() {
  const nav = useNavigate()
  const people = useStore((s) => s.people)
  const incoming = useStore((s) => s.friendRequestsIncoming)
  const outgoingIds = useStore((s) => s.friendRequestsOutgoingIds)
  const discoverable = useStore((s) => s.discoverablePeople)
  const refreshFriendData = useStore((s) => s.refreshFriendData)
  const sendFriendRequest = useStore((s) => s.sendFriendRequest)
  const respondToFriendRequest = useStore((s) => s.respondToFriendRequest)
  const subscribeToFriendsRealtime = useStore((s) => s.subscribeToFriendsRealtime)
  const user = useStore((s) => s.user)
  const distances = useStore((s) => s.distances)
  const buildings = useStore((s) => s.buildings)
  const [search, setSearch] = useState('')

  const community = communityName(user.communityId)
  const query = search.trim().toLowerCase().replace(/^@/, '')
  // Search reaches everyone; with no search, suggestions are your own
  // school community first (or everyone, until you've verified one).
  const suggestions = query
    ? discoverable.filter((p) => p.name.toLowerCase().includes(query) || p.handle.toLowerCase().includes(query))
    : user.communityId
      ? discoverable.filter((p) => p.communityId === user.communityId)
      : discoverable

  useEffect(() => {
    refreshFriendData()
    return subscribeToFriendsRealtime()
  }, [refreshFriendData, subscribeToFriendsRealtime])

  return (
    <Screen withNav={false}>
      <TopBar title="Friends" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <h2 className="font-heading text-lg font-semibold uppercase">Your Friends</h2>
        <div className="mt-2 space-y-2">
          {people.map((p) => (
            <button key={p.id} onClick={() => nav(`/friends/${p.id}`)} className="block w-full text-left">
              <Card className="flex items-center gap-3 p-3">
                <Avatar src={p.avatarUrl} name={p.name} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-neutral-600">
                    {p.handle} · {proximityLabel(user, p, distances[p.id], buildings)}
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Card>
            </button>
          ))}
          {people.length === 0 && <p className="text-sm text-neutral-500">No friends yet.</p>}
        </div>

        {!isBackendEnabled && (
          <p className="mt-4 text-sm text-neutral-600">
            This build has no backend connected, so there's no one else to find or request — the people above are
            fixed for the local demo.
          </p>
        )}

        {isBackendEnabled && (
          <>
            {incoming.length > 0 && (
              <div className="mt-6">
                <h2 className="font-heading text-lg font-semibold uppercase">Friend Requests</h2>
                <div className="mt-2 space-y-2">
                  {incoming.map((p) => (
                    <Card key={p.id} className="flex items-center gap-3 p-3">
                      <Avatar src={p.avatarUrl} name={p.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="truncate text-xs text-neutral-600">{p.handle}{p.school ? ` · ${p.school}` : ''}</div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => respondToFriendRequest(p.id, 'accepted')}
                          className="eyebrow rounded-xl bg-accent-700 px-3 py-2 text-xs text-white"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToFriendRequest(p.id, 'declined')}
                          className="eyebrow rounded-xl border border-neutral-400 px-3 py-2 text-xs text-ink"
                        >
                          Decline
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="font-heading text-lg font-semibold uppercase">Find Friends</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or @username"
                className="mt-2 w-full rounded-xl border border-neutral-400 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-600"
              />
              {!query && (
                <p className="mt-2 text-xs text-neutral-600">
                  {community ? `People at ${community}.` : 'Everyone on Blueprint.'}
                </p>
              )}
              {!query && !community && (
                <button
                  onClick={() => nav('/verify-school')}
                  className="mt-2 block w-full rounded-xl border border-dashed border-accent-300 bg-accent-100 p-3 text-left"
                >
                  <div className="text-sm font-semibold text-accent-700">Verify your school email</div>
                  <p className="text-xs text-ink">Join the Columbia/Barnard community to see classmates first.</p>
                </button>
              )}
              <div className="mt-2 space-y-2">
                {suggestions.map((p) => {
                  const pending = outgoingIds.includes(p.id)
                  return (
                    <Card key={p.id} className="flex items-center gap-3 p-3">
                      <Avatar src={p.avatarUrl} name={p.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {p.name}
                          {!p.isPublic && <span className="ml-1 text-[10px] font-normal text-neutral-500">· Private</span>}
                        </div>
                        <div className="truncate text-xs text-neutral-600">
                          {p.handle}
                          {p.school ? ` · ${p.school}` : ''}
                        </div>
                      </div>
                      <button
                        disabled={pending}
                        onClick={() => sendFriendRequest(p.id)}
                        className="eyebrow shrink-0 rounded-xl border border-accent-600 px-3 py-2 text-xs text-accent-600 disabled:border-neutral-400 disabled:text-neutral-500"
                      >
                        {pending ? 'Requested' : 'Add'}
                      </button>
                    </Card>
                  )
                })}
                {suggestions.length === 0 && (
                  <p className="text-sm text-neutral-500">{query ? 'No one matches that.' : 'No one else has joined yet.'}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
