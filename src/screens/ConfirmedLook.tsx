import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Badge, Photo, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import { proximityLabel } from '../lib/proximity'
import { useFitCheck } from '../lib/fitChecks'
import type { ClothingItem } from '../types'

export default function ConfirmedLook() {
  const nav = useNavigate()
  const { fitCheckId } = useParams()
  const fc = useFitCheck(fitCheckId)
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const user = useStore((s) => s.user)
  const distances = useStore((s) => s.distances)
  const buildings = useStore((s) => s.buildings)

  if (!fc) return null
  const option = fc.options.find((o) => o.id === fc.decidedOptionId)
  const suggestion = fc.suggestions.find((sg) => sg.id === fc.decidedSuggestionId)
  if (!option && !suggestion) return null

  const totalVotes = fc.options.reduce((a, o) => a + o.votes, 0)
  const pieceIds = option ? option.itemIds : [...suggestion!.itemIds, ...suggestion!.lendItemIds]
  const lookItems = pieceIds.map((id) => items.find((i) => i.id === id)).filter((i): i is ClothingItem => Boolean(i))
  const isMine = fc.createdBy === user.id
  // Pieces the creator would borrow: lendable ones, or ones offered in the
  // suggestion they picked (the database allows exactly these).
  const borrowable = (i: ClothingItem) =>
    i.ownerId !== fc.createdBy && (i.lendable || Boolean(suggestion?.lendItemIds.includes(i.id)))
  const toBorrow = isMine ? lookItems.filter(borrowable) : []
  const suggester = suggestion ? people.find((p) => p.id === suggestion.authorId) : undefined
  const near = (p: (typeof people)[number]) => proximityLabel(user, p, distances[p.id], buildings)

  return (
    <Screen withNav={false}>
      <TopBar title="Confirmed Look" onBack={() => nav('/fit-checks')} />
      <div className="px-5 py-5">
        <div className="grid-paper rounded-md bg-navy p-5 text-white">
          <p className="eyebrow text-[10px] text-white/60">
            {option
              ? `${fc.eventName} · ${totalVotes} vote${totalVotes === 1 ? '' : 's'}`
              : `${fc.eventName} · styled by ${suggester?.name ?? 'a friend'}`}
          </p>
          <h1 className="font-heading mt-2 text-2xl font-semibold uppercase leading-tight">
            {option ? `${option.label} wins` : 'The look'}
          </h1>
          {suggestion?.note && <p className="mt-2 text-sm text-white/80">“{suggestion.note}”</p>}
          <p className="mt-2 text-sm text-white/70">{[fc.vibe, fc.weather].filter(Boolean).join(' · ')}</p>
        </div>

        {option?.imageUrl && (
          <div className="mt-4 overflow-hidden rounded-md border border-neutral-300">
            <Photo src={option.imageUrl} alt="Fit pic" className="h-80 w-full" />
          </div>
        )}

        {lookItems.length > 0 && (
          <>
            <p className="eyebrow mt-5 text-xs text-neutral-600">The look, piece by piece</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {lookItems.map((item) => {
                const owner = people.find((p) => p.id === item.ownerId)
                const owned = item.ownerId === fc.createdBy
                return (
                  <div key={item.id} className="overflow-hidden rounded-md border border-neutral-300 bg-white">
                    <div className="relative">
                      <Photo src={item.imageUrl} alt={item.name} className="h-32 w-full" />
                      <span
                        className={`eyebrow absolute left-1 top-1 rounded-sm px-1.5 py-0.5 text-[9px] text-white ${owned ? 'bg-navy' : 'bg-accent-600'}`}
                      >
                        {owned ? 'Owned' : 'To borrow'}
                      </span>
                    </div>
                    <div className="px-2 py-2">
                      <div className="truncate text-xs font-semibold uppercase">{item.name}</div>
                      <div className="truncate text-[10px] text-neutral-600">
                        {owned ? (isMine ? 'Your closet' : 'Their closet') : owner ? `${owner.name} · ${near(owner)}` : 'A friend'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {toBorrow.length > 0 && (
          <div className="mt-5 rounded-md border border-accent-300 bg-accent-100 p-4">
            <Badge tone="accent">{toBorrow.length === 1 ? 'Missing one piece' : `Missing ${toBorrow.length} pieces`}</Badge>
            <div className="mt-3 space-y-2">
              {toBorrow.map((item) => {
                const owner = people.find((p) => p.id === item.ownerId)
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-sm text-ink">
                      <span className="font-semibold">{item.name}</span>
                      {owner ? ` from ${owner.name.split(' ')[0]}` : ''}
                    </p>
                    <button
                      onClick={() => nav(`/borrow/${item.id}`)}
                      className="eyebrow shrink-0 rounded-md bg-accent-700 px-3 py-2 text-[11px] text-white"
                    >
                      Request
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <PrimaryButton className="mt-5" onClick={() => nav(`/fit-checks/${fc.id}`)}>
          Back to the fit check
        </PrimaryButton>
      </div>
    </Screen>
  )
}
