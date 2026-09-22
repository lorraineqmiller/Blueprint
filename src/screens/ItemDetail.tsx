import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { ImagePlaceholder, PrimaryButton, SecondaryButton, StatTile } from '../components/ui'
import { useItemById } from '../lib/selectors'
import { costPerWear, formatRelative } from '../lib/impact'
import { useStore } from '../store'

export default function ItemDetail() {
  const nav = useNavigate()
  const { itemId } = useParams()
  const item = useItemById(itemId)
  const logWear = useStore((s) => s.logWear)
  const toggleLendable = useStore((s) => s.toggleLendable)

  if (!item) return null

  return (
    <Screen withNav={false}>
      <TopBar title="Item Detail" onBack={() => nav(-1)} />
      <ImagePlaceholder className="h-72 w-full" />
      <div className="px-5 py-5">
        <div className="eyebrow inline-block rounded-sm bg-navy px-2 py-1 text-[10px] text-white">
          {item.category} · {item.color}
        </div>
        <h1 className="font-heading mt-2 text-2xl font-semibold uppercase">{item.name}</h1>
        <p className="text-sm text-neutral-600">
          {item.brand} · {item.category}
        </p>

        <div className="mt-4 flex gap-3">
          <StatTile value={String(item.wearCount)} label="Wears" />
          <StatTile value={`$${costPerWear(item).toFixed(2)}`} label="Per Wear" />
          <StatTile value={formatRelative(item.lastWornAt)} label="Last Worn" />
        </div>

        <div className="mt-4 rounded-md border border-accent-300 bg-accent-100 p-4">
          <p className="text-sm font-semibold text-accent-700">
            {(item.wearCount * 0.6).toFixed(1)} kg CO₂ avoided
          </p>
          <p className="mt-1 text-sm text-ink">Every re-wear beats a new purchase. Keep this one in rotation.</p>
        </div>

        <div className="mt-5 space-y-3">
          <PrimaryButton onClick={() => logWear(item.id)}>I wore this today</PrimaryButton>
          <SecondaryButton onClick={() => toggleLendable(item.id)}>
            {item.lendable ? 'Make private (not lendable)' : 'Open this up to lending'}
          </SecondaryButton>
        </div>
      </div>
    </Screen>
  )
}
