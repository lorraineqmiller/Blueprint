import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Eyebrow, PrimaryButton } from '../components/ui'
import { AvatarUpload } from '../components/AvatarUpload'
import { isLocationComplete, LocationPicker, type LocationValue } from '../components/LocationPicker'
import { isPhoneValid, PhoneField, SchoolCommunityRow, VisibilityToggle } from '../components/ProfileFields'
import { useStore } from '../store'

const BIO_MAX = 150

export default function EditProfile() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const setProfile = useStore((s) => s.setProfile)
  const setLocation = useStore((s) => s.setLocation)
  const setPhone = useStore((s) => s.setPhone)

  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [phone, setPhoneDraft] = useState(user.phone)
  const [location, setLocationDraft] = useState<LocationValue>({
    buildingId: user.buildingId,
    offCampus: user.offCampus,
    offCampusAddress: user.offCampusAddress,
  })

  const locationChanged =
    location.buildingId !== user.buildingId ||
    location.offCampus !== user.offCampus ||
    location.offCampusAddress?.address !== user.offCampusAddress?.address
  const canSave = name.trim().length > 0 && isPhoneValid(phone) && isLocationComplete(location)

  function save() {
    const patch: { name?: string; bio?: string } = {}
    if (name.trim() !== user.name) patch.name = name.trim()
    if (bio.trim() !== user.bio) patch.bio = bio.trim()
    if (Object.keys(patch).length) setProfile(patch)
    if (phone !== user.phone) setPhone(phone)
    if (locationChanged) setLocation({ buildingId: location.buildingId, offCampus: location.offCampus }, location.offCampusAddress)
    nav('/profile')
  }

  return (
    <Screen withNav={false} scroll={false}>
      <TopBar title="Edit Profile" onBack={() => nav(-1)} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <AvatarUpload className="h-20 w-20" />
            <p className="text-xs text-neutral-600">Tap your photo to change it. Without one, friends see your initials.</p>
          </div>

          <div>
            <Eyebrow className="mb-1">Name</Eyebrow>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <Eyebrow>Bio</Eyebrow>
              <span className="text-[11px] text-neutral-500">
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              rows={3}
              placeholder="What's your style? What are you always lending out?"
              className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 text-sm outline-none focus:border-accent-600"
            />
          </div>

          <div>
            <Eyebrow className="mb-1">Where you live</Eyebrow>
            <LocationPicker value={location} onChange={setLocationDraft} />
          </div>

          <PhoneField value={phone} onChange={setPhoneDraft} />

          <div>
            <Eyebrow className="mb-2">School community</Eyebrow>
            <SchoolCommunityRow />
          </div>

          <div>
            <Eyebrow className="mb-2">Profile visibility</Eyebrow>
            <VisibilityToggle />
          </div>
        </div>
        <div className="border-t border-neutral-300 bg-paper px-6 py-4">
          <PrimaryButton disabled={!canSave} onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </Screen>
  )
}
