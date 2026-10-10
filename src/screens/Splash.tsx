import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Shell'
import { PrimaryButton } from '../components/ui'
import { BlueprintMark, DotInk } from '../components/DotInk'

// Matches .graph-paper's major grid (index.css) and the wordmark's dot grid.
const MAJOR = 48
const INK_CELL = 4
const FINE_LINE = 'rgba(21, 91, 132, 0.12)'

interface FineGrid {
  /** Pitch of the wordmark's dot grid as rendered, in px. */
  size: number
  /** The wordmark's top-left corner within the sheet: the grid's origin. */
  originX: number
  originY: number
  /** Horizontal band: the inner big-grid rows behind the wordmark. */
  bandTop: number
  bandHeight: number
  /** Vertical strip: the 2nd–4th big-grid columns from the right. */
  stripLeft: number
}

// The wordmark's tiny grid, laid on the sheet in two strips that cross: a
// horizontal band on the inner big-grid rows behind the wordmark, and a
// full-height strip three big columns wide near the right edge. Both are
// scaled and offset to the rendered wordmark so its dots sit on the lines.
function useFineGrid(root: RefObject<HTMLDivElement>) {
  const [grid, setGrid] = useState<FineGrid | null>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () => {
      const svg = el.querySelector<SVGSVGElement>('svg[role="img"]')
      if (!svg || !svg.viewBox.baseVal.width) return setGrid(null)
      const box = el.getBoundingClientRect()
      const r = svg.getBoundingClientRect()
      const top = r.top - box.top
      // The big-grid rows the wordmark spans, minus the outermost row at each
      // end, so the band hugs the lettering.
      const bandTop = (Math.floor(top / MAJOR) + 1) * MAJOR
      const bandBottom = Math.max(bandTop + MAJOR, (Math.ceil((top + r.height) / MAJOR) - 1) * MAJOR)
      setGrid({
        size: INK_CELL * (r.width / svg.viewBox.baseVal.width),
        originX: r.left - box.left,
        originY: top,
        bandTop,
        bandHeight: bandBottom - bandTop,
        stripLeft: MAJOR * (Math.ceil(box.width / MAJOR) - 4),
      })
    }
    measure()
    // Re-measure on resize, and once the wordmark renders (after its font loads).
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const mo = new MutationObserver(measure)
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [root])
  return grid
}

// One rectangle of fine grid, its lines continuing the wordmark's.
function FineGridPatch({ grid, left, top, width, height }: { grid: FineGrid; left: number; top: number; width: number | string; height: number | string }) {
  const mod = (v: number) => ((v % grid.size) + grid.size) % grid.size
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        width,
        height,
        backgroundImage: `linear-gradient(to right, ${FINE_LINE} 0.5px, transparent 0.5px), linear-gradient(to bottom, ${FINE_LINE} 0.5px, transparent 0.5px)`,
        backgroundSize: `${grid.size}px ${grid.size}px`,
        backgroundPosition: `${mod(grid.originX - left)}px ${mod(grid.originY - top)}px`,
      }}
    />
  )
}

// Drafting dimension line: end ticks, a rule, and a centred mono label.
// Hidden until `show`, then drafts itself in: the label fades up, the rules
// extend outward from it, and the end ticks land last. Delays are relative
// to `show` turning on (Splash flips it when the wordmark finishes), timed
// to start once the buttons below have faded in.
function Dimension({ label, show, className = '' }: { label: string; show: boolean; className?: string }) {
  const at = (cls: string) => (show ? cls : 'invisible')
  return (
    <div aria-hidden className={`flex items-center gap-1.5 text-ink/70 ${className}`}>
      <span className={`h-2.5 w-px bg-current ${at('fade-in [animation-delay:3500ms] [animation-duration:200ms]')}`} />
      <span className={`h-px flex-1 origin-right bg-current ${at('extend-x [animation-delay:2950ms]')}`} />
      <span className={`eyebrow whitespace-nowrap text-[8px] ${at('fade-in [animation-delay:2800ms] [animation-duration:300ms]')}`}>{label}</span>
      <span className={`h-px flex-1 origin-left bg-current ${at('extend-x [animation-delay:2950ms]')}`} />
      <span className={`h-2.5 w-px bg-current ${at('fade-in [animation-delay:3500ms] [animation-duration:200ms]')}`} />
    </div>
  )
}

// Vertical scale bar, alternating filled and open blocks.
function ScaleBar({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex flex-col border border-archive/70">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-3 w-1.5 ${i % 2 ? 'bg-paper' : 'bg-archive/70'}`} />
        ))}
      </div>
      <span className="eyebrow text-[7px] text-archive [writing-mode:vertical-rl]">Scale bar</span>
    </div>
  )
}

export default function Splash() {
  const nav = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const grid = useFineGrid(root)
  // The copy waits until the wordmark has finished writing itself.
  const [written, setWritten] = useState(false)
  return (
    <Screen withNav={false} withStatusBar={false} scroll={false}>
      <div ref={root} className="graph-paper relative flex h-full flex-col overflow-hidden px-7 pb-10 pt-14">
        {grid && (
          <>
            <FineGridPatch grid={grid} left={0} top={grid.bandTop} width="100%" height={grid.bandHeight} />
            {/* The strip stops at the band, so the lines don't double up where they cross. */}
            <FineGridPatch grid={grid} left={grid.stripLeft} top={0} width={MAJOR * 3} height={grid.bandTop} />
            <FineGridPatch
              grid={grid}
              left={grid.stripLeft}
              top={grid.bandTop + grid.bandHeight}
              width={MAJOR * 3}
              height={`calc(100% - ${grid.bandTop + grid.bandHeight}px)`}
            />
          </>
        )}

        {/* Pattern-cutting construction lines */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
          <g stroke="rgba(21,91,132,0.18)" strokeWidth="0.15" fill="none">
            <path d="M-10 70 L30 30 L70 70" />
            <path d="M60 -5 L100 35" />
          </g>
        </svg>


        {/* Wordmark, dimensioned like a drafting sheet. */}
        <div className="relative mt-20 -ml-2 inline-block max-w-full self-start">
          <Dimension label="1.0.0-alpha" show={written} className="absolute inset-x-2 -top-6" />
          <DotInk text="blueprint" size={120} cell={INK_CELL} weight={1.0} slant={0.06} color="#0f4467" tints={['#526f9e', '#537fa5', '#17191f', '#155b84']} animate onWritten={() => setWritten(true)} />
        </div>


        {/* Copy arrives once the wordmark has finished writing itself. */}
        <h1 className={`${written ? 'slide-in-left [animation-delay:500ms]' : 'invisible'} relative mt-auto font-heading text-[44px] leading-[1.02] text-ink`}>
          you have more to wear than you think
          <span className="font-script text-[58px] leading-[0.6] text-blueprint"> </span>
        </h1>
        <p className={`${written ? 'slide-in-left [animation-delay:1300ms]' : 'invisible'} relative mt-4 max-w-[300px] text-[15px] text-neutral-700`}>
          build and borrow to avoid buying.
        </p>

        <div className={`${written ? 'fade-in [animation-delay:2200ms]' : 'invisible'} relative mt-8 space-y-2`}>
          <PrimaryButton onClick={() => nav('/join')}>Get started</PrimaryButton>
          <button onClick={() => nav('/login')} className="min-h-[44px] w-full text-sm font-medium text-denim">
            I already have an account
          </button>
        </div>
      </div>
    </Screen>
  )
}
