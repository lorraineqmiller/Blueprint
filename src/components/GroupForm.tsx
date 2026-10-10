import { useState } from 'react'
import { useStore } from '../store'
import { groupName } from '../lib/fitChecks'
import { Avatar, Eyebrow, PrimaryButton } from './ui'

// Name (optional) + pick friends. Used on the Groups screen and inline
// while starting a fit check, so making a group never loses a draft.
export function GroupForm({
  initial,
  onSave,
  saveLabel = 'Save group',
}: {
  initial?: { name: string; memberIds: string[] }
  onSave: (group: { name: string; memberIds: string[] }) => void
  saveLabel?: string
}) {
  const people = useStore((s) => s.people)
  const [name, setName] = useState(initial?.name ?? '')
  const [memberIds, setMemberIds] = useState<string[]>(initial?.memberIds ?? [])

  const toggle = (id: string) => setMemberIds((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))

  return (
    <div className="space-y-4">
      <div>
        <Eyebrow className="mb-1">Group name · optional</Eyebrow>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={memberIds.length ? groupName({ name: '', memberIds }, people) : 'e.g. Sat Night Crew'}
          className="w-full rounded-xl border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
        />
      </div>
      <div>
        <Eyebrow className="mb-1">Friends · {memberIds.length} picked</Eyebrow>
        <div className="space-y-1.5">
          {people.map((p) => {
            const on = memberIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border bg-white p-2.5 text-left ${
                  on ? 'border-accent-600' : 'border-neutral-300'
                }`}
              >
                <Avatar src={p.avatarUrl} name={p.name} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-neutral-600">{p.handle}</div>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                    on ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
              </button>
            )
          })}
          {people.length === 0 && <p className="text-sm text-neutral-500">Add some friends first.</p>}
        </div>
      </div>
      <PrimaryButton disabled={memberIds.length === 0} onClick={() => onSave({ name: name.trim(), memberIds })}>
        {saveLabel}
      </PrimaryButton>
    </div>
  )
}
