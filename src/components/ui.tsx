import { useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`eyebrow text-[11px] text-neutral-600 ${className}`}>{children}</div>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-neutral-300 bg-white ${className}`}>{children}</div>
}

export function Badge({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'accent' | 'light' }) {
  const tones = {
    dark: 'bg-navy text-white',
    accent: 'bg-accent-600 text-white',
    light: 'bg-neutral-200 text-neutral-800',
  }
  return (
    <span className={`eyebrow inline-block rounded-sm px-2 py-1 text-[10px] ${tones[tone]}`}>{children}</span>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`eyebrow w-full rounded-xl bg-accent-700 py-3 text-center text-sm tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`eyebrow w-full rounded-xl border border-neutral-400 bg-white py-3 text-center text-sm tracking-wider text-ink transition active:scale-[0.98] ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`eyebrow rounded-xl border py-3 text-xs tracking-wide transition ${
            value === o.value
              ? 'border-accent-600 bg-accent-600 text-white'
              : 'border-neutral-400 bg-white text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-md border border-neutral-300 bg-white py-3 text-center">
      <div className="font-heading text-2xl font-semibold leading-none">{value}</div>
      <div className="eyebrow mt-1 text-[10px] text-neutral-600">{label}</div>
    </div>
  )
}

export function ImagePlaceholder({ className = '', hatched = true }: { className?: string; hatched?: boolean }) {
  return (
    <div
      className={`bg-neutral-200 ${className}`}
      style={
        hatched
          ? {
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(29,31,32,0.08) 0, rgba(29,31,32,0.08) 2px, transparent 2px, transparent 10px)',
            }
          : undefined
      }
    />
  )
}

// Renders the real photo when there is one, falling back to the same
// hatched placeholder (including if the URL 404s — e.g. a stale local-demo
// blob: preview from a previous session) so nothing ever shows a broken
// image icon.
export function Photo({
  src,
  className = '',
  alt = '',
  rounded = false,
}: {
  src?: string | null
  className?: string
  alt?: string
  rounded?: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <ImagePlaceholder className={`${className} ${rounded ? 'rounded-full' : ''}`} />
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${rounded ? 'rounded-full' : ''} ${className}`}
    />
  )
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

// Profile picture, or a monogram of their initials when there isn't one
// (or it fails to load). Size comes from className (h-10 w-10 etc.); the
// monogram text scales with it via container-relative units.
export function Avatar({ src, name, className = '' }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} className={`shrink-0 rounded-full object-cover ${className}`} />
  }
  return (
    <div
      aria-label={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-navy font-heading font-semibold text-white [container-type:size] ${className}`}
    >
      <span className="text-[length:40cqh] leading-none tracking-wide">{initials(name)}</span>
    </div>
  )
}

export interface DropdownGroup {
  label?: string
  options: { value: string; label: string }[]
}

// In-app replacement for a native <select>, so the open list matches the
// rest of the UI instead of the OS picker. Closes on outside tap or Escape.
export function Dropdown({
  value,
  groups,
  placeholder,
  onChange,
}: {
  value: string
  groups: DropdownGroup[]
  placeholder: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const selected = groups.flatMap((g) => g.options).find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left outline-none ${
          open ? 'border-accent-600' : 'border-neutral-400'
        }`}
      >
        <span className={`truncate ${selected ? 'text-ink' : 'text-neutral-500'}`}>{selected?.label ?? placeholder}</span>
        <svg viewBox="0 0 12 8" className={`ml-2 h-2 w-3 shrink-0 transition ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-neutral-300 bg-white py-1 shadow-lg"
        >
          {groups.map((g, gi) => (
            <div key={g.label ?? gi}>
              {g.label && <div className="eyebrow bg-neutral-100 px-4 py-1.5 text-[10px] text-neutral-600">{g.label}</div>}
              {g.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                    o.value === value ? 'bg-accent-100 font-semibold text-accent-700' : 'text-ink active:bg-neutral-100'
                  }`}
                >
                  {o.label}
                  {o.value === value && <span className="text-accent-600">✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
