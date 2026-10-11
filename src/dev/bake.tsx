// Dev-only page for baking DotInk words (npm run dev → /bake.html).
//
// Tracing a word's pen path depends on how the browser rasterizes the font,
// which varies between engines, so fixed words are traced once here and
// shipped as data. Adjust the settings, check the order in the time view,
// then download and replace the file named below.
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { DotInk, traceDotInk, type BakedInk } from '../components/DotInk'
import current from '../data/blueprintInk.json'

// Must match how the word is used on Splash.
const DEFAULTS = { text: 'blueprint', font: 'Sacramento', size: 120, cell: 4, weight: 1.0, slant: 0.06 }
const OUTPUT = 'src/data/blueprintInk.json'

function TimeView({ ink }: { ink: BakedInk }) {
  // Colour each dot by when it inks: dark blue first, through to pale last.
  const max = Math.max(1, ...ink.dots.filter((_, i) => i % 3 === 2))
  const w = ink.cols * ink.cell
  const h = ink.rows * ink.cell
  const cells = []
  for (let i = 0; i < ink.dots.length; i += 3) cells.push([ink.dots[i], ink.dots[i + 1], ink.dots[i + 2]])
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full max-w-[560px] bg-white">
      {cells.map(([c, r, t], i) => (
        <circle
          key={i}
          cx={c * ink.cell + ink.cell / 2}
          cy={r * ink.cell + ink.cell / 2}
          r={ink.cell * 0.5}
          fill={`hsl(${210 - (t / max) * 170} 70% ${25 + (t / max) * 50}%)`}
        />
      ))}
    </svg>
  )
}

function Bake() {
  const [opts, setOpts] = useState(DEFAULTS)
  const [ink, setInk] = useState<BakedInk | null>(null)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    let alive = true
    document.fonts.load(`${opts.size}px ${opts.font}`, opts.text).then(() => {
      if (alive) setInk(traceDotInk(opts.text, opts.font, opts.size, opts.cell, opts.weight, opts.slant))
    })
    return () => {
      alive = false
    }
  }, [opts])

  const same = ink && JSON.stringify(ink) === JSON.stringify(current)
  const download = () => {
    if (!ink) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(ink) + '\n'], { type: 'application/json' }))
    a.download = OUTPUT.split('/').pop()!
    a.click()
  }

  const num = (k: keyof typeof DEFAULTS, step: number) => (
    <label className="flex flex-col text-xs">
      <span className="eyebrow text-[9px] text-archive">{k}</span>
      <input
        type="number"
        step={step}
        value={opts[k] as number}
        onChange={(e) => setOpts({ ...opts, [k]: Number(e.target.value) })}
        className="w-20 rounded border border-neutral-300 px-2 py-1"
      />
    </label>
  )

  return (
    <div className="graph-paper min-h-screen p-8 font-body text-ink">
      <h1 className="font-heading text-3xl">Bake DotInk</h1>
      <p className="mt-1 max-w-xl text-sm text-neutral-700">
        Traces the word in this browser and saves the dots and their timing as data, so every device draws the same
        thing. Check the pen order below, then download and replace <code className="font-mono">{OUTPUT}</code>.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs">
          <span className="eyebrow text-[9px] text-archive">text</span>
          <input
            value={opts.text}
            onChange={(e) => setOpts({ ...opts, text: e.target.value })}
            className="w-40 rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        {num('size', 1)}
        {num('cell', 1)}
        {num('weight', 0.1)}
        {num('slant', 0.01)}
        <button onClick={() => setReplay((n) => n + 1)} className="rounded border border-ink/70 bg-white px-3 py-1.5 text-sm">
          Replay
        </button>
        <button onClick={download} disabled={!ink} className="cut-corners bg-blueprint px-4 py-1.5 text-sm text-white">
          Download JSON
        </button>
      </div>

      {ink && (
        <div className="mt-8 space-y-8">
          <section>
            <div className="eyebrow mb-2 text-[9px] text-archive">Animated</div>
            <DotInk key={replay} baked={ink} color="#0f4467" tints={['#526f9e', '#537fa5', '#17191f', '#155b84']} animate />
          </section>
          <section>
            <div className="eyebrow mb-2 text-[9px] text-archive">Pen order: dark blue first → pale green last</div>
            <TimeView ink={ink} />
          </section>
          <p className="text-sm text-neutral-700">
            {ink.dots.length / 3} dots ·{' '}
            {same ? 'Matches the shipped file.' : 'Differs from the shipped file (download to update it).'}
          </p>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bake />
  </StrictMode>,
)
