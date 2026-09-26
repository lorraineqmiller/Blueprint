import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Badge, ImagePlaceholder, PrimaryButton } from '../components/ui'
import { useStore } from '../store'

export default function ConfirmedLook() {
  const nav = useNavigate()
  const { chatId } = useParams()
  const chat = useStore((s) => s.chats.find((c) => c.id === chatId))
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const user = useStore((s) => s.user)

  if (!chat) return null
  const winner = chat.options.find((o) => o.id === chat.decidedOptionId) ?? chat.options[0]
  const totalVotes = chat.options.reduce((a, o) => a + o.votes, 0)
  const lookItems = winner.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as typeof items
  const toBorrow = lookItems.filter((i) => i.ownerId !== user.id)

  return (
    <Screen withNav={false}>
      <TopBar title="Confirmed Look" onBack={() => nav('/chats')} />
      <div className="px-5 py-5">
        <div className="grid-paper rounded-md bg-navy p-5 text-white">
          <p className="eyebrow text-[10px] text-white/60">
            Decided by {chat.title} · {totalVotes} votes
          </p>
          <h1 className="font-heading mt-2 text-2xl font-semibold uppercase leading-tight">{winner.label}</h1>
          <p className="mt-2 text-sm text-white/70">
            Locked for {chat.eventTime}. Everyone in the chat sees the same answer.
          </p>
        </div>

        <p className="eyebrow mt-5 text-xs text-neutral-600">The look, piece by piece</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {lookItems.map((item) => {
            const owner = people.find((p) => p.id === item.ownerId)
            const owned = item.ownerId === user.id
            return (
              <div key={item.id} className="overflow-hidden rounded-md border border-neutral-300 bg-white">
                <div className="relative">
                  <ImagePlaceholder className="h-32 w-full" />
                  <span
                    className={`eyebrow absolute left-1 top-1 rounded-sm px-1.5 py-0.5 text-[9px] text-white ${
                      owned ? 'bg-navy' : 'bg-accent-600'
                    }`}
                  >
                    {owned ? 'Owned' : 'To Borrow'}
                  </span>
                </div>
                <div className="px-2 py-2">
                  <div className="truncate text-xs font-semibold uppercase">{item.name}</div>
                  <div className="truncate text-[10px] text-neutral-600">
                    {owned ? 'Your closet' : `${owner?.name} · ${owner?.distanceLabel}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {toBorrow.length > 0 && (
          <div className="mt-5 rounded-md border border-accent-300 bg-accent-100 p-4">
            <Badge tone="accent">Missing one piece</Badge>
            <p className="mt-2 text-sm text-ink">
              The look needs the {toBorrow[0].name.toLowerCase()}. {people.find((p) => p.id === toBorrow[0].ownerId)?.name}{' '}
              has them, {people.find((p) => p.id === toBorrow[0].ownerId)?.distanceLabel} away.
            </p>
            <PrimaryButton className="mt-3" onClick={() => nav(`/borrow/${toBorrow[0].id}`)}>
              Request to borrow
            </PrimaryButton>
          </div>
        )}
      </div>
    </Screen>
  )
}
