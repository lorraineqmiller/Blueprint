import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { communityName } from '../data/communities'
import { Eyebrow } from './ui'

// Shared between Profile Setup and Edit Profile.

export function VisibilityToggle() {
  const isPublic = useStore((s) => s.user.isPublic)
  const setPublic = useStore((s) => s.setPublic)
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((pub) => (
          <button
            key={String(pub)}
            onClick={() => setPublic(pub)}
            className={`eyebrow rounded-md border py-4 text-xs tracking-wide ${
              isPublic === pub ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
            }`}
          >
            {pub ? 'Public' : 'Private'}
          </button>
        ))}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-neutral-600">
        <li>• Either way, only friends can browse your closet and ask to borrow.</li>
        {isPublic ? (
          <li>• Public: anyone on Blueprint can see and vote on fit checks you post publicly.</li>
        ) : (
          <li>• Private: your fit checks and votes stay between you and your friends.</li>
        )}
      </ul>
    </div>
  )
}

// Light formatting only: digits and a leading +. Real validation (and
// SMS verification) belongs with the contact-matching feature this is for.
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
}

export function isPhoneValid(phone: string): boolean {
  if (!phone) return true // optional
  return phone.replace(/\D/g, '').length >= 10
}

export function PhoneField({ value, onChange, onBlur }: { value: string; onChange: (v: string) => void; onBlur?: () => void }) {
  return (
    <div>
      <Eyebrow className="mb-1">Phone number · optional</Eyebrow>
      <input
        value={value}
        onChange={(e) => onChange(normalizePhone(e.target.value))}
        onBlur={onBlur}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="(212) 555-0134"
        className="w-full rounded-md border border-neutral-400 bg-white px-4 py-3 outline-none focus:border-accent-600"
      />
      <p className={`mt-1 text-xs ${isPhoneValid(value) ? 'text-neutral-500' : 'text-red-600'}`}>
        {isPhoneValid(value) ? 'Only you can see this. Later it’ll help friends from your contacts find you.' : 'Enter a full phone number.'}
      </p>
    </div>
  )
}

export function SchoolCommunityRow() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const community = communityName(user.communityId)
  return (
    <button
      onClick={() => nav('/verify-school')}
      className={`flex w-full items-center justify-between rounded-md border p-4 text-left ${
        community ? 'border-neutral-300 bg-white' : 'border-dashed border-accent-300 bg-accent-100'
      }`}
    >
      <div className="min-w-0">
        {community ? (
          <>
            <div className="text-sm font-semibold">{user.school}</div>
            <p className="truncate text-xs text-neutral-600">
              {community} community · {user.schoolEmail}
            </p>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-accent-700">Join your school community</div>
            <p className="text-xs text-ink">Verify a Columbia or Barnard email to find classmates.</p>
          </>
        )}
      </div>
      <span className="text-accent-700">›</span>
    </button>
  )
}
