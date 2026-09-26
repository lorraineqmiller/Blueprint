import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Card, Photo } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'

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
            <Card key={p.id} className="flex items-center gap-3 p-3">
              <Photo src={p.avatarUrl} alt={p.name} rounded className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="truncate text-xs text-neutral-600">
                  {p.handle} · {p.school}
                </div>
              </div>
            </Card>
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
                      <Photo src={p.avatarUrl} alt={p.name} rounded className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="truncate text-xs text-neutral-600">{p.school}</div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => respondToFriendRequest(p.id, 'accepted')}
                          className="eyebrow rounded-md bg-accent-700 px-3 py-2 text-xs text-white"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToFriendRequest(p.id, 'declined')}
                          className="eyebrow rounded-md border border-neutral-400 px-3 py-2 text-xs text-ink"
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
              <h2 className="font-heading text-lg font-semibold uppercase">Suggestions</h2>
              <p className="mt-1 text-sm text-neutral-600">Public profiles you're not connected with yet.</p>
              <div className="mt-2 space-y-2">
                {discoverable.map((p) => {
                  const pending = outgoingIds.includes(p.id)
                  return (
                    <Card key={p.id} className="flex items-center gap-3 p-3">
                      <Photo src={p.avatarUrl} alt={p.name} rounded className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="truncate text-xs text-neutral-600">
                          {p.handle} · {p.school}
                        </div>
                      </div>
                      <button
                        disabled={pending}
                        onClick={() => sendFriendRequest(p.id)}
                        className="eyebrow shrink-0 rounded-md border border-accent-600 px-3 py-2 text-xs text-accent-600 disabled:border-neutral-400 disabled:text-neutral-500"
                      >
                        {pending ? 'Requested' : 'Add'}
                      </button>
                    </Card>
                  )
                })}
                {discoverable.length === 0 && <p className="text-sm text-neutral-500">No one else has joined yet.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
