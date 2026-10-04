import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { AvatarUpload } from '../components/AvatarUpload'
import { isLocationComplete, LocationPicker, type LocationValue } from '../components/LocationPicker'
import { isPhoneValid, PhoneField, SchoolCommunityRow, VisibilityToggle } from '../components/ProfileFields'
import { useStore } from '../store'

// Kept short on purpose: photo, where you live, who sees what. Bio and the
// rest can wait for Edit Profile. Each field saves as soon as it's valid,
// so a detour to verify a school email doesn't lose anything.
export default function ProfileSetup() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const setLocation = useStore((s) => s.setLocation)
  const setPhone = useStore((s) => s.setPhone)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const [location, setLocationDraft] = useState<LocationValue>({
    buildingId: user.buildingId,
    offCampus: user.offCampus,
    offCampusAddress: user.offCampusAddress,
  })
  const [phone, setPhoneDraft] = useState(user.phone)

  const canFinish = isLocationComplete(location) && isPhoneValid(phone)

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Profile Setup" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <AvatarUpload />
            <div className="min-w-0">
              <div className="font-heading truncate text-lg font-semibold">{user.name}</div>
              <div className="truncate text-sm text-neutral-600">{user.handle}</div>
              <p className="text-xs text-neutral-500">Tap to add a photo</p>
            </div>
          </div>

          <div>
            <Eyebrow className="mb-1">Where you live</Eyebrow>
            <LocationPicker
              value={location}
              onChange={(v) => {
                setLocationDraft(v)
                if (isLocationComplete(v)) setLocation({ buildingId: v.buildingId, offCampus: v.offCampus }, v.offCampusAddress)
              }}
            />
            <p className="mt-2 text-xs text-neutral-600">
              Friends see your building (or just "off campus") and how many minutes away you are — nothing more precise.
            </p>
          </div>

          <PhoneField
            value={phone}
            onChange={setPhoneDraft}
            onBlur={() => isPhoneValid(phone) && phone !== user.phone && setPhone(phone)}
          />

          <div>
            <Eyebrow className="mb-2">School community · optional</Eyebrow>
            <SchoolCommunityRow />
          </div>

          <div>
            <Eyebrow className="mb-2">Profile visibility</Eyebrow>
            <VisibilityToggle />
          </div>
        </div>
        <PrimaryButton
          className="mt-6"
          disabled={!canFinish}
          onClick={() => {
            if (phone !== user.phone) setPhone(phone)
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
