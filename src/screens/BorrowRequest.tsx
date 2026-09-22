import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { ImagePlaceholder, PrimaryButton, SegmentedControl, StatTile } from '../components/ui'
import { useItemById, usePersonById } from '../lib/selectors'
import { borrowImpact } from '../lib/impact'
import { useStore } from '../store'
import type { BorrowRequest as BorrowRequestType } from '../types'

const noteOptions = [
  'gig at Baby’s All Right — will guard them with my life',
  'formal on Friday, back to you Saturday morning',
  'warehouse party, returning them clean Sunday',
]

export default function BorrowRequest() {
  const nav = useNavigate()
  const { itemId } = useParams()
  const item = useItemById(itemId)
  const owner = usePersonById(item?.ownerId)
  const sendBorrowRequest = useStore((s) => s.sendBorrowRequest)

  const [when, setWhen] = useState<BorrowRequestType['whenNeeded']>('This Weekend')
  const [note, setNote] = useState(noteOptions[0])
  const [sent, setSent] = useState(false)

  if (!item || !owner) return null
  const impact = borrowImpact(item.priceCents)

  if (sent) {
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Borrow Request" onBack={() => nav('/closets-near-me')} />
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="font-heading text-2xl font-semibold uppercase">Request sent</div>
          <p className="mt-2 text-sm text-neutral-600">
            {owner.name} will see this in her Borrows tab. You'll get a nudge when she responds.
          </p>
          <PrimaryButton className="mt-6" onClick={() => nav('/borrows')}>
            View my borrows
          </PrimaryButton>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false}>
      <TopBar title="Borrow Request" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <p className="eyebrow text-xs text-neutral-600">
          From {owner.name} · {owner.distanceLabel}
        </p>

        <div className="mt-3 flex gap-3 rounded-md border border-neutral-300 bg-white p-3">
          <ImagePlaceholder className="h-16 w-16 shrink-0 rounded-md" />
          <div>
            <div className="font-heading text-lg font-semibold uppercase">{item.name}</div>
            <div className="text-sm text-neutral-600">
              {item.brand} · size {item.size}
            </div>
            <div className="text-xs text-accent-600">
              Lent {item.timesLent} times · {item.alwaysReturned ? 'Always returned' : 'Sometimes late'}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="eyebrow mb-2 text-xs text-neutral-600">When do you need it?</p>
          <SegmentedControl
            value={when}
            onChange={setWhen}
            options={[
              { value: 'Tonight', label: 'Tonight' },
              { value: 'This Weekend', label: 'This Weekend' },
              { value: 'Next Week', label: 'Next Week' },
            ]}
          />
        </div>

        <div className="mt-5">
          <p className="eyebrow mb-2 text-xs text-neutral-600">Add a note</p>
          <div className="space-y-2">
            {noteOptions.map((n) => (
              <button
                key={n}
                onClick={() => setNote(n)}
                className={`w-full rounded-md border p-3 text-left text-sm ${
                  note === n ? 'border-accent-600 bg-accent-100' : 'border-neutral-300 bg-white'
                }`}
              >
                "{n}"
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-md border border-neutral-300 bg-white p-4">
          <p className="eyebrow mb-2 text-xs text-neutral-600">If this gets approved</p>
          <div className="flex gap-3">
            <StatTile value={`${impact.co2Kg} kg`} label="CO₂ avoided" />
            <StatTile value={`${impact.waterL.toLocaleString()} L`} label="Water saved" />
            <StatTile value={`$${impact.moneyNotSpent}`} label="Not spent" />
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          House rules apply: return by the agreed day, clean. Late returns pause your borrowing for a week.
        </p>

        <PrimaryButton
          className="mt-5"
          onClick={() => {
            sendBorrowRequest({ itemId: item.id, whenNeeded: when, note })
            setSent(true)
          }}
        >
          Send Request to {owner.name.split(' ')[0]}
        </PrimaryButton>
      </div>
    </Screen>
  )
}
