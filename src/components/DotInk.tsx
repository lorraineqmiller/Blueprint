import { useEffect, useMemo, useRef, useState } from 'react'

// Dotted ink: hand-lettered script snapped to graph-paper gridlines.
//
// The text is drawn once into an offscreen canvas in a monoline script,
// thickened with a stroke, then sampled at every grid intersection. Each
// covered cell becomes one ink dot with a little jitter in size and density,
// so it reads like a nib pressed into graph paper rather than a pixel font.
// Rendered as SVG, so it stays crisp at any size.

interface Dot {
  x: number
  y: number
  r: number
  o: number
  /** Per-dot ink variation: how far to drift toward a tint (0–1), and which. */
  mix: number
  tint: number
  /** When the pen reaches this dot, in ms from the start. */
  t: number
}

/** A traced word: grid size, plus [column, row, ms] for each dot, flattened. */
export interface BakedInk {
  text: string
  cell: number
  cols: number
  rows: number
  dots: number[]
}

interface Layout {
  dots: Dot[]
  cols: number
  rows: number
}

// How long each dot takes to bloom in.
const BLOOM_MS = 160

// Share of dots that ink early, ahead of the pen.
const EARLY_SHARE = 0.08

// Longest a skipped branch waits, in pen steps, after the pen left its fork.
const BRANCH_WAIT = 20

// Branches shorter than this many cells count as retraced strokes.
const SPUR = 24

// 8-neighbourhood, clockwise from north (Zhang–Suen's P2..P9).
const N8: [number, number][] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]

// Zhang–Suen thinning: erode the inked cells down to a 1-cell centreline
// without breaking connectivity. That centreline is the path the pen took.
function thin(ink: Uint8Array, cols: number, rows: number): Uint8Array {
  const sk = ink.slice()
  const at = (c: number, r: number) => (c >= 0 && r >= 0 && c < cols && r < rows ? sk[r * cols + c] : 0)
  for (let changed = true; changed; ) {
    changed = false
    for (const pass of [0, 1]) {
      const kill: number[] = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!sk[r * cols + c]) continue
          const p = N8.map(([dc, dr]) => at(c + dc, r + dr))
          const b = p.reduce((a, v) => a + v, 0)
          let a = 0
          for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++
          const [p2, , p4, , p6, , p8] = p
          const ok = pass === 0 ? !(p2 && p4 && p6) && !(p4 && p6 && p8) : !(p2 && p4 && p8) && !(p2 && p6 && p8)
          if (b >= 2 && b <= 6 && a === 1 && ok) kill.push(r * cols + c)
        }
      }
      for (const i of kill) sk[i] = 0
      if (kill.length) changed = true
    }
  }
  return sk
}

// Order every inked cell by when a hand writing the word would reach it.
//
// Each connected piece of ink is traced along its centreline from the
// leftmost lead-in, always continuing in the straightest direction, so loops
// are drawn round and the pen backtracks at dead ends to carry on to the next
// letter. Big pieces are written left to right; small detached marks (the
// dot on an i, a separate crossbar) come after, like lifting the pen at the
// end of the word. Cells off the centreline take the time of the nearest
// centreline cell, so the full stroke width inks as the pen passes.
function penOrder(ink: Uint8Array, cols: number, rows: number): Float64Array {
  const n = cols * rows
  const order = new Float64Array(n).fill(-1)
  const sk = thin(ink, cols, rows)
  const xy = (i: number) => [i % cols, Math.floor(i / cols)] as const
  const nbrs = (i: number, set: Uint8Array) => {
    const [c, r] = xy(i)
    const out: number[] = []
    for (const [dc, dr] of N8) {
      const cc = c + dc
      const rr = r + dr
      if (cc >= 0 && rr >= 0 && cc < cols && rr < rows && set[rr * cols + cc]) out.push(rr * cols + cc)
    }
    return out
  }

  // Connected pieces of ink.
  const comp = new Int32Array(n).fill(-1)
  const pieces: { cells: number[]; minX: number }[] = []
  for (let i = 0; i < n; i++) {
    if (!ink[i] || comp[i] >= 0) continue
    const id = pieces.length
    const cells = [i]
    comp[i] = id
    for (let k = 0; k < cells.length; k++) {
      for (const j of nbrs(cells[k], ink)) if (comp[j] < 0) ((comp[j] = id), cells.push(j))
    }
    pieces.push({ cells, minX: Math.min(...cells.map((j) => xy(j)[0])) })
  }
  const biggest = Math.max(1, ...pieces.map((p) => p.cells.length))
  const small = (p: { cells: number[] }) => p.cells.length < biggest * 0.12
  pieces.sort((a, b) => Number(small(a)) - Number(small(b)) || a.minX - b.minX)

  let tick = 0
  const seen = new Uint8Array(n)
  for (const piece of pieces) {
    const spine = piece.cells.filter((i) => sk[i])
    if (!spine.length) {
      // Too small to thin (a 2×2 dot): just ink it left to right.
      for (const i of [...piece.cells].sort((a, b) => xy(a)[0] - xy(b)[0])) order[i] = tick++
      tick += 6
      continue
    }
    // Start where the hand would: the leftmost, lowest point of the piece.
    // A loose stroke end there (a lead-in) wins, but only if it really is at
    // the left edge; script capitals and b/l/h are often all loops.
    const leftCol = Math.min(...spine.map((i) => xy(i)[0]))
    const leadIns = spine.filter((i) => xy(i)[0] <= leftCol + 2 && nbrs(i, sk).length === 1)
    const pick = (leadIns.length ? leadIns : spine).reduce((a, b) => {
      const [ac, ar] = xy(a)
      const [bc, br] = xy(b)
      return bc < ac || (bc === ac && br > ar) ? b : a
    })
    // Does `from` lead into a short dead end? (Fewer than SPUR unvisited
    // cells, and it never loops back round to a sibling branch.)
    const isSpur = (from: number, via: number, siblings: number[]) => {
      const reached = new Set([from])
      const todo = [from]
      while (todo.length) {
        for (const j of nbrs(todo.pop()!, sk)) {
          if (j === via || reached.has(j)) continue
          if (seen[j] || siblings.includes(j)) return false
          reached.add(j)
          if (reached.size >= SPUR) return false
          todo.push(j)
        }
      }
      return true
    }
    // Depth-first walk, preferring the least turn. Default heading: steeply
    // up and right, the way a cursive lead-in rises into the first letter.
    const heading = new Map<number, [number, number]>([[pick, [0.4, -1]]])
    const stack = [pick]
    seen[pick] = 1
    order[pick] = tick++
    let last = pick
    while (stack.length) {
      const cur = stack[stack.length - 1]
      const next = nbrs(cur, sk).filter((j) => !seen[j])
      if (!next.length) {
        stack.pop()
        continue
      }
      const [hx, hy] = heading.get(cur)!
      const [cc, cr] = xy(cur)
      let best = next[0]
      let bestScore = -Infinity
      for (const j of next) {
        const [jc, jr] = xy(j)
        const dx = jc - cc
        const dy = jr - cr
        let score = (dx * hx + dy * hy) / (Math.hypot(dx, dy) * Math.hypot(hx, hy))
        if (next.length > 1) {
          // A short branch that dead-ends is a retraced stroke (the peak of
          // an s or r, a t's crossbar): the pen does it in passing, so take
          // it first instead of leaving it for the backtrack at the very end.
          if (isSpur(j, cur, next)) score += 2
          // At a fork, cursive goes into the loop before running on along
          // the baseline: up for ascenders (b, l, h, k), down for
          // descenders (p, g, y). Down wins a tie: a p drops before its bowl.
          if (dy < 0) score += 0.6
          else if (dy > 0) score += 0.75
        }
        if (score > bestScore) ((bestScore = score), (best = j))
      }
      const [bc, br] = xy(best)
      // Smooth the heading so one-cell staircase jogs don't steer the pen.
      heading.set(best, [(bc - cc) * 0.6 + hx * 0.4, (br - cr) * 0.6 + hy * 0.4])
      seen[best] = 1
      // Walking on, each step is one tick after the last. Branching off a
      // fork the pen already passed (after backtracking), the branch waits
      // for the stretch just drawn from that fork, but no more than
      // BRANCH_WAIT steps: a p's bowl still follows its descender, yet a
      // skipped loop is never left until after the rest of the word.
      order[best] = cur === last ? order[cur] + 1 : Math.min(tick, order[cur] + 1 + BRANCH_WAIT)
      tick = Math.max(tick, order[best] + 1)
      last = best
      stack.push(best)
    }
    tick += 6 // pen lift
  }

  // Staircase corners the walk stepped past get picked up on backtrack,
  // much later; pull each one back to just after its earliest neighbour.
  const raw = order.slice()
  for (let i = 0; i < n; i++) {
    if (!sk[i]) continue
    for (const j of nbrs(i, sk)) if (raw[j] >= 0 && raw[j] + 1 < order[i]) order[i] = raw[j] + 1
  }

  // Spread centreline times out across the stroke width (multi-source BFS).
  // (Pieces too small to thin were fully ordered above, so they seed too.)
  const queue: number[] = []
  for (let i = 0; i < n; i++) if (order[i] >= 0) queue.push(i)
  for (let k = 0; k < queue.length; k++) {
    for (const j of nbrs(queue[k], ink)) if (order[j] < 0) ((order[j] = order[queue[k]]), queue.push(j))
  }
  return order
}

// Deterministic per-cell noise so the same word always inks the same way.
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// Render the word in the browser and trace its pen path. This is the only
// part that depends on the browser: font rasterization differs slightly
// between engines, so for fixed words, bake the result once (see bake.html)
// and pass it in as `baked` so every device draws exactly the same thing.
export function traceDotInk(text: string, font: string, size: number, cell: number, weight: number, slant: number): BakedInk {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { text, cell, cols: 0, rows: 0, dots: [] }
  const fontSpec = `${size}px ${font}`
  ctx.font = fontSpec
  const m = ctx.measureText(text)
  const stroke = cell * weight
  const pad = Math.ceil(stroke + cell * 2)
  const ascent = m.actualBoundingBoxAscent || size * 0.8
  const descent = m.actualBoundingBoxDescent || size * 0.3
  const left = m.actualBoundingBoxLeft || 0
  const width = (m.actualBoundingBoxRight || m.width) + left
  const slantPad = Math.abs(slant) * (ascent + descent)
  const cols = Math.ceil((width + pad * 2 + slantPad) / cell)
  const rows = Math.ceil((ascent + descent + pad * 2) / cell)
  canvas.width = cols * cell
  canvas.height = rows * cell

  ctx.font = fontSpec
  ctx.fillStyle = '#000'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = stroke
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  // Optional extra lean, sheared around the baseline.
  const baseline = pad + ascent
  ctx.setTransform(1, 0, -slant, 1, slant * baseline, 0)
  const x = pad + left + (slant < 0 ? slantPad : 0)
  ctx.fillText(text, x, baseline)
  ctx.strokeText(text, x, baseline)

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const half = Math.floor(cell / 2)
  const ink = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ink[r * cols + c] = data[((r * cell + half) * canvas.width + c * cell + half) * 4 + 3] > 110 ? 1 : 0
    }
  }
  const order = penOrder(ink, cols, rows)
  const last = Math.max(1, ...order)
  // Roughly constant pen speed, kept between ~1s and ~2.4s overall.
  const msPerStep = Math.min(2400, Math.max(1000, last * 9)) / last
  const total = last * msPerStep
  // Not too smooth: a few dots jump the queue and land ahead of the pen,
  // like ink spatter, while everything else follows the cursive path.
  const when = (c: number, r: number) => {
    const t = Math.max(0, order[r * cols + c]) * msPerStep
    if (hash(c + 211, r + 97) >= EARLY_SHARE) return t
    return Math.max(0, t - total * (0.03 + hash(r + 13, c + 151) * 0.07))
  }
  const dots: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (ink[r * cols + c]) dots.push(c, r, Math.round(when(c, r)))
    }
  }
  return { text, cell, cols, rows, dots }
}

// Turn grid cells and times into drawable dots. Everything here comes from a
// per-cell hash, so it's identical in every browser.
function inflate(b: BakedInk): Layout {
  const { cell } = b
  const dots: Dot[] = []
  for (let i = 0; i < b.dots.length; i += 3) {
    const c = b.dots[i]
    const r = b.dots[i + 1]
    const n = hash(c, r)
    // Ink pools a little: tiny wander off the intersection, uneven size.
    dots.push({
      x: c * cell + cell / 2 + (hash(c + 91, r) - 0.5) * cell * 0.14,
      y: r * cell + cell / 2 + (hash(c, r + 91) - 0.5) * cell * 0.14,
      r: cell * (0.54 + n * 0.1),
      o: 0.9 + hash(r, c) * 0.1,
      mix: hash(c + 17, r + 29),
      tint: hash(c + 53, r + 7),
      t: b.dots[i + 2],
    })
  }
  return { dots, cols: b.cols, rows: b.rows }
}

export function DotInk({
  text,
  size = 72,
  cell = 6,
  weight = 1.4,
  slant = 0,
  font = 'Sacramento',
  color = 'currentColor',
  tints = [],
  vary = 0.3,
  baked,
  animate = false,
  className = '',
  onWritten,
}: {
  text?: string
  /** Font size used for the underlying letterforms, in px. */
  size?: number
  /** Grid pitch: one dot per cell, in px. */
  cell?: number
  /** Stroke thickening, in cells. ~1–2 gives a full-bodied nib. */
  weight?: number
  /** Extra italic lean (0.2 ≈ 11°). */
  slant?: number
  font?: string
  color?: string
  /** Nearby colours individual dots drift toward, like uneven ink. */
  tints?: string[]
  /** Strongest drift toward a tint, 0–1. */
  vary?: number
  /** A pre-traced word (from bake.html). Skips font loading and tracing,
   *  and draws identically on every device; `text`, `size`, `cell`,
   *  `weight`, `slant` and `font` are then ignored. */
  baked?: BakedInk
  /** Write the word out dot by dot, following the cursive pen path. */
  animate?: boolean
  className?: string
  /** Called once the word has finished writing (right away if not animated). */
  onWritten?: () => void
}) {
  const [traced, setTraced] = useState<Layout | null>(null)
  const prebaked = useMemo(() => (baked ? inflate(baked) : null), [baked])
  const lay = prebaked ?? traced
  if (baked) cell = baked.cell
  const label = baked?.text ?? text ?? ''

  useEffect(() => {
    if (baked || !text) return
    let alive = true
    const fontSpec = `${size}px ${font}`
    const run = () => alive && setTraced(inflate(traceDotInk(text, font, size, cell, weight, slant)))
    // Wait for the webfont so we don't sample the fallback face.
    if (document.fonts?.load) {
      document.fonts.load(fontSpec, text).then(run, run)
    } else {
      run()
    }
    return () => {
      alive = false
    }
  }, [baked, text, font, size, cell, weight, slant])

  // Tell the parent when the last dot has bloomed, so it can sequence
  // what comes next. Reduced motion shows every dot at once.
  const written = useRef(onWritten)
  written.current = onWritten
  useEffect(() => {
    if (!lay) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const end = animate && !reduced ? Math.max(0, ...lay.dots.map((d) => d.t)) + BLOOM_MS : 0
    const id = window.setTimeout(() => written.current?.(), end)
    return () => window.clearTimeout(id)
  }, [lay, animate])

  if (!lay) {
    // Reserve roughly the right footprint so layout doesn't jump.
    return <span aria-label={label} role="img" className={`inline-block ${className}`} style={{ height: size * 1.4 }} />
  }

  const w = lay.cols * cell
  const h = lay.rows * cell
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={`block h-auto max-w-full ${className}`}
    >
      <g fill={color}>
        {lay.dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            opacity={d.o}
            style={{
              fill: tints.length
                ? `color-mix(in oklab, ${color}, ${tints[Math.floor(d.tint * tints.length)]} ${Math.round(d.mix * vary * 100)}%)`
                : undefined,
              ...(animate && {
                // `backwards` only holds the hidden frame during the delay,
                // so a throttled/paused animation can never leave dots hidden.
                // Each dot blooms as the pen passes, in writing order.
                animation: `dot-ink-in ${BLOOM_MS}ms ease-out backwards`,
                animationDelay: `${Math.round(d.t)}ms`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }),
            }}
          />
        ))}
      </g>
    </svg>
  )
}

// The Blueprint mark: one large module and two small, from the logo lockup.
export function BlueprintMark({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={className} fill="none" stroke={color} strokeWidth="2.6" aria-hidden>
      <rect x="2" y="2" width="9" height="9" rx="1" />
      <rect x="2" y="14" width="9" height="8" rx="1" />
      <rect x="15" y="9" width="9" height="9" rx="1" />
    </svg>
  )
}

export function Wordmark({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${light ? 'text-white' : 'text-blueprint'} ${className}`}>
      <BlueprintMark className="h-[0.9em] w-auto" />
      <span className={`font-heading leading-none ${light ? 'text-white' : 'text-ink'}`}>blueprint</span>
    </span>
  )
}
