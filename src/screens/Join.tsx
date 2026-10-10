import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { useStore } from '../store'
import { isBackendEnabled } from '../lib/supabaseClient'
import { isHandleAvailable } from '../lib/backendApi'

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

export default function Join() {
  const nav = useNavigate()
  const setProfile = useStore((s) => s.setProfile)
  const signUp = useStore((s) => s.signUp)
  const authError = useStore((s) => s.authError)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isBackendEnabled) return
    if (username.length === 0) {
      setUsernameStatus('idle')
      return
    }
    if (!USERNAME_PATTERN.test(username)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const available = await isHandleAvailable(`@${username}`)
        if (!cancelled) setUsernameStatus(available ? 'available' : 'taken')
      } catch {
        if (!cancelled) setUsernameStatus('error')
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username])

  const usernameOk = isBackendEnabled ? usernameStatus === 'available' : true
  const canContinue = isBackendEnabled
    ? Boolean(name && email && password.length >= 6 && usernameOk)
    : Boolean(name && email)

  const usernameHint: Record<UsernameStatus, string | null> = {
    idle: null,
    checking: 'Checking…',
    available: 'Available',
    taken: 'Already taken — try another',
    invalid: '3-20 characters: lowercase letters, numbers, underscore',
    error: "Couldn't check right now",
  }
  const usernameHintColor: Record<UsernameStatus, string> = {
    idle: 'text-neutral-500',
    checking: 'text-neutral-500',
    available: 'text-accent-600',
    taken: 'text-red-600',
    invalid: 'text-red-600',
    error: 'text-red-600',
  }

  async function handleContinue() {
    if (!isBackendEnabled) {
      setProfile({ name, handle: `@${name.toLowerCase().replace(/\s+/g, '')}` })
      nav('/onboarding')
      return
    }
    setLoading(true)
    try {
      const { needsEmailConfirmation } = await signUp({ email, password, name, handle: `@${username}` })
      if (needsEmailConfirmation) {
        setAwaitingConfirmation(true)
        return
      }
      // onAuthStateChange (wired up in App.tsx) hydrates the store from the
      // new profile row the signup trigger just created, then we move on.
      nav('/onboarding')
    } catch {
      // authError is already set by the store; stay on this screen
    } finally {
      setLoading(false)
    }
  }

  if (awaitingConfirmation) {
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="Join" onBack={() => setAwaitingConfirmation(false)} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
          <h2 className="font-heading text-2xl font-semibold uppercase">Check your inbox</h2>
          <p className="mt-2 text-sm text-neutral-600">
            We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>. Tap it to finish
            setting up your account.
          </p>
          <button onClick={() => nav('/login')} className="eyebrow mt-6 text-xs tracking-wide text-accent-600">
            Already confirmed? Log in
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Join" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold uppercase">Become the Blueprint</h2>
            <p className="mt-1 text-sm text-neutral-600">One account, your whole closet.</p>
          </div>
          <div>
            <Eyebrow className="mb-1">Full name</Eyebrow>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full rounded-xl border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          {isBackendEnabled && (
            <div>
              <Eyebrow className="mb-1">Username</Eyebrow>
              <div className="flex items-center rounded-xl border border-neutral-400 bg-white focus-within:border-accent-600">
                <span className="pl-4 text-neutral-500">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="blueprintusername"
                  className="w-full rounded-xl bg-transparent py-3 pl-1 pr-4 outline-none"
                />
              </div>
              {usernameHint[usernameStatus] && (
                <p className={`mt-1 text-xs ${usernameHintColor[usernameStatus]}`}>{usernameHint[usernameStatus]}</p>
              )}
            </div>
          )}
          <div>
            <Eyebrow className="mb-1">Email</Eyebrow>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full rounded-xl border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
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
                className="w-full rounded-xl border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
            </div>
          )}
          {authError && <p className="text-sm text-red-600">{authError}</p>}
        </div>
        <PrimaryButton disabled={!canContinue || loading} onClick={handleContinue}>
          {loading ? 'Creating account…' : 'Continue'}
        </PrimaryButton>
      </div>
    </Screen>
  )
}
