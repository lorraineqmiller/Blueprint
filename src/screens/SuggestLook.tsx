import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { ItemPicker } from '../components/FitCheckParts'
import { useFitCheck } from '../lib/fitChecks'
import { useStore } from '../store'

// Ideas mode: put a look together from the asker's closet, and optionally
// offer pieces from your own closet to lend them for it.
export default function SuggestLook() {
  const nav = useNavigate()
  const { fitCheckId } = useParams()
  const fc = useFitCheck(fitCheckId)
  const items = useStore((s) => s.items)
  const user = useStore((s) => s.user)
  const people = useStore((s) => s.people)
  const sendSuggestion = useStore((s) => s.sendSuggestion)

  const [tab, setTab] = useState<'theirs' | 'mine'>('theirs')
  const [itemIds, setItemIds] = useState<string[]>([])
  const [lendItemIds, setLendItemIds] = useState<string[]>([])
  const [note, setNote] = useState('')

  if (!fc) return null
  const asker = people.find((p) => p.id === fc.createdBy)
  const firstName = asker?.name.split(' ')[0] ?? 'their'
  const theirCloset = items.filter((i) => i.ownerId === fc.createdBy && !i.isPrivate)
  const myCloset = items.filter((i) => i.ownerId === user.id && !i.isPrivate)
  const toggle = (list: string[], set: (v: string[]) => void) => (id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  const canSend = itemIds.length + lendItemIds.length > 0 || note.trim().length > 0

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Suggest a Look" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-neutral-600">
            For <span className="font-semibold text-ink">{fc.eventName}</span>
            {fc.vibe ? ` · ${fc.vibe}` : ''}
            {fc.weather ? ` · ${fc.weather}` : ''}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab('theirs')}
              className={`eyebrow rounded-md border py-2 text-[11px] ${tab === 'theirs' ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'}`}
            >
              {firstName}'s closet{itemIds.length ? ` · ${itemIds.length}` : ''}
            </button>
            <button
              onClick={() => setTab('mine')}
              className={`eyebrow rounded-md border py-2 text-[11px] ${tab === 'mine' ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'}`}
            >
              Lend from yours{lendItemIds.length ? ` · ${lendItemIds.length}` : ''}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            {tab === 'theirs'
              ? `Pick pieces ${firstName} already owns.`
              : `Offer pieces you'd lend ${firstName} for this — they can request them right from your suggestion.`}
          </p>
          <div className="mt-2">
            {tab === 'theirs' ? (
              <ItemPicker key="theirs" items={theirCloset} selected={itemIds} onToggle={toggle(itemIds, setItemIds)} emptyText={`${firstName}'s closet is empty.`} />
            ) : (
              <ItemPicker key="mine" items={myCloset} selected={lendItemIds} onToggle={toggle(lendItemIds, setLendItemIds)} emptyText="Add pieces to your closet first." />
            )}
          </div>

          <Eyebrow className="mb-1 mt-5">Note</Eyebrow>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="the blazer over the slip dress, trust me"
            className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 text-sm outline-none focus:border-accent-600"
          />
        </div>
        <div className="border-t border-neutral-300 bg-paper px-5 py-4">
          <PrimaryButton
            disabled={!canSend}
            onClick={() => {
              sendSuggestion(fc.id, { itemIds, lendItemIds, note: note.trim() })
              nav(-1)
            }}
          >
            Send to {firstName}
          </PrimaryButton>
        </div>
      </div>
    </Screen>
  )
}
