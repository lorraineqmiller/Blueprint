import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, Photo, PrimaryButton } from '../components/ui'
import { useMyItems } from '../lib/selectors'
import { useStore } from '../store'

export default function NewFitCheck() {
  const nav = useNavigate()
  const items = useMyItems()
  const startFitCheck = useStore((s) => s.startFitCheck)

  const [eventName, setEventName] = useState('')
  const [location, setLocation] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [optionA, setOptionA] = useState<string[]>([])
  const [optionB, setOptionB] = useState<string[]>([])
  const [step, setStep] = useState<'details' | 'items'>('details')

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  if (step === 'details') {
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="New Fit Check" onBack={() => nav('/chats')} />
        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
          <div className="space-y-4">
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
              <Eyebrow className="mb-1">Location</Eyebrow>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bushwick"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
            </div>
            <div>
              <Eyebrow className="mb-1">Time</Eyebrow>
              <input
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="Fri 10pm"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
            </div>
          </div>
          <PrimaryButton disabled={!eventName} onClick={() => setStep('items')}>
            Choose outfit options
          </PrimaryButton>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="New Fit Check" onBack={() => setStep('details')} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="eyebrow text-xs text-neutral-600">Option A — tap pieces from your closet</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(optionA, setOptionA, item.id)}
                className={`relative overflow-hidden rounded-md border-2 ${
                  optionA.includes(item.id) ? 'border-accent-600' : 'border-transparent'
                }`}
              >
                <Photo src={item.imageUrl} alt={item.name} className="h-16 w-full" />
              </button>
            ))}
          </div>

          <p className="eyebrow mt-5 text-xs text-neutral-600">Option B — tap pieces from your closet</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(optionB, setOptionB, item.id)}
                className={`relative overflow-hidden rounded-md border-2 ${
                  optionB.includes(item.id) ? 'border-accent-600' : 'border-transparent'
                }`}
              >
                <Photo src={item.imageUrl} alt={item.name} className="h-16 w-full" />
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-neutral-300 bg-paper px-5 py-4">
          <PrimaryButton
            disabled={optionA.length === 0 || optionB.length === 0}
            onClick={() => {
              const id = startFitCheck({ eventName, location, eventTime, optionAItemIds: optionA, optionBItemIds: optionB })
              nav(`/chats/${id}`)
            }}
          >
            Post to group chat
          </PrimaryButton>
        </div>
      </div>
    </Screen>
  )
}
