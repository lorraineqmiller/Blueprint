import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Photo, PrimaryButton, StatTile } from '../components/ui'
import { useItemById, usePersonById } from '../lib/selectors'
import { borrowImpact } from '../lib/impact'
import { proximityLabel } from '../lib/proximity'
import { useStore } from '../store'

function formatCustomDate(isoDate: string) {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function BorrowRequest() {
  const nav = useNavigate()
  const { itemId } = useParams()
  const item = useItemById(itemId)
  const owner = usePersonById(item?.ownerId)
  const sendBorrowRequest = useStore((s) => s.sendBorrowRequest)
  const user = useStore((s) => s.user)

  const [when, setWhen] = useState<'ASAP' | 'date'>('ASAP')
  const [customDate, setCustomDate] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  if (!item || !owner) return null
  const impact = borrowImpact(item.priceCents)
  const whenNeeded = when === 'ASAP' ? 'ASAP' : formatCustomDate(customDate)

  if (sent) {
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Borrow Request" onBack={() => nav('/closets-near-me')} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
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
          From {owner.name} · {proximityLabel(user, owner)}
        </p>

        <div className="mt-3 flex gap-3 rounded-md border border-neutral-300 bg-white p-3">
          <Photo src={item.imageUrl} alt={item.name} className="h-16 w-16 shrink-0 rounded-md" />
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setWhen('ASAP')}
              className={`eyebrow rounded-md border py-3 text-xs tracking-wide transition ${
                when === 'ASAP' ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white text-ink'
              }`}
            >
              ASAP
            </button>
            <button
              onClick={() => setWhen('date')}
              className={`eyebrow rounded-md border py-3 text-xs tracking-wide transition ${
                when === 'date' ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white text-ink'
              }`}
            >
              Pick a date
            </button>
          </div>
          {when === 'date' && (
            <input
              type="date"
              min={today}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-2 w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          )}
        </div>

        <div className="mt-5">
          <p className="eyebrow mb-2 text-xs text-neutral-600">Add a note</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Let them know what it's for and when you'll return it..."
            rows={3}
            className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 text-sm outline-none focus:border-accent-600"
          />
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
          disabled={!note.trim() || (when === 'date' && !customDate)}
          onClick={() => {
            sendBorrowRequest({ itemId: item.id, whenNeeded, note: note.trim() })
            setSent(true)
          }}
        >
          Send Request to {owner.name.split(' ')[0]}
        </PrimaryButton>
      </div>
    </Screen>
  )
}
