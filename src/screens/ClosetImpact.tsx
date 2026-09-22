import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Shell'
import { Card, ImagePlaceholder, StatTile } from '../components/ui'
import { useMyItems } from '../lib/selectors'
import { closetImpact, costPerWear, daysSince } from '../lib/impact'
import { useStore } from '../store'

function monthName(m: string) {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString([], { month: 'short' }).toUpperCase()
}

export default function ClosetImpact() {
  const nav = useNavigate()
  const items = useMyItems()
  const wearLog = useStore((s) => s.wearLog)
  const impact = closetImpact(items)

  const months = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const w of wearLog) {
      if (items.some((i) => i.id === w.itemId)) {
        byMonth.set(w.month, (byMonth.get(w.month) ?? 0) + w.count)
      }
    }
    return [...byMonth.entries()].sort(([a], [b]) => (a > b ? 1 : -1)).slice(-6)
  }, [wearLog, items])

  const maxCount = Math.max(...months.map(([, c]) => c), 1)
  const bestMonth = months.reduce((a, b) => (b[1] > a[1] ? b : a), months[0])

  const hardestWorking = [...items].sort((a, b) => b.wearCount - a.wearCount).slice(0, 3)
  const idle = items.filter((i) => daysSince(i.lastWornAt) >= 60).sort((a, b) => daysSince(b.lastWornAt) - daysSince(a.lastWornAt))

  return (
    <Screen withNav={false}>
      <TopBar title="Closet Impact" onBack={() => nav(-1)} />
      <div className="px-5 py-5">
        <div className="grid-paper rounded-md bg-navy p-5 text-white">
          <p className="eyebrow text-[10px] text-white/60">This semester</p>
          <div className="font-heading mt-1 text-4xl font-semibold">{impact.co2Kg} kg</div>
          <p className="mt-1 text-sm text-white/70">
            CO₂ avoided by re-wearing and borrowing instead of re-buying
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-white/20 p-3">
              <p className="eyebrow text-[10px] text-white/60">Water saved</p>
              <p className="font-heading text-xl font-semibold">{impact.waterL.toLocaleString()} L</p>
            </div>
            <div className="rounded-md border border-white/20 p-3">
              <p className="eyebrow text-[10px] text-white/60">Textile waste avoided</p>
              <p className="font-heading text-xl font-semibold">{impact.wasteKg} kg</p>
            </div>
          </div>
        </div>

        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between">
            <span className="font-heading text-lg font-semibold uppercase">Wears Logged</span>
            <span className="text-xs text-neutral-500">{impact.wears} total</span>
          </div>
          <div className="mt-3 flex items-end gap-2" style={{ height: 96 }}>
            {months.map(([m, c]) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-accent-600"
                  style={{ height: `${Math.max((c / maxCount) * 80, 6)}px` }}
                />
                <span className="eyebrow text-[9px] text-neutral-500">{monthName(m)}</span>
              </div>
            ))}
          </div>
          {bestMonth && (
            <p className="mt-2 text-xs text-neutral-600">
              Best month yet: {bestMonth[1]} wears in {monthName(bestMonth[0])[0] + monthName(bestMonth[0]).slice(1).toLowerCase()}.
            </p>
          )}
        </Card>

        <div className="mt-4">
          <h2 className="font-heading text-lg font-semibold uppercase">Hardest Working Pieces</h2>
          <div className="mt-2 space-y-2">
            {hardestWorking.map((item, idx) => (
              <Card key={item.id} className="flex items-center gap-3 p-3">
                <span className="font-heading w-4 text-center text-sm text-neutral-500">{idx + 1}</span>
                <ImagePlaceholder className="h-12 w-12 rounded-md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold uppercase">{item.name}</div>
                  <div className="text-xs text-neutral-600">
                    {item.wearCount} wears · ${costPerWear(item).toFixed(2)} per wear
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-4 mb-2">
          <h2 className="font-heading text-lg font-semibold uppercase">Sitting Idle — Lend These</h2>
          <p className="text-sm text-neutral-600">
            {idle.length} piece{idle.length === 1 ? '' : 's'} you haven't touched in 60 days. Someone on your floor needs them this week.
          </p>
          <div className="mt-2 space-y-2">
            {idle.map((item) => (
              <button key={item.id} onClick={() => nav(`/closet/${item.id}`)} className="block w-full text-left">
                <Card className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-semibold uppercase">{item.name}</div>
                    <div className="text-xs text-neutral-600">
                      {item.wearCount} wears · idle {Math.floor(daysSince(item.lastWornAt) / 7)} weeks
                    </div>
                  </div>
                  <span className="eyebrow text-[10px] text-accent-600">
                    {item.lendable ? 'Open to lending' : 'Not lendable'}
                  </span>
                </Card>
              </button>
            ))}
            {idle.length === 0 && <p className="text-sm text-neutral-500">Everything's in rotation. Nice.</p>}
          </div>
        </div>
      </div>
    </Screen>
  )
}
