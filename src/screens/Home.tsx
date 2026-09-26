import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Badge, Eyebrow, Photo } from '../components/ui'
import { useStore } from '../store'
import { useMyItems } from '../lib/selectors'
import { closetImpact } from '../lib/impact'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function Home() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const items = useMyItems()
  const chats = useStore((s) => s.chats)
  const people = useStore((s) => s.people)
  const allItems = useStore((s) => s.items)
  const impact = closetImpact(items)

  const votingChat = chats.find((c) => c.status === 'voting')
  const lendableFromFriends = allItems.filter((i) => i.ownerId !== user.id && i.lendable).slice(0, 4)

  const firstName = user.name.split(' ')[0]

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>Friday · Before the party</Eyebrow>
            <h1 className="font-heading text-3xl font-semibold uppercase">Hey {firstName}</h1>
          </div>
          <button onClick={() => nav('/profile')}>
            <Photo src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-md" />
          </button>
        </div>

        <button
          onClick={() => nav('/closet-impact')}
          className="grid-paper mt-5 block w-full rounded-md bg-navy p-5 text-left text-white"
        >
          <div className="flex items-center justify-between">
            <Eyebrow className="text-white/60">Closet Impact</Eyebrow>
            <span className="text-white/60">›</span>
          </div>
          <div className="font-heading mt-2 text-4xl font-semibold">{impact.co2Kg} kg</div>
          <p className="mt-1 text-sm text-white/70">
            Avoided by re-wearing and borrowing. You're top 8% at {user.school}.
          </p>
        </button>

        {votingChat && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold uppercase">Live Fit Check</h2>
              <Badge tone="light">
                {votingChat.options.reduce((a, o) => a + o.votes, 0)} votes in
              </Badge>
            </div>
            <button
              onClick={() => nav(`/chats/${votingChat.id}`)}
              className="block w-full rounded-md border border-neutral-300 bg-white p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-heading text-base font-semibold uppercase">{votingChat.title}</div>
                  <div className="text-sm text-neutral-600">
                    {votingChat.eventName} · {votingChat.location} · {votingChat.eventTime}
                  </div>
                </div>
                <Badge tone="accent">Vote Now</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {votingChat.options.slice(0, 2).map((o) => {
                  const total = votingChat.options.reduce((a, b) => a + b.votes, 0) || 1
                  const pct = Math.round((o.votes / total) * 100)
                  const optionImage = allItems.find((i) => i.id === o.itemIds[0])?.imageUrl
                  return (
                    <div key={o.id} className="overflow-hidden rounded-md border border-neutral-300">
                      <Photo src={optionImage} alt={o.label} className="h-28 w-full" />
                      <div className="eyebrow bg-navy px-2 py-1 text-[10px] text-white">{o.label}</div>
                      <div className="px-2 py-1 text-xs text-neutral-600">
                        {o.votes} votes · {pct}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </button>
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold uppercase">Nearby Closets</h2>
            <button onClick={() => nav('/closets-near-me')} className="eyebrow text-xs text-accent-600">
              See all
            </button>
          </div>
          {isBackendEnabled && people.length === 0 ? (
            <button
              onClick={() => nav('/friends')}
              className="block w-full rounded-md border border-dashed border-accent-300 bg-accent-100 p-4 text-left"
            >
              <div className="text-sm font-semibold text-accent-700">Add friends to see their closets</div>
              <p className="mt-1 text-xs text-ink">
                Once you're connected, their lendable pieces show up here — the closer, the better.
              </p>
            </button>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {lendableFromFriends.map((item) => (
                <button
                  key={item.id}
                  onClick={() => nav(`/borrow/${item.id}`)}
                  className="w-28 shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-white text-left"
                >
                  <div className="relative">
                    <Photo src={item.imageUrl} alt={item.name} className="h-28 w-full" />
                    <span className="eyebrow absolute left-1 top-1 rounded-sm bg-accent-600 px-1.5 py-0.5 text-[9px] text-white">
                      Lendable
                    </span>
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="truncate text-xs font-semibold">{item.name}</div>
                    <div className="truncate text-[10px] text-neutral-600">
                      {people.find((p) => p.id === item.ownerId)?.name}
                    </div>
                  </div>
                </button>
              ))}
              {lendableFromFriends.length === 0 && isBackendEnabled && (
                <p className="text-sm text-neutral-500">Nothing lendable from friends yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Screen>
  )
}
