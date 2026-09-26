import { useState } from 'react'
import { Screen } from '../components/Shell'
import { Card, ImagePlaceholder, PrimaryButton, SecondaryButton } from '../components/ui'
import { useStore } from '../store'
import type { BorrowStatus } from '../types'

const statusStyle: Record<BorrowStatus, string> = {
  waiting: 'border-accent-500 text-accent-600',
  approved: 'border-emerald-500 text-emerald-600',
  declined: 'border-neutral-400 text-neutral-500',
  returned: 'border-neutral-400 text-neutral-500',
}

export default function Borrows() {
  const [tab, setTab] = useState<'lending' | 'borrowing'>('lending')
  const requests = useStore((s) => s.borrowRequests)
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const respond = useStore((s) => s.respondToBorrowRequest)
  const markReturned = useStore((s) => s.markReturned)
  const user = useStore((s) => s.user)

  const list = requests.filter((r) => (tab === 'lending' ? r.ownerId === user.id : r.requesterId === user.id))

  return (
    <Screen>
      <div className="px-5 py-5">
        <h1 className="font-heading text-3xl font-semibold uppercase">Borrows</h1>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab('lending')}
            className={`eyebrow rounded-md border py-3 text-xs ${
              tab === 'lending' ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
            }`}
          >
            Lending
          </button>
          <button
            onClick={() => setTab('borrowing')}
            className={`eyebrow rounded-md border py-3 text-xs ${
              tab === 'borrowing' ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
            }`}
          >
            Borrowing
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {list.length === 0 && <p className="text-sm text-neutral-600">Nothing here yet.</p>}
          {list.map((r) => {
            const item = items.find((i) => i.id === r.itemId)
            const other = people.find((p) => p.id === (tab === 'lending' ? r.requesterId : r.ownerId))
            if (!item) return null
            return (
              <Card key={r.id} className="p-4">
                <div className="flex gap-3">
                  <ImagePlaceholder className="h-14 w-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-base font-semibold uppercase">{item.name}</span>
                      <span className={`eyebrow rounded-sm border px-2 py-0.5 text-[10px] ${statusStyle[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      {other?.name} {tab === 'lending' ? 'asked' : ''} · {r.dateRangeLabel}
                    </p>
                    <p className="mt-1 text-sm italic text-neutral-700">"{r.note}"</p>
                  </div>
                </div>
                {tab === 'lending' && r.status === 'waiting' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <PrimaryButton onClick={() => respond(r.id, 'approved')}>Approve</PrimaryButton>
                    <SecondaryButton onClick={() => respond(r.id, 'declined')}>Decline</SecondaryButton>
                  </div>
                )}
                {r.status === 'approved' && (
                  <div className="mt-3">
                    <SecondaryButton onClick={() => markReturned(r.id)}>Mark returned</SecondaryButton>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </Screen>
  )
}
