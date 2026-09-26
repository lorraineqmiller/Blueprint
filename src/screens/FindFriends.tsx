import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Card, ImagePlaceholder } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function FindFriends() {
  const nav = useNavigate()
  const discoverable = useStore((s) => s.discoverablePeople)
  const incoming = useStore((s) => s.friendRequestsIncoming)
  const outgoingIds = useStore((s) => s.friendRequestsOutgoingIds)
  const refreshFriendData = useStore((s) => s.refreshFriendData)
  const sendFriendRequest = useStore((s) => s.sendFriendRequest)
  const respondToFriendRequest = useStore((s) => s.respondToFriendRequest)

  useEffect(() => {
    refreshFriendData()
  }, [refreshFriendData])

  if (!isBackendEnabled) {
    return (
      <Screen withNav={false}>
        <TopBar title="Find Friends" onBack={() => nav(-1)} />
        <div className="px-5 py-5">
          <p className="text-sm text-neutral-600">
            This build has no backend connected, so there's no one else to find — Priya, Tessa, Amara, and Jules are
            already your friends in the local demo.
          </p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false}>
      <TopBar title="Find Friends" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        {incoming.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading text-lg font-semibold uppercase">Friend Requests</h2>
            <div className="mt-2 space-y-2">
              {incoming.map((p) => (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <ImagePlaceholder className="h-10 w-10 rounded-full" />
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

        <h2 className="font-heading text-lg font-semibold uppercase">People on Blueprint</h2>
        <p className="mt-1 text-sm text-neutral-600">Public profiles you're not connected with yet.</p>
        <div className="mt-2 space-y-2">
          {discoverable.map((p) => {
            const pending = outgoingIds.includes(p.id)
            return (
              <Card key={p.id} className="flex items-center gap-3 p-3">
                <ImagePlaceholder className="h-10 w-10 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-neutral-600">
                    {p.handle} · {p.school}
                  </div>
                </div>
                <button
                  disabled={pending}
                  onClick={() => sendFriendRequest(p.id)}
                  className="eyebrow rounded-md border border-accent-600 px-3 py-2 text-xs text-accent-600 disabled:border-neutral-400 disabled:text-neutral-500"
                >
                  {pending ? 'Requested' : 'Add'}
                </button>
              </Card>
            )
          })}
          {discoverable.length === 0 && <p className="text-sm text-neutral-500">No one else has joined yet.</p>}
        </div>
      </div>
    </Screen>
  )
}
