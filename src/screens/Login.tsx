import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'

export default function Login() {
  const nav = useNavigate()
  const signIn = useStore((s) => s.signIn)
  const authError = useStore((s) => s.authError)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isBackendEnabled) {
    // No backend configured — this is the local demo. "Logging in" just
    // means dropping straight into the seeded single-user experience.
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Log In" onBack={() => nav(-1)} />
        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
          <div>
            <h2 className="font-heading text-2xl font-semibold uppercase">Welcome back</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This build has no backend connected, so there's nothing to authenticate against — continue straight
              into the demo account.
            </p>
          </div>
          <PrimaryButton onClick={() => nav('/home')}>Continue as Anna</PrimaryButton>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Log In" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold uppercase">Welcome back</h2>
            <p className="mt-1 text-sm text-neutral-600">Log in to your Blueprint account.</p>
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
          <div>
            <Eyebrow className="mb-1">Password</Eyebrow>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
        </div>
        <div className="space-y-3">
          <PrimaryButton
            disabled={!email || !password || loading}
            onClick={async () => {
              setLoading(true)
              try {
                await signIn({ email, password })
                nav('/home')
              } catch {
                // authError is already set by the store; stay on this screen
              } finally {
                setLoading(false)
              }
            }}
          >
            {loading ? 'Logging in…' : 'Log In'}
          </PrimaryButton>
          <button onClick={() => nav('/join')} className="eyebrow w-full py-2 text-xs tracking-wide text-accent-600">
            New here? Join instead
          </button>
        </div>
      </div>
    </Screen>
  )
}
