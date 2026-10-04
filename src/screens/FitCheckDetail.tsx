import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Avatar, Badge, PrimaryButton } from '../components/ui'
import { ItemCollage, OptionVisual } from '../components/FitCheckParts'
import { audienceLabel, canParticipate, closesLabel, isOpen, leadingOption, useFitCheck, useNow } from '../lib/fitChecks'
import { useStore } from '../store'
import type { ClothingItem } from '../types'

export default function FitCheckDetail() {
  const nav = useNavigate()
  const now = useNow()
  const { fitCheckId } = useParams()
  const fc = useFitCheck(fitCheckId)
  const items = useStore((s) => s.items)
  const people = useStore((s) => s.people)
  const groups = useStore((s) => s.friendGroups)
  const user = useStore((s) => s.user)
  const castVote = useStore((s) => s.castVote)
  const addComment = useStore((s) => s.addComment)
  const decideFitCheck = useStore((s) => s.decideFitCheck)
  const subscribeToFitCheck = useStore((s) => s.subscribeToFitCheck)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!fitCheckId) return
    return subscribeToFitCheck(fitCheckId)
  }, [fitCheckId, subscribeToFitCheck])

  if (!fc) return null

  const open = isOpen(fc, now)
  const isMine = fc.createdBy === user.id
  const participant = canParticipate(fc, user.id, people.map((p) => p.id))
  const totalVotes = fc.options.reduce((a, o) => a + o.votes, 0)
  const leader = leadingOption(fc)
  const person = (id: string) =>
    id === user.id
      ? { name: 'You', avatarUrl: user.avatarUrl }
      : (people.find((p) => p.id === id) ?? fc.participants?.find((p) => p.id === id) ?? { name: 'Someone', avatarUrl: null })
  const creator = person(fc.createdBy)
  const piecesFor = (ids: string[]) => ids.map((id) => items.find((i) => i.id === id)).filter((i): i is ClothingItem => Boolean(i))

  return (
    <Screen withNav={false}>
      <TopBar title={fc.eventName} onBack={() => nav('/fit-checks')} />
      <div className="px-5 py-5">
        <div className="rounded-md border border-neutral-300 bg-white p-4">
          {!isMine && (
            <div className="mb-3 flex items-center gap-2">
              <Avatar src={creator.avatarUrl} name={creator.name} className="h-7 w-7" />
              <span className="text-sm font-semibold">{creator.name}</span>
              <span className="text-xs text-neutral-500">{fc.mode === 'ideas' ? 'wants ideas' : 'wants your vote'}</span>
            </div>
          )}
          <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
            {fc.vibe && (
              <>
                <dt className="eyebrow text-[10px] leading-5 text-neutral-500">Vibe</dt>
                <dd>{fc.vibe}</dd>
              </>
            )}
            {fc.weather && (
              <>
                <dt className="eyebrow text-[10px] leading-5 text-neutral-500">Weather</dt>
                <dd>{fc.weather}</dd>
              </>
            )}
            {isMine && (
              <>
                <dt className="eyebrow text-[10px] leading-5 text-neutral-500">Shared with</dt>
                <dd>{audienceLabel(fc, groups, people, user.communityId)}</dd>
              </>
            )}
          </dl>
          <p className={`eyebrow mt-2 text-[11px] ${open ? 'text-accent-600' : 'text-neutral-500'}`}>{closesLabel(fc, now)}</p>
        </div>

        {fc.mode === 'vote' ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {fc.options.map((o) => {
                const pct = totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0
                const mine = fc.myVoteOptionId === o.id
                const winning = !open && leader?.id === o.id && totalVotes > 0
                return (
                  <button
                    key={o.id}
                    disabled={!open}
                    onClick={() => castVote(fc.id, o.id)}
                    className={`overflow-hidden rounded-md border-2 bg-white text-left ${
                      mine || winning ? 'border-accent-600' : 'border-neutral-300'
                    }`}
                  >
                    <OptionVisual option={o} items={items} className="h-36" />
                    <div className="eyebrow flex justify-between bg-navy px-2 py-1 text-[10px] text-white">
                      <span>{o.label}</span>
                      {mine && <span>Your vote</span>}
                    </div>
                    <div className="px-2 py-2">
                      <div className="mb-1 h-1.5 w-full rounded-full bg-neutral-200">
                        <div className="h-1.5 rounded-full bg-accent-600" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-neutral-600">
                        {o.votes} vote{o.votes === 1 ? '' : 's'} · {pct}%
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {open && !fc.myVoteOptionId && <p className="mt-2 text-xs text-neutral-600">Tap the one you'd wear. You can change your vote until it closes.</p>}
            {isMine && fc.status === 'voting' && leader && totalVotes > 0 && (
              <PrimaryButton
                className="mt-4"
                onClick={() => {
                  decideFitCheck(fc.id, { optionId: leader.id })
                  nav(`/fit-checks/${fc.id}/confirmed`)
                }}
              >
                Lock in {leader.label}
              </PrimaryButton>
            )}
          </>
        ) : (
          <>
            {!isMine && participant && open && (
              <PrimaryButton className="mt-4" onClick={() => nav(`/fit-checks/${fc.id}/suggest`)}>
                Suggest a look
              </PrimaryButton>
            )}
            <div className="mt-4 space-y-3">
              {fc.suggestions.map((sg) => {
                const author = person(sg.authorId)
                const theirs = piecesFor(sg.lendItemIds)
                return (
                  <div key={sg.id} className="rounded-md border border-neutral-300 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={author.avatarUrl} name={author.name} className="h-7 w-7" />
                      <span className="text-sm font-semibold">{author.name}</span>
                    </div>
                    {sg.note && <p className="mt-2 text-sm">{sg.note}</p>}
                    {(sg.itemIds.length > 0 || theirs.length > 0) && (
                      <div className="mt-2 overflow-hidden rounded-md border border-neutral-200">
                        <ItemCollage items={[...piecesFor(sg.itemIds), ...theirs]} className="h-36" />
                      </div>
                    )}
                    {theirs.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge tone="accent">Will lend</Badge>
                        <span className="text-xs text-neutral-700">{theirs.map((i) => i.name).join(', ')}</span>
                      </div>
                    )}
                    {isMine && fc.status === 'voting' && (
                      <button
                        onClick={() => {
                          decideFitCheck(fc.id, { suggestionId: sg.id })
                          nav(`/fit-checks/${fc.id}/confirmed`)
                        }}
                        className="eyebrow mt-3 w-full rounded-md bg-accent-700 py-2.5 text-xs text-white"
                      >
                        Go with this
                      </button>
                    )}
                  </div>
                )
              })}
              {fc.suggestions.length === 0 && (
                <p className="text-sm text-neutral-500">
                  {isMine ? 'No ideas yet — your friends can browse your closet and send looks.' : 'No ideas yet. Be the first.'}
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-6 space-y-3">
          {fc.comments.map((c) => {
            const a = person(c.authorId)
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar src={a.avatarUrl} name={a.name} className="h-8 w-8" />
                <div>
                  <p className="text-xs text-neutral-500">
                    {a.name} · {new Date(c.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="text-sm">{c.text}</p>
                </div>
              </div>
            )
          })}
        </div>

        {participant ? (
          <div className="mt-4 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && comment.trim()) {
                  addComment(fc.id, comment.trim())
                  setComment('')
                }
              }}
              placeholder="Say something..."
              className="flex-1 rounded-md border border-neutral-400 bg-white px-3 py-2 text-sm outline-none focus:border-accent-600"
            />
            <button
              onClick={() => {
                if (!comment.trim()) return
                addComment(fc.id, comment.trim())
                setComment('')
              }}
              className="eyebrow rounded-md bg-accent-600 px-4 text-xs text-white"
            >
              Send
            </button>
          </div>
        ) : (
          <p className="mt-4 text-xs text-neutral-500">Only {creator.name}'s friends can comment.</p>
        )}

        {fc.status === 'decided' && (
          <PrimaryButton className="mt-5" onClick={() => nav(`/fit-checks/${fc.id}/confirmed`)}>
            See the confirmed look
          </PrimaryButton>
        )}
      </div>
    </Screen>
  )
}
