import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[15px] font-semibold text-ink">
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

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="mx-auto mb-1 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)

const tabs = [
  { to: '/home', label: 'Today', icon: icon('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z') },
  { to: '/closet', label: 'Closet', icon: icon('M12 6a2 2 0 1 1 2-2M12 6v2l9 7v2H3v-2l9-7') },
  { to: '/fit-checks', label: 'Fit Checks', icon: icon('M4 5h16v11H9l-5 4z') },
  { to: '/borrows', label: 'Borrows', icon: icon('M7 7h12l-3-3M17 17H5l3 3') },
  { to: '/profile', label: 'Profile', icon: icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6') },
]

function BottomNav() {
  return (
    <div className="flex border-t border-neutral-300/70 bg-paper/95 px-2 pb-4 pt-2 backdrop-blur">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex min-h-[44px] flex-1 flex-col items-center justify-center text-center text-[10px] font-medium ${
              isActive ? 'text-blueprint' : 'text-neutral-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {t.icon}
              <span>{t.label}</span>
              <span className={`mt-1 h-1 w-1 rounded-full ${isActive ? 'bg-blueprint' : 'bg-transparent'}`} />
            </>
          )}
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
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-paper grain font-body text-ink shadow-[0_30px_80px_-20px_rgba(21,91,132,0.35)] sm:h-[min(860px,100dvh)] sm:rounded-[2.5rem] sm:border sm:border-white/60">
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
    <div className="flex items-center gap-3 border-b border-neutral-300/70 bg-paper px-5 py-4">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-mist"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-xl font-semibold tracking-tight">{title}</h1>
      {right}
    </div>
  )
}
