import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { DotInk } from '../components/DotInk'

const steps = [
  {
    eyebrow: 'Step 1',
    ink: 'snap it',
    title: 'Digitize your closet',
    body: 'Snap a photo of each piece to add it to your closet.',
  },
  {
    eyebrow: 'Step 2',
    ink: 'wear it again',
    title: 'Track your impact',
    body: 'Every re-wear counts. See CO₂ avoided, water saved, and which pieces are working hardest.',
  },
  {
    eyebrow: 'Step 3',
    ink: 'borrow it',
    title: 'Share it, borrow it',
    body: 'Post a fit check to your group chat, vote live, and borrow pieces from your friends.',
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
          <h2 className="font-heading mt-3 text-[34px] leading-tight">{current.title}</h2>
          <p className="mt-4 text-white/70">{current.body}</p>
        </div>
        <div className="-mx-3 flex justify-center">
          <DotInk key={current.ink} text={current.ink} size={96} cell={4} weight={1.0} slant={0.06} color="#ffffff" tints={['#adc8d2', '#d9e5e2', '#f3f0e9']} vary={0.6} grid gridColor="rgba(255,255,255,0.10)" animate />
        </div>
        <div>
          <div className="mb-6 flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
          <PrimaryButton
            className="!bg-white !text-blueprint"
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
