import { useRef } from 'react'
import { useStore } from '../store'
import { Avatar } from './ui'

// Tap to pick a photo — on a phone, `accept="image/*"` without `capture`
// offers both the camera roll and the camera. Shows the initials monogram
// until there's a photo.
export function AvatarUpload({ className = 'h-16 w-16' }: { className?: string }) {
  const user = useStore((s) => s.user)
  const uploadAvatar = useStore((s) => s.uploadAvatar)
  const input = useRef<HTMLInputElement>(null)

  return (
    <>
      <button onClick={() => input.current?.click()} className="relative shrink-0" aria-label="Change profile photo">
        <Avatar src={user.avatarUrl} name={user.name} className={className} />
        <span className="eyebrow absolute -bottom-1 -right-1 rounded-full bg-accent-700 px-1.5 py-0.5 text-[8px] text-white">
          {user.avatarUrl ? 'Edit' : 'Add'}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadAvatar(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
