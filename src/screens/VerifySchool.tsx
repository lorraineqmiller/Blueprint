import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { communityName, matchSchoolDomain } from '../data/communities'
import type { VerifyResult } from '../lib/backendApi'
import { useStore } from '../store'

const verifyErrors: Record<Exclude<VerifyResult, 'verified'>, string> = {
  incorrect: "That code isn't right. Check the email and try again.",
  expired: 'That code expired. Send a new one.',
  too_many_attempts: 'Too many tries. Send a new code.',
  no_pending: 'Send a code first.',
  email_taken: 'That school email is already linked to another account.',
  unsupported_domain: "That school isn't on Blueprint yet.",
}

// Like Snapchat's school verification: your account stays on whatever
// email you signed up with, and a school address is linked separately just
// to prove you belong to the campus community.
export default function VerifySchool() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const sendSchoolCode = useStore((s) => s.sendSchoolCode)
  const verifySchoolCode = useStore((s) => s.verifySchoolCode)

  const [email, setEmail] = useState(user.pendingSchoolEmail ?? '')
  const [step, setStep] = useState<'email' | 'code' | 'done'>(user.pendingSchoolEmail ? 'code' : 'email')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const community = communityName(user.communityId)
  const emailLooksRight = Boolean(matchSchoolDomain(email))

  async function send() {
    setBusy(true)
    setError(null)
    try {
      const res = await sendSchoolCode(email)
      setDemoCode(res.demoCode ?? null)
      setCode('')
      setStep('code')
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code.")
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setBusy(true)
    setError(null)
    try {
      const result = await verifySchoolCode(code)
      if (result === 'verified') setStep('done')
      else setError(verifyErrors[result])
    } catch {
      setError("Couldn't check the code right now. Try again.")
    } finally {
      setBusy(false)
    }
  }

  if (step === 'done') {
    return (
      <Screen withNav={false} scroll={false}>
        <TopBar title="School" onBack={() => nav(-1)} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="font-heading text-2xl font-semibold uppercase">You're in</div>
          <p className="mt-2 text-sm text-neutral-600">
            Welcome to the {community} community. Classmates now show up in
            your friend suggestions.
          </p>
          <PrimaryButton className="mt-6" onClick={() => nav(-1)}>
            Done
          </PrimaryButton>
        </div>
      </Screen>
    )
  }

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="School" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold uppercase">Join your school</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Verify a school email to join your campus community. You'll still log in with the email you
              signed up with — this one's only used to prove you're a student.
            </p>
          </div>

          {community && (
            <div className="rounded-md border border-neutral-300 bg-white p-4 text-sm">
              <div className="font-semibold">{user.school}</div>
              <p className="text-xs text-neutral-600">Verified as {user.schoolEmail}. Verify another address below to switch.</p>
            </div>
          )}

          {step === 'email' && (
            <div>
              <Eyebrow className="mb-1">School email</Eyebrow>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="off"
                placeholder="uni@columbia.edu"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
              />
              <p className={`mt-1 text-xs ${/@[^@]+\.[a-z]{2,}$/i.test(email) && !emailLooksRight ? 'text-red-600' : 'text-neutral-500'}`}>
                Columbia and Barnard emails only for now — more schools soon.
              </p>
            </div>
          )}

          {step === 'code' && (
            <div>
              <Eyebrow className="mb-1">6-digit code</Eyebrow>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 text-center font-heading text-2xl tracking-[0.5em] outline-none focus:border-accent-600"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Sent to <span className="font-semibold text-ink">{email}</span>.{' '}
                <button onClick={() => setStep('email')} className="text-accent-600 underline">
                  Use a different email
                </button>
              </p>
              {demoCode && (
                <p className="mt-2 rounded-md bg-neutral-200 px-3 py-2 text-xs text-neutral-700">
                  Demo mode — no backend, so nothing was emailed. Your code is{' '}
                  <span className="font-semibold tracking-widest">{demoCode}</span>.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 space-y-3">
          {step === 'email' ? (
            <PrimaryButton disabled={!emailLooksRight || busy} onClick={send}>
              {busy ? 'Sending…' : 'Send code'}
            </PrimaryButton>
          ) : (
            <>
              <PrimaryButton disabled={code.length !== 6 || busy} onClick={verify}>
                {busy ? 'Checking…' : 'Verify'}
              </PrimaryButton>
              <button onClick={send} disabled={busy} className="eyebrow w-full py-2 text-xs tracking-wide text-accent-600">
                Resend code
              </button>
            </>
          )}
        </div>
      </div>
    </Screen>
  )
}
