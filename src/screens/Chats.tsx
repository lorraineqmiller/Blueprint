import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Avatar, Card } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function Chats() {
  const nav = useNavigate()
  const chats = useStore((s) => s.chats)
  const publicChats = useStore((s) => s.publicChats)
  const refreshPublicChats = useStore((s) => s.refreshPublicChats)

  useEffect(() => {
    refreshPublicChats()
  }, [refreshPublicChats])

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold uppercase">Group Chats</h1>
            <p className="text-sm text-neutral-600">Where outfits actually get decided</p>
          </div>
          <button
            onClick={() => nav('/chats/new')}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-600 text-xl text-white"
          >
            +
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => nav(c.status === 'voting' ? `/chats/${c.id}` : `/chats/${c.id}/confirmed`)}
              className="block w-full text-left"
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-base font-semibold uppercase">
                    {c.title}
                    {c.audience === 'public' && (
                      <span className="eyebrow ml-2 align-middle text-[9px] font-normal text-neutral-500">Public</span>
                    )}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-neutral-700">{c.lastMessagePreview}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="eyebrow text-[10px] text-neutral-500">
                    {c.eventName.toUpperCase()} · {c.location.toUpperCase()} · {c.eventTime.toUpperCase()}
                  </span>
                  <span
                    className={`eyebrow rounded-sm border px-2 py-0.5 text-[10px] ${
                      c.status === 'voting' ? 'border-accent-600 text-accent-600' : 'border-neutral-400 text-neutral-500'
                    }`}
                  >
                    {c.status === 'voting' ? 'Vote Live' : 'Decided'}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>

        <button
          onClick={() => nav('/chats/new')}
          className="eyebrow mt-3 block w-full rounded-md border border-dashed border-neutral-400 py-4 text-center text-sm text-accent-600"
        >
          + Start a fit check
        </button>

        {isBackendEnabled && (
          <div className="mt-6">
            <h2 className="font-heading text-lg font-semibold uppercase">Public Fit Checks</h2>
            <p className="text-sm text-neutral-600">From people outside your chats. Anyone can vote.</p>
            <div className="mt-2 space-y-3">
              {[...publicChats]
                .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
                .map((c) => {
                  const creator = c.participants?.find((p) => p.id === c.createdBy)
                  const votes = c.options.reduce((a, o) => a + o.votes, 0)
                  return (
                    <button key={c.id} onClick={() => nav(`/chats/${c.id}`)} className="block w-full text-left">
                      <Card className="flex items-center gap-3 p-4">
                        <Avatar src={creator?.avatarUrl} name={creator?.name ?? '?'} className="h-10 w-10" />
                        <div className="min-w-0 flex-1">
                          <div className="font-heading truncate text-base font-semibold uppercase">{c.eventName}</div>
                          <p className="truncate text-xs text-neutral-600">
                            {creator?.name ?? 'Someone'} · {votes} vote{votes === 1 ? '' : 's'}
                          </p>
                        </div>
                        <span
                          className={`eyebrow rounded-sm border px-2 py-0.5 text-[10px] ${
                            c.status === 'voting' ? 'border-accent-600 text-accent-600' : 'border-neutral-400 text-neutral-500'
                          }`}
                        >
                          {c.status === 'voting' ? 'Vote' : 'Decided'}
                        </span>
                      </Card>
                    </button>
                  )
                })}
              {publicChats.length === 0 && <p className="text-sm text-neutral-500">No public fit checks right now.</p>}
            </div>
          </div>
        )}
      </div>
    </Screen>
  )
}
