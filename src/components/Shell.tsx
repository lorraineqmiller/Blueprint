import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pb-2 pt-3 font-heading text-[15px] font-semibold text-ink">
      <span>9:41</span>
      <div className="flex items-center gap-1 text-ink">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="7" width="3" height="5" />
          <rect x="5" y="5" width="3" height="7" />
          <rect x="10" y="3" width="3" height="9" />
          <rect x="15" y="0" width="3" height="12" />
        </svg>
        <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor">
          <path d="M7.5 10.5a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zM3.8 7.3a5.2 5.2 0 017.4 0l-1.4 1.5a3.2 3.2 0 00-4.6 0zM1 4.5a9 9 0 0113 0L12.6 6a7 7 0 00-10.2 0z" />
        </svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
          <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="currentColor" />
          <rect x="2" y="2" width="17" height="8" rx="1.2" fill="currentColor" />
          <rect x="21.5" y="4" width="1.5" height="4" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}

const tabs = [
  { to: '/home', label: 'Home' },
  { to: '/closet', label: 'Closet' },
  { to: '/chats', label: 'Chats' },
  { to: '/borrows', label: 'Borrows' },
  { to: '/profile', label: 'Profile' },
]

function BottomNav() {
  return (
    <div className="flex border-t border-neutral-300 bg-white px-2 py-3">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `eyebrow flex-1 border-b-2 pb-1 text-center text-[10px] tracking-wide ${
              isActive ? 'border-accent-600 text-accent-600' : 'border-transparent text-neutral-600'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}

export function Screen({
  children,
  withNav = true,
  withStatusBar = true,
  scroll = true,
}: {
  children: ReactNode
  withNav?: boolean
  withStatusBar?: boolean
  scroll?: boolean
}) {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-paper font-body text-ink shadow-2xl sm:h-[min(860px,100dvh)] sm:rounded-[2.5rem]">
      {withStatusBar && <StatusBar />}
      <div className={`flex flex-1 flex-col ${scroll ? 'overflow-y-auto' : 'overflow-hidden'}`}>{children}</div>
      {withNav && <BottomNav />}
    </div>
  )
}

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string
  onBack?: () => void
  right?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-300 bg-paper px-5 py-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded border border-neutral-400 text-ink"
        >
          ‹
        </button>
      )}
      <h1 className="font-heading flex-1 text-xl font-semibold uppercase tracking-wide">{title}</h1>
      {right}
    </div>
  )
}
