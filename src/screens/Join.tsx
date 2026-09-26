import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function Join() {
  const nav = useNavigate()
  const setProfile = useStore((s) => s.setProfile)
  const signUp = useStore((s) => s.signUp)
  const authError = useStore((s) => s.authError)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [school, setSchool] = useState('Columbia University')
  const [loading, setLoading] = useState(false)

  const canContinue = isBackendEnabled ? Boolean(name && email && password.length >= 6) : Boolean(name && email)

  async function handleContinue() {
    const handle = `@${name.toLowerCase().replace(/\s+/g, '')}`
    if (!isBackendEnabled) {
      setProfile({ name, handle, school })
      nav('/onboarding')
      return
    }
    setLoading(true)
    try {
      await signUp({ email, password, name, handle, school })
      // onAuthStateChange (wired up in App.tsx) hydrates the store from the
      // new profile row the signup trigger just created, then we move on.
      nav('/onboarding')
    } catch {
      // authError is already set by the store; stay on this screen
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Join" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
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
              type="email"
              placeholder="anna@columbia.edu"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          {isBackendEnabled && (
            <div>
              <Eyebrow className="mb-1">Password</Eyebrow>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="At least 6 characters"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
            </div>
          )}
          <div>
            <Eyebrow className="mb-1">School</Eyebrow>
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
        </div>
        <PrimaryButton disabled={!canContinue || loading} onClick={handleContinue}>
          {loading ? 'Creating account…' : 'Continue'}
        </PrimaryButton>
      </div>
    </Screen>
  )
}
