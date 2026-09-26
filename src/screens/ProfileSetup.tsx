import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, ImagePlaceholder, PrimaryButton } from '../components/ui'
import { useStore } from '../store'

export default function ProfileSetup() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const setProfile = useStore((s) => s.setProfile)
  const setPublic = useStore((s) => s.setPublic)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const [classYear, setClassYear] = useState(user.classYear)
  const [building, setBuilding] = useState(user.building)
  const [floor, setFloor] = useState(user.floor)

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Profile Setup" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <ImagePlaceholder className="h-16 w-16 rounded-full" />
            <div>
              <div className="font-heading text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-neutral-600">{user.handle}</div>
            </div>
          </div>
          <div>
            <Eyebrow className="mb-1">Class year</Eyebrow>
            <input
              value={classYear}
              onChange={(e) => setClassYear(e.target.value)}
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>
          <div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Eyebrow className="mb-1">Building</Eyebrow>
                <input
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Sulzberger Hall"
                  className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
                />
              </div>
              <div className="w-24">
                <Eyebrow className="mb-1">Floor</Eyebrow>
                <input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="7"
                  className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              Used to show friends how close your closet is — never anything more precise than this.
            </p>
          </div>
          <div>
            <Eyebrow className="mb-2">Profile visibility</Eyebrow>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPublic(true)}
                className={`eyebrow rounded-md border py-4 text-xs tracking-wide ${
                  user.isPublic ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setPublic(false)}
                className={`eyebrow rounded-md border py-4 text-xs tracking-wide ${
                  !user.isPublic ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
                }`}
              >
                Private
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              {user.isPublic
                ? 'Friends can browse your closet and send borrow requests.'
                : 'Only you can see your closet. You can change this anytime.'}
            </p>
          </div>
        </div>
        <PrimaryButton
          onClick={() => {
            setProfile({ classYear, building, floor })
            completeOnboarding()
            nav('/home')
          }}
        >
          Enter The Blueprint
        </PrimaryButton>
      </div>
    </Screen>
  )
}
