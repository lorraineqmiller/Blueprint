import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { useStore } from '../store'

export default function Join() {
  const nav = useNavigate()
  const setProfile = useStore((s) => s.setProfile)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [school, setSchool] = useState('Columbia University')

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Join" onBack={() => nav(-1)} />
      <div className="flex h-full flex-col justify-between px-6 py-6">
        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold uppercase">Join the Blueprint</h2>
            <p className="mt-1 text-sm text-neutral-600">One account, your whole closet.</p>
          </div>
          <div>
            <Eyebrow className="mb-1">Full name</Eyebrow>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anna Yang"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          <div>
            <Eyebrow className="mb-1">School email</Eyebrow>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anna@columbia.edu"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          <div>
            <Eyebrow className="mb-1">School</Eyebrow>
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
        </div>
        <PrimaryButton
          disabled={!name || !email}
          onClick={() => {
            setProfile({ name, handle: `@${name.toLowerCase().replace(/\s+/g, '')}`, school })
            nav('/onboarding')
          }}
        >
          Continue
        </PrimaryButton>
      </div>
    </Screen>
  )
}
