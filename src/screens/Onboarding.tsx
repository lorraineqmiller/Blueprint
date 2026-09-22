import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'

const steps = [
  {
    eyebrow: 'Step 1',
    title: 'Digitize your closet',
    body: 'Snap photos or connect your Shop and Gmail receipts — Blueprint builds the piece cards for you.',
  },
  {
    eyebrow: 'Step 2',
    title: 'Track your impact',
    body: 'Every re-wear counts. See CO₂ avoided, water saved, and which pieces are working hardest.',
  },
  {
    eyebrow: 'Step 3',
    title: 'Share it, borrow it',
    body: 'Post a fit check to your group chat, vote live, and borrow pieces from friends nearby.',
  },
]

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const current = steps[step]

  return (
    <Screen withNav={false} scroll={false}>
      <div className="grid-paper flex h-full flex-col justify-between bg-navy px-8 py-14 text-white">
        <div>
          <Eyebrow className="text-white/60">{current.eyebrow}</Eyebrow>
          <h2 className="font-heading mt-3 text-3xl font-semibold uppercase leading-tight">{current.title}</h2>
          <p className="mt-4 text-white/70">{current.body}</p>
        </div>
        <div>
          <div className="mb-6 flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent-400' : 'bg-white/20'}`} />
            ))}
          </div>
          <PrimaryButton
            onClick={() => {
              if (step < steps.length - 1) setStep(step + 1)
              else nav('/profile-setup')
            }}
          >
            {step < steps.length - 1 ? 'Next' : 'Set up my profile'}
          </PrimaryButton>
        </div>
      </div>
    </Screen>
  )
}
