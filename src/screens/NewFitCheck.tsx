import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, Photo, PrimaryButton } from '../components/ui'
import { ItemPicker, OptionVisual } from '../components/FitCheckParts'
import { GroupForm } from '../components/GroupForm'
import { groupName, MAX_OPTIONS } from '../lib/fitChecks'
import { communityName } from '../data/communities'
import { useStore } from '../store'
import type { FitCheckAudience, FitCheckMode } from '../types'

type Step = 'details' | 'audience' | 'outfits' | 'option'
interface OptionDraft {
  itemIds: string[]
  photo: File | null
  previewUrl: string | null
}

// Pick any that apply; saved as one line, e.g. "Outdoor · Cold".
const WEATHER = ['Indoor', 'Outdoor', 'Rainy', 'Snowy', 'Cold', 'Hot']

function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function NewFitCheck() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const people = useStore((s) => s.people)
  const allItems = useStore((s) => s.items)
  const groups = useStore((s) => s.friendGroups)
  const saveFriendGroup = useStore((s) => s.saveFriendGroup)
  const startFitCheck = useStore((s) => s.startFitCheck)

  const [step, setStep] = useState<Step>('details')
  const [eventName, setEventName] = useState('')
  const [vibe, setVibe] = useState('')
  const [weather, setWeather] = useState<string[]>([])
  const [endInput, setEndInput] = useState('') // datetime-local value, in local time

  const canCommunity = user.isPublic && Boolean(user.communityId)
  const [audience, setAudience] = useState<FitCheckAudience>(groups.length ? 'group' : 'friends')
  const [groupId, setGroupId] = useState<string | null>(groups[0]?.id ?? null)
  const [creatingGroup, setCreatingGroup] = useState(false)

  const [mode, setMode] = useState<FitCheckMode>('vote')
  const [options, setOptions] = useState<OptionDraft[]>([])
  const [editing, setEditing] = useState<{ index: number; draft: OptionDraft } | null>(null)
  const [pickFrom, setPickFrom] = useState<'mine' | 'friends'>('mine')
  const photoInput = useRef<HTMLInputElement>(null)

  const myItems = allItems.filter((i) => i.ownerId === user.id)
  const friendItems = allItems.filter((i) => !i.isPrivate && people.some((p) => p.id === i.ownerId))
  const endsAt = endInput ? new Date(endInput).toISOString() : null
  const endValid = endsAt !== null && new Date(endsAt).getTime() > Date.now()

  // ── option editor ──────────────────────────────────────────────────────
  if (step === 'option' && editing) {
    const d = editing.draft
    const update = (patch: Partial<OptionDraft>) => setEditing({ ...editing, draft: { ...d, ...patch } })
    const label = `Option ${'ABCD'[editing.index]}`
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title={label} onBack={() => setStep('outfits')} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <Eyebrow className="mb-2">Fit pic · optional</Eyebrow>
            {d.previewUrl ? (
              <div className="relative overflow-hidden rounded-md border border-neutral-300">
                <Photo src={d.previewUrl} alt="Fit pic" className="h-64 w-full" />
                <button
                  onClick={() => update({ photo: null, previewUrl: null })}
                  className="eyebrow absolute right-2 top-2 rounded-sm bg-navy/90 px-2 py-1 text-[10px] text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoInput.current?.click()}
                className="block w-full rounded-md border border-dashed border-neutral-400 bg-white py-8 text-center"
              >
                <div className="text-sm font-semibold text-accent-700">Upload a fit pic</div>
                <p className="text-xs text-neutral-600">A mirror selfie, or the whole outfit laid out</p>
              </button>
            )}
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) update({ photo: file, previewUrl: URL.createObjectURL(file) })
                e.target.value = ''
              }}
            />

            <Eyebrow className="mb-2 mt-5">{d.previewUrl ? 'Tag the pieces · optional' : 'Or build it from pieces'}</Eyebrow>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {(['mine', 'friends'] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setPickFrom(src)}
                  className={`eyebrow rounded-md border py-2 text-[11px] ${
                    pickFrom === src ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
                  }`}
                >
                  {src === 'mine' ? 'Your closet' : "Friends' closets"}
                </button>
              ))}
            </div>
            <ItemPicker
              key={pickFrom}
              items={pickFrom === 'mine' ? myItems : friendItems}
              selected={d.itemIds}
              onToggle={(id) => update({ itemIds: d.itemIds.includes(id) ? d.itemIds.filter((x) => x !== id) : [...d.itemIds, id] })}
              emptyText={pickFrom === 'mine' ? 'Add pieces to your closet first.' : 'No friend pieces to pick from yet.'}
            />
          </div>
          <div className="border-t border-neutral-300 bg-paper px-5 py-4">
            <PrimaryButton
              disabled={!d.photo && d.itemIds.length === 0}
              onClick={() => {
                setOptions((opts) => {
                  const next = [...opts]
                  next[editing.index] = d
                  return next
                })
                setEditing(null)
                setStep('outfits')
              }}
            >
              Save {label}
            </PrimaryButton>
          </div>
        </div>
      </Screen>
    )
  }

  // ── step 3: outfits ────────────────────────────────────────────────────
  if (step === 'outfits') {
    const canPost = mode === 'ideas' || options.length >= 2
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Outfits" onBack={() => setStep('audience')} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-2">
              {(['vote', 'ideas'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md border p-3 text-left ${mode === m ? 'border-accent-600 bg-accent-100' : 'border-neutral-300 bg-white'}`}
                >
                  <div className="text-sm font-semibold">{m === 'vote' ? 'Vote on outfits' : 'Ask for ideas'}</div>
                  <p className="text-xs text-neutral-600">
                    {m === 'vote' ? `Post 2–${MAX_OPTIONS} options` : 'Friends style you from your closet'}
                  </p>
                </button>
              ))}
            </div>

            {mode === 'vote' ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {options.map((o, i) => (
                  <div key={i} className="overflow-hidden rounded-md border border-neutral-300 bg-white">
                    <OptionVisual option={{ imageUrl: o.previewUrl, itemIds: o.itemIds }} items={allItems} className="h-32" />
                    <div className="eyebrow bg-navy px-2 py-1 text-[10px] text-white">Option {'ABCD'[i]}</div>
                    <div className="flex">
                      <button
                        onClick={() => {
                          setEditing({ index: i, draft: o })
                          setStep('option')
                        }}
                        className="eyebrow flex-1 py-2 text-[10px] text-accent-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setOptions((opts) => opts.filter((_, j) => j !== i))}
                        className="eyebrow flex-1 py-2 text-[10px] text-neutral-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {options.length < MAX_OPTIONS && (
                  <button
                    onClick={() => {
                      setEditing({ index: options.length, draft: { itemIds: [], photo: null, previewUrl: null } })
                      setPickFrom('mine')
                      setStep('option')
                    }}
                    className="flex h-[11.5rem] flex-col items-center justify-center rounded-md border border-dashed border-neutral-400 text-accent-600"
                  >
                    <span className="text-2xl">+</span>
                    <span className="eyebrow text-[11px]">Add option {'ABCD'[options.length]}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-neutral-300 bg-white p-4 text-sm text-ink">
                <p>No options needed. Your friends can:</p>
                <ul className="mt-2 space-y-1 text-neutral-700">
                  <li>• browse your closet and put a look together for you</li>
                  <li>• offer pieces from their own closet they'd lend you</li>
                </ul>
                <p className="mt-2 text-xs text-neutral-500">You pick the one you like and it becomes your confirmed look.</p>
              </div>
            )}
          </div>
          <div className="border-t border-neutral-300 bg-paper px-5 py-4">
            {mode === 'vote' && options.length < 2 && <p className="mb-2 text-center text-xs text-neutral-500">Add at least 2 options to vote on.</p>}
            <PrimaryButton
              disabled={!canPost}
              onClick={() => {
                const id = startFitCheck({
                  eventName: eventName.trim(),
                  vibe: vibe.trim(),
                  weather: WEATHER.filter((w) => weather.includes(w)).join(' · '),
                  endsAt,
                  audience,
                  groupId: audience === 'group' ? groupId : null,
                  mode,
                  options: options.map((o) => ({ itemIds: o.itemIds, photo: o.photo })),
                })
                nav(`/fit-checks/${id}`, { replace: true })
              }}
            >
              Post fit check
            </PrimaryButton>
          </div>
        </div>
      </Screen>
    )
  }

  // ── step 2: who sees it ────────────────────────────────────────────────
  if (step === 'audience') {
    const community = communityName(user.communityId)
    const audienceOk = audience !== 'group' || Boolean(groupId && groups.some((g) => g.id === groupId))
    const row = (value: FitCheckAudience, title: string, sub: string, disabled = false) => (
      <button
        disabled={disabled}
        onClick={() => setAudience(value)}
        className={`w-full rounded-md border p-3 text-left disabled:opacity-50 ${
          audience === value ? 'border-accent-600 bg-accent-100' : 'border-neutral-300 bg-white'
        }`}
      >
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-xs text-neutral-600">{sub}</p>
      </button>
    )
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Who Sees It" onBack={() => setStep('details')} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
            {row('group', 'A group', 'Only the friends in one of your groups')}
            {audience === 'group' && !creatingGroup && (
              <div className="ml-3 space-y-1.5 border-l-2 border-accent-300 pl-3">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroupId(g.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                      groupId === g.id ? 'border-accent-600 bg-white font-semibold' : 'border-neutral-300 bg-white'
                    }`}
                  >
                    <span className="truncate">{groupName(g, people)}</span>
                    <span className="text-xs text-neutral-500">{g.memberIds.length}</span>
                  </button>
                ))}
                <button onClick={() => setCreatingGroup(true)} className="eyebrow py-1 text-[11px] text-accent-600">
                  + New group
                </button>
              </div>
            )}
            {audience === 'group' && creatingGroup && (
              <div className="rounded-md border border-neutral-300 bg-white p-3">
                <GroupForm
                  saveLabel="Create group"
                  onSave={(g) => {
                    setGroupId(saveFriendGroup(g))
                    setCreatingGroup(false)
                  }}
                />
                <button onClick={() => setCreatingGroup(false)} className="eyebrow mt-2 w-full py-1 text-[11px] text-neutral-500">
                  Cancel
                </button>
              </div>
            )}
            {row('friends', 'All friends', 'Everyone you’re friends with on Blueprint')}
            {row(
              'community',
              community ? `Everyone at ${community}` : 'Your school community',
              !user.isPublic
                ? 'Only for public profiles — yours is private'
                : !community
                  ? 'Verify your school email to post to your community'
                  : 'Anyone at your school can see and vote. Only friends can comment.',
              !canCommunity,
            )}
          </div>
          <div className="border-t border-neutral-300 bg-paper px-5 py-4">
            <PrimaryButton disabled={!audienceOk || creatingGroup} onClick={() => setStep('outfits')}>
              Next: outfits
            </PrimaryButton>
          </div>
        </div>
      </Screen>
    )
  }

  // ── step 1: details ────────────────────────────────────────────────────
  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="New Fit Check" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <Eyebrow className="mb-1">Event</Eyebrow>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Warehouse Party"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          <div>
            <Eyebrow className="mb-1">Dress code · theme · vibe</Eyebrow>
            <input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="Black tie optional, 70s, cozy…"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          <div>
            <Eyebrow className="mb-1">Weather · pick any</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {WEATHER.map((w) => {
                const on = weather.includes(w)
                return (
                  <button
                    key={w}
                    aria-pressed={on}
                    onClick={() => setWeather(on ? weather.filter((x) => x !== w) : [...weather, w])}
                    className={`eyebrow rounded-full border px-3 py-1.5 text-[11px] ${
                      on ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white text-ink'
                    }`}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <Eyebrow className="mb-1">Voting ends</Eyebrow>
            <input
              type="datetime-local"
              value={endInput}
              min={localInputValue(new Date())}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
            {endInput && !endValid && <p className="mt-1 text-xs text-red-600">Pick a time in the future.</p>}
          </div>
        </div>
        <div className="border-t border-neutral-300 bg-paper px-5 py-4">
          <PrimaryButton disabled={!eventName.trim() || !endValid} onClick={() => setStep('audience')}>
            Next: who sees it
          </PrimaryButton>
        </div>
      </div>
    </Screen>
  )
}

