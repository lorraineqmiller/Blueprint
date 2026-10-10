import { useMemo, useState } from 'react'
import type { Category, ClothingItem, VoteOption } from '../types'
import { Photo } from './ui'

// Up to 4 piece photos in a grid — how a closet-built option looks.
export function ItemCollage({ items, className = 'h-32' }: { items: ClothingItem[]; className?: string }) {
  const shown = items.slice(0, 4)
  if (shown.length === 0) return <Photo src={null} className={`w-full ${className}`} />
  if (shown.length === 1) return <Photo src={shown[0].imageUrl} alt={shown[0].name} className={`w-full ${className}`} />
  return (
    <div className={`grid w-full grid-cols-2 gap-px bg-neutral-300 ${className}`}>
      {shown.map((i, idx) => (
        <Photo
          key={i.id}
          src={i.imageUrl}
          alt={i.name}
          className={`h-full w-full ${shown.length === 3 && idx === 0 ? 'row-span-2' : ''}`}
        />
      ))}
    </div>
  )
}

// A fit pic when there is one, otherwise the pieces.
export function OptionVisual({ option, items, className = 'h-32' }: { option: Pick<VoteOption, 'imageUrl' | 'itemIds'>; items: ClothingItem[]; className?: string }) {
  if (option.imageUrl) return <Photo src={option.imageUrl} alt="Fit pic" className={`w-full ${className}`} />
  const pieces = option.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is ClothingItem => Boolean(i))
  return <ItemCollage items={pieces} className={className} />
}

const CATEGORIES: (Category | 'All')[] = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

// Searchable, filterable grid of pieces with multi-select.
export function ItemPicker({
  items,
  selected,
  onToggle,
  emptyText = 'Nothing here yet.',
}: {
  items: ClothingItem[]
  selected: string[]
  onToggle: (id: string) => void
  emptyText?: string
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const q = query.trim().toLowerCase()
  const shown = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === 'All' || i.category === category) &&
          (!q || `${i.name} ${i.brand} ${i.color}`.toLowerCase().includes(q)),
      ),
    [items, category, q],
  )

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search pieces"
        className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-sm outline-none focus:border-accent-600"
      />
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`eyebrow shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${
              category === c ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {shown.map((item) => {
          const on = selected.includes(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`relative overflow-hidden rounded-xl border-2 bg-white text-left ${on ? 'border-accent-600' : 'border-transparent'}`}
            >
              <Photo src={item.imageUrl} alt={item.name} className="h-20 w-full" />
              <div className="truncate px-1 py-0.5 text-[10px] font-semibold uppercase">{item.name}</div>
              {on && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-[11px] text-white">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
      {shown.length === 0 && <p className="mt-2 text-sm text-neutral-500">{items.length ? 'No matches.' : emptyText}</p>}
    </div>
  )
}
