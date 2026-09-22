import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Card, PrimaryButton } from '../components/ui'
import { useStore } from '../store'

const perks = [
  'Unlimited fit checks per week',
  'Full closet impact history, not just this semester',
  'Priority placement in Closets Near Me',
  'Early access to new features',
]

export default function BlueprintPlus() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const upgrade = useStore((s) => s.upgradeToPlus)

  return (
    <Screen withNav={false}>
      <TopBar title="Blueprint Plus" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <div className="grid-paper rounded-md bg-navy p-6 text-center text-white">
          <div className="font-heading text-2xl font-semibold uppercase">Blueprint Plus</div>
          <p className="mt-2 text-sm text-white/70">For the ones who never stop styling.</p>
        </div>

        <div className="mt-4 space-y-2">
          {perks.map((p) => (
            <Card key={p} className="p-3 text-sm">
              {p}
            </Card>
          ))}
        </div>

        {user.isPremium ? (
          <p className="mt-5 text-center text-sm text-accent-600">You're already on Blueprint Plus.</p>
        ) : (
          <>
            <p className="mt-5 text-center text-xs text-neutral-500">
              This is a demo — no real payment is processed. $4.99/mo, cancel anytime.
            </p>
            <PrimaryButton className="mt-2" onClick={upgrade}>
              Try Blueprint Plus
            </PrimaryButton>
          </>
        )}
      </div>
    </Screen>
  )
}
