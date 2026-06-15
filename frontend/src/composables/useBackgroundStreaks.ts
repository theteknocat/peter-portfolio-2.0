/**
 * Animates slow glowing streaks that travel along outer diamond edge paths in the
 * background lattice. Each streak is a multi-segment path that follows real lattice
 * edges and may change diagonal family at each vertex — so it bends like a natural
 * bolt tracing the Art Deco grid.
 *
 * When a streak turns at a vertex it may spawn a fork: a dimmer, shorter child streak
 * that continues in the original direction, creating a lightning-branch effect.
 *
 * A single requestAnimationFrame loop per streak drives stroke-dashoffset (pulse
 * travel) and translates the <g> to stay locked to the moving background.
 *
 * @param svgRef - Ref to the transparent overlay <svg> that covers the viewport.
 */
import { onMounted, onUnmounted, type Ref } from 'vue'

// Must match the bg-scroll keyframe values in main.css
const BG_TOTAL_X = -623
const BG_TOTAL_Y = -632
const BG_DURATION_MS = 35000

// Must match the SVG tile geometry in body-bg-tile.svg
const TILE_W = 89
const TILE_H = 158

// Half-edge step (top-of-diamond → right vertex). All 4 directions have this length.
const EDGE_LEN = Math.hypot(44.5, 79)  // ≈ 90.67 px

const STREAK_PX = 500          // glow section length in px along the path
const STREAK_COUNT = 2         // number of independent streak loops running concurrently
const MIN_INTERVAL_MS = 1400
const MAX_INTERVAL_MS = 4500
const STREAK_SPEED_MIN = 280   // px/s — slow, drifting glow
const STREAK_SPEED_MAX = 550   // px/s
const TURN_PROB = 0.3          // probability of switching diagonal family at each vertex
const MAX_STEPS = 30           // max edge segments before stopping path generation

// Fork: when the main streak turns, it may spawn a dimmer child that continues straight.
const FORK_PROB = 1.0          // always fork at each turn point
const FORK_OPACITY_SCALE = 1.0 // fork brightness relative to parent
const FORK_MAX_STEPS = 10      // fork paths are shorter than the main streak

// Stacked strokes simulate Gaussian glow without CSS filter: blur().
// Segments ordered longest (tail, dimmest) → shortest (tip, brightest). All share
// the same leading edge; opacities accumulate additively toward the tip, producing
// a smooth brightness ramp. CORE_WIDTH applies to every segment's thin centre line.
const CORE_WIDTH = 1
const SEGMENTS = [
  { len: 500, haze: [{ w: 20, o: 0.008 }, { w: 10, o: 0.014 }, { w: 5, o: 0.018 }], core: 0.035 },
  { len: 375, haze: [{ w: 20, o: 0.005 }, { w: 10, o: 0.007 }, { w: 5, o: 0.010 }], core: 0.012 },
  { len: 250, haze: [{ w: 20, o: 0.006 }, { w: 10, o: 0.009 }, { w: 5, o: 0.013 }], core: 0.016 },
  { len: 140, haze: [{ w: 20, o: 0.006 }, { w: 10, o: 0.010 }, { w: 5, o: 0.016 }], core: 0.026 },
  { len:  60, haze: [{ w: 20, o: 0.008 }, { w: 10, o: 0.014 }, { w: 5, o: 0.022 }], core: 0.038 },
]

// Streak colours: white plus pale tints of the site's accent palette.
// Non-white values are desaturated/lightened so they read as colour tints
// at the very low stroke opacities used throughout.
const STREAK_COLORS = [
  'white',
  '#a0ffd0',  // pale green
  '#fff0a0',  // pale yellow
  '#ddb8ff',  // pale purple
]

// The four edge directions in the Art Deco diamond lattice.
// Turn rule: flip the x-component (index ^ 1 for pairs 0/1 and 2/3).
//   right-down ↔ left-down (indices 0,1) — both heading downward
//   right-up   ↔ left-up   (indices 2,3) — both heading upward
const DIRS: [number, number][] = [
  [+44.5, +79],   // 0: right-down
  [-44.5, +79],   // 1: left-down
  [+44.5, -79],   // 2: right-up
  [-44.5, -79],   // 3: left-up
]

// Turn: flip x, keep y direction. Excludes U-turns (y-flip) for performance.
const TURN_PARTNER = [1, 0, 3, 2]

interface ForkPoint {
  cx: number
  cy: number
  dirIdx: number   // direction the main streak was traveling before it turned
  stepIndex: number
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

export function useBackgroundStreaks(svgRef: Ref<SVGSVGElement | null>): void {
  const timers: ReturnType<typeof setTimeout>[] = []
  const activeStreaks = new Set<{ active: boolean }>()
  let mountTime = 0

  function after(ms: number, fn: () => void): void {
    timers.push(setTimeout(fn, ms))
  }

  /**
   * Background position at the given elapsed-since-mount time.
   * Wraps every BG_DURATION_MS to match the CSS animation loop.
   */
  function bgOffset(elapsedMs: number): { x: number; y: number } {
    const progress = (elapsedMs % BG_DURATION_MS) / BG_DURATION_MS
    return { x: BG_TOTAL_X * progress, y: BG_TOTAL_Y * progress }
  }

  /**
   * Drift of the background since a reference time.
   * Linear (non-modular) — safe for short streak durations.
   */
  function bgDelta(msSinceRef: number): { x: number; y: number } {
    const progress = msSinceRef / BG_DURATION_MS
    return { x: BG_TOTAL_X * progress, y: BG_TOTAL_Y * progress }
  }

  /**
   * Builds a path along the lattice, renders it as an animated glow pulse,
   * and schedules any fork children.
   *
   * @param svg - The overlay SVG element to append to.
   * @param startCx - Starting x in SVG coordinate space (current-offset-adjusted).
   * @param startCy - Starting y in SVG coordinate space (current-offset-adjusted).
   * @param startDirIdx - Initial direction index into DIRS.
   * @param color - Stroke colour shared with any forks.
   * @param opacityScale - Multiplier applied to all segment opacities (< 1 for forks).
   * @param maxSteps - Maximum lattice edges to walk.
   * @param canFork - Whether to spawn fork children at turn points.
   */
  function buildAndAnimate(
    svg: SVGSVGElement,
    startCx: number,
    startCy: number,
    startDirIdx: number,
    color: string,
    opacityScale: number,
    maxSteps: number,
    canFork: boolean,
  ): void {
    const vw = window.innerWidth
    const vh = window.innerHeight

    let cx = startCx
    let cy = startCy
    let dirIdx = startDirIdx
    const points: [number, number][] = [[cx, cy]]
    const forkPoints: ForkPoint[] = []

    for (let i = 0; i < maxSteps; i++) {
      const [dx, dy] = DIRS[dirIdx]
      cx += dx
      cy += dy
      points.push([cx, cy])

      if (Math.random() < TURN_PROB) {
        // Record the pre-turn direction as a potential fork before changing course.
        if (canFork && Math.random() < FORK_PROB) {
          forkPoints.push({ cx, cy, dirIdx, stepIndex: i + 1 })
        }
        dirIdx = TURN_PARTNER[dirIdx]
      }

      const margin = STREAK_PX + EDGE_LEN * 2
      if (cx < -margin || cx > vw + margin || cy < -margin || cy > vh + margin) break
    }

    if (points.length < 2) return

    const pathLen = (points.length - 1) * EDGE_LEN
    const pathStr = points.map(([x, y], i) =>
      `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    ).join(' ')

    const svgNS = 'http://www.w3.org/2000/svg'

    // dashoffset starts at STREAK_PX so the pulse begins just before p=0 (invisible).
    // As it decreases toward -(pathLen + STREAK_PX), the pulse travels the full path.
    function makePath(width: number, opacity: number, dashLen: number, isCore = false): SVGPathElement {
      const p = document.createElementNS(svgNS, 'path')
      p.setAttribute('d', pathStr)
      p.setAttribute('fill', 'none')
      p.setAttribute('stroke', color)
      p.setAttribute('stroke-opacity', String(opacity * opacityScale))
      p.setAttribute('stroke-width', String(width))
      p.setAttribute('stroke-linecap', 'round')
      // Haze layers use bevel joins — round joins create asymmetric bumps on the
      // outside of every turn, which stack visibly on wide low-opacity strokes.
      p.setAttribute('stroke-linejoin', isCore ? 'round' : 'bevel')
      p.setAttribute('stroke-dasharray', `${dashLen} 99999`)
      p.setAttribute('stroke-dashoffset', String(STREAK_PX))
      return p
    }

    const g = document.createElementNS(svgNS, 'g')
    // Each segment: haze layers (wide→narrow) then core. All share the same leading
    // edge; shorter segments stack opacity additively toward the tip.
    const segPaths: SVGPathElement[][] = SEGMENTS.map(seg => [
      ...seg.haze.map(({ w, o }) => makePath(w, o, seg.len)),
      makePath(CORE_WIDTH, seg.core, seg.len, true),
    ])
    segPaths.forEach(paths => paths.forEach(p => g.appendChild(p)))
    svg.appendChild(g)

    const creationTime = performance.now()
    const speed = rand(STREAK_SPEED_MIN, STREAK_SPEED_MAX)
    const duration = Math.round((pathLen + STREAK_PX * 2) / speed * 1000)
    const offsetStart = STREAK_PX
    const offsetEnd = -(pathLen + STREAK_PX)

    const state = { active: true }
    activeStreaks.add(state)

    // Schedule each fork to fire when the pulse reaches that vertex.
    // tForkMs is when the pulse leading edge arrives at the fork vertex.
    // The fork's start position is corrected for how much the background has
    // drifted between this streak's creation time and when the fork fires.
    // Fire when the bright tip's leading edge reaches the vertex — not when the
    // full 500px haze tail clears it (which is STREAK_PX worth of extra travel later).
    const tipLen = SEGMENTS[SEGMENTS.length - 1].len
    forkPoints.forEach(fork => {
      const tForkMs = Math.round((tipLen + fork.stepIndex * EDGE_LEN) / speed * 1000)
      after(tForkMs, () => {
        if (!state.active) return
        const drift = bgDelta(tForkMs)
        buildAndAnimate(
          svg,
          fork.cx + drift.x,
          fork.cy + drift.y,
          fork.dirIdx,
          color,
          opacityScale * FORK_OPACITY_SCALE,
          FORK_MAX_STEPS,
          false,
        )
      })
    })

    function tick(): void {
      if (!state.active) return
      const elapsed = performance.now() - creationTime

      // Sync <g> transform with background drift since creation
      const delta = bgDelta(elapsed)
      g.setAttribute('transform', `translate(${delta.x.toFixed(2)},${delta.y.toFixed(2)})`)

      if (elapsed >= duration) {
        state.active = false
        activeStreaks.delete(state)
        timers.push(setTimeout(() => g.remove(), 50))
        return
      }

      const t = elapsed / duration
      const rawOffset = offsetStart + t * (offsetEnd - offsetStart)
      // Each segment's dash is shifted so all leading edges stay aligned.
      // Segment 0 (longest) uses rawOffset directly; shorter segments shift forward.
      segPaths.forEach((paths, i) => {
        const segOff = (rawOffset - (STREAK_PX - SEGMENTS[i].len)).toFixed(2)
        paths.forEach(p => p.setAttribute('stroke-dashoffset', segOff))
      })

      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function createStreak(svg: SVGSVGElement): void {
    const offset = bgOffset(performance.now() - mountTime)
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Pick a random lattice vertex within (or just outside) the viewport
    const colMin = Math.floor((-TILE_W - offset.x) / TILE_W)
    const colMax = Math.ceil((vw + TILE_W - offset.x) / TILE_W)
    const rowMin = Math.floor((-TILE_H - offset.y) / TILE_H)
    const rowMax = Math.ceil((vh + TILE_H - offset.y) / TILE_H)

    // Pick direction first so the starting row can be constrained by it.
    let dirIdx = randInt(0, DIRS.length - 1)
    const [, initDy] = DIRS[dirIdx]

    // Exclude starting rows within STREAK_PX of the edge we're heading toward —
    // streaks need that much room to travel before they exit the viewport.
    let safeRowMin = rowMin
    let safeRowMax = rowMax
    if (initDy < 0) {
      safeRowMin = Math.max(rowMin, Math.ceil((STREAK_PX - offset.y) / TILE_H))
    } else if (initDy > 0) {
      safeRowMax = Math.min(rowMax, Math.floor((vh - STREAK_PX - offset.y) / TILE_H))
    }
    if (safeRowMin > safeRowMax) { safeRowMin = rowMin; safeRowMax = rowMax }

    const startCx = offset.x + randInt(colMin, colMax) * TILE_W + 44.5
    const startCy = offset.y + randInt(safeRowMin, safeRowMax) * TILE_H
    const color = STREAK_COLORS[Math.floor(Math.random() * STREAK_COLORS.length)]

    buildAndAnimate(svg, startCx, startCy, dirIdx, color, 1.0, MAX_STEPS, true)
  }

  function startStreakLoop(): void {
    function loop(): void {
      const svg = svgRef.value
      if (svg) createStreak(svg)
      after(randInt(MIN_INTERVAL_MS, MAX_INTERVAL_MS), loop)
    }
    after(randInt(0, MAX_INTERVAL_MS), loop)
  }

  onMounted(() => {
    mountTime = performance.now()
    for (let i = 0; i < STREAK_COUNT; i++) {
      startStreakLoop()
    }
  })

  onUnmounted(() => {
    timers.forEach(clearTimeout)
    timers.length = 0
    activeStreaks.forEach(s => { s.active = false })
    activeStreaks.clear()
    svgRef.value?.querySelectorAll('g').forEach(g => g.remove())
  })
}
