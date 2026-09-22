import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { ImagePlaceholder, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import { ME } from '../data/seed'

export default function LiveVote() {
  const nav = useNavigate()
  const { chatId } = useParams()
  const chat = useStore((s) => s.chats.find((c) => c.id === chatId))
  const people = useStore((s) => s.people)
  const castVote = useStore((s) => s.castVote)
  const addComment = useStore((s) => s.addComment)
  const decideChat = useStore((s) => s.decideChat)
  const [comment, setComment] = useState('')
  const [voted, setVoted] = useState(false)

  if (!chat) return null
  const total = chat.options.reduce((a, o) => a + o.votes, 0) || 1

  return (
    <Screen withNav={false}>
      <TopBar title={chat.title} onBack={() => nav('/chats')} />
      <div className="px-5 py-5">
        <p className="text-xs text-neutral-600">
          {chat.memberIds.length} members · voting closes {chat.votingClosesLabel}
        </p>

        <div className="mt-4 rounded-md border border-neutral-300 bg-white p-4">
          <p className="eyebrow text-xs text-neutral-500">The prompt</p>
          <p className="font-heading mt-1 text-lg font-semibold uppercase">
            {chat.eventName} · {chat.location} · {chat.eventTime}
          </p>
          <p className="mt-1 text-sm text-neutral-600">Anna posted two options from her closet. Tap the one you'd wear.</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {chat.options.map((o) => {
            const pct = Math.round((o.votes / total) * 100)
            return (
              <button
                key={o.id}
                onClick={() => {
                  castVote(chat.id, o.id)
                  setVoted(true)
                }}
                className="overflow-hidden rounded-md border border-neutral-300 bg-white text-left"
              >
                <ImagePlaceholder className="h-32 w-full" />
                <div className="eyebrow bg-navy px-2 py-1 text-[10px] text-white">{o.label}</div>
                <div className="px-2 py-2">
                  <div className="mb-1 h-1.5 w-full rounded-full bg-neutral-200">
                    <div className="h-1.5 rounded-full bg-accent-600" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-neutral-600">
                    {o.votes} votes · {pct}%
                  </p>
                </div>
              </button>
            )
          })}
        </div>
        {voted && <p className="mt-2 text-xs text-accent-600">Your vote is in.</p>}

        <div className="mt-5 space-y-3">
          {chat.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="h-8 w-8 shrink-0 rounded-md bg-neutral-200" />
              <div>
                <p className="text-xs text-neutral-500">
                  {c.authorId === ME ? 'You' : people.find((p) => p.id === c.authorId)?.name} ·{' '}
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="text-sm">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Say something..."
            className="flex-1 rounded-md border border-neutral-400 bg-white px-3 py-2 text-sm outline-none focus:border-accent-600"
          />
          <button
            onClick={() => {
              if (!comment.trim()) return
              addComment(chat.id, comment.trim())
              setComment('')
            }}
            className="eyebrow rounded-md bg-accent-600 px-4 text-xs text-white"
          >
            Send
          </button>
        </div>

        {chat.status === 'voting' && (
          <PrimaryButton
            className="mt-5"
            onClick={() => {
              decideChat(chat.id)
              nav(`/chats/${chat.id}/confirmed`)
            }}
          >
            Lock in the look
          </PrimaryButton>
        )}
      </div>
    </Screen>
  )
}
