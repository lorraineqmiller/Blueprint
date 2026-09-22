import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { PrimaryButton } from '../components/ui'

export default function Splash() {
  const nav = useNavigate()
  return (
    <Screen withNav={false} withStatusBar={false} scroll={false}>
      <div className="grid-paper flex h-full flex-col items-center justify-center bg-navy px-8 text-center text-white">
        <div className="mb-8 flex h-16 w-16 items-center justify-center border border-white/40 font-heading text-2xl font-semibold">
          B
        </div>
        <h1 className="font-heading text-5xl font-semibold uppercase leading-[0.95] tracking-wide">
          The
          <br />
          Blueprint
        </h1>
        <p className="mt-5 max-w-[280px] text-white/70">Your closet, your friends, one group chat away.</p>
        <div className="eyebrow mt-6 rounded border border-white/30 px-4 py-2 text-[11px] tracking-widest text-white/80">
          Wear it · Share it · Borrow it
        </div>
        <div className="mt-14 w-full max-w-[320px] space-y-4">
          <PrimaryButton onClick={() => nav('/join')}>Get Started</PrimaryButton>
          <button
            onClick={() => nav('/home')}
            className="eyebrow w-full py-2 text-xs tracking-wide text-white/60"
          >
            I already have an account
          </button>
        </div>
      </div>
    </Screen>
  )
}
