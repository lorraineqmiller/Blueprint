import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { ImagePlaceholder } from '../components/ui'
import { useMyItems } from '../lib/selectors'
import type { Category } from '../types'

const categories: (Category | 'All')[] = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

export default function Closet() {
  const nav = useNavigate()
  const items = useMyItems()
  const [filter, setFilter] = useState<Category | 'All'>('All')

  const filtered = useMemo(
    () => (filter === 'All' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  )
  const lendableCount = items.filter((i) => i.lendable).length
  const reworn = Math.round((items.filter((i) => i.wearCount > 1).length / Math.max(items.length, 1)) * 100)

  return (
    <Screen>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold uppercase">My Closet</h1>
            <p className="text-sm text-neutral-600">
              {items.length} pieces · {lendableCount} lendable
            </p>
          </div>
          <button
            onClick={() => nav('/closet/add')}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-600 text-xl text-white"
          >
            +
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`eyebrow rounded-md border py-2 text-[11px] tracking-wide ${
                filter === c ? 'border-accent-600 bg-accent-600 text-white' : 'border-neutral-400 bg-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={() => nav('/closet-impact')}
          className="mt-4 block w-full rounded-md border border-accent-300 bg-accent-100 p-4 text-left"
        >
          <span className="font-heading text-2xl font-semibold text-accent-700">{reworn}%</span>{' '}
          <span className="text-sm text-ink">of your closet got re-worn this semester. See the full impact report.</span>
          <span className="ml-1 text-accent-700">›</span>
        </button>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => nav(`/closet/${item.id}`)}
              className="overflow-hidden rounded-md border border-neutral-300 bg-white text-left"
            >
              <div className="relative">
                <ImagePlaceholder className="h-40 w-full" />
                {item.wearCount > 30 && (
                  <span className="eyebrow absolute left-1 top-1 rounded-sm bg-navy px-1.5 py-0.5 text-[9px] text-white">
                    Most Worn
                  </span>
                )}
                {item.lendable && item.wearCount <= 30 && (
                  <span className="eyebrow absolute left-1 top-1 rounded-sm bg-accent-600 px-1.5 py-0.5 text-[9px] text-white">
                    Lendable
                  </span>
                )}
                <span className="eyebrow absolute bottom-1 left-1 rounded-sm bg-navy/90 px-1.5 py-0.5 text-[9px] text-white">
                  {item.category === 'Tops' ? 'Tee · Cotton' : `${item.category}`}
                </span>
              </div>
              <div className="px-2 py-2">
                <div className="text-sm font-semibold uppercase">{item.name}</div>
                <div className="text-xs text-neutral-600">
                  {item.brand} · {item.wearCount} wears
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}
