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
      className={`eyebrow w-full rounded-md bg-accent-700 py-4 text-center text-sm tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none ${className}`}
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
      className={`eyebrow w-full rounded-md border border-neutral-400 bg-white py-4 text-center text-sm tracking-wider text-ink transition active:scale-[0.98] ${className}`}
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
          className={`eyebrow rounded-md border py-3 text-xs tracking-wide transition ${
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
