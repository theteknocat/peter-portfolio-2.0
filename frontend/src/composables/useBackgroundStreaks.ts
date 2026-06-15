/**
 * Animates slow glowing streaks that travel along outer diamond edge paths in the
 * background lattice. Each streak is a multi-segment path that follows real lattice
 * edges and may change diagonal family at each vertex — so it bends like a natural
 * bolt tracing the Art Deco grid.
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

// Glow layers: outer diffuse halo + thin bright core, each split into a dim
// full-length tail and a bright short leading section. Both sets share the same
// path; only dashoffset and dasharray differ to position each segment.
const GLOW_WIDTH = 8           // px — outer halo stroke width
const GLOW_OPACITY = 0.05      // tail haze — very dim
const GLOW_BLUR = '10px'        // CSS blur for the outer halo
const CORE_WIDTH = 1           // px — thin centre line
const CORE_OPACITY = 0.12      // tail core — dim

// Leading bright tip — a shorter dash positioned at the front of the trail
const LEAD_FRAC = 0.2          // fraction of STREAK_PX for the bright tip
const LEAD_GLOW_OPACITY = 0.12 // additive: tip haze total = GLOW_OPACITY + LEAD_GLOW_OPACITY
const LEAD_CORE_OPACITY = 0.28 // additive: tip core total = CORE_OPACITY + LEAD_CORE_OPACITY

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

  function createStreak(svg: SVGSVGElement): void {
    const offset = bgOffset(performance.now() - mountTime)
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Pick a random lattice vertex within (or just outside) the viewport
    const colMin = Math.floor((-TILE_W - offset.x) / TILE_W)
    const colMax = Math.ceil((vw + TILE_W - offset.x) / TILE_W)
    const rowMin = Math.floor((-TILE_H - offset.y) / TILE_H)
    const rowMax = Math.ceil((vh + TILE_H - offset.y) / TILE_H)

    let cx = offset.x + randInt(colMin, colMax) * TILE_W + 44.5
    let cy = offset.y + randInt(rowMin, rowMax) * TILE_H

    // Walk the lattice: at each vertex, continue straight or turn to partner family
    let dirIdx = randInt(0, DIRS.length - 1)
    const points: [number, number][] = [[cx, cy]]

    for (let i = 0; i < MAX_STEPS; i++) {
      const [dx, dy] = DIRS[dirIdx]
      cx += dx
      cy += dy
      points.push([cx, cy])

      if (Math.random() < TURN_PROB) {
        dirIdx = TURN_PARTNER[dirIdx]
      }

      // Stop early if we've travelled well past all four edges of the viewport
      const margin = STREAK_PX + EDGE_LEN * 2
      if (cx < -margin || cx > vw + margin || cy < -margin || cy > vh + margin) break
    }

    if (points.length < 2) return

    const pathLen = (points.length - 1) * EDGE_LEN
    const pathStr = points.map(([x, y], i) =>
      `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    ).join(' ')

    const svgNS = 'http://www.w3.org/2000/svg'
    const LEAD_LEN = Math.round(STREAK_PX * LEAD_FRAC)

    // dashoffset starts at STREAK_PX so the pulse begins just before p=0 (invisible).
    // As it decreases toward -(pathLen + STREAK_PX), the pulse travels the full path.
    function makePath(width: number, opacity: number, dashLen: number): SVGPathElement {
      const p = document.createElementNS(svgNS, 'path')
      p.setAttribute('d', pathStr)
      p.setAttribute('fill', 'none')
      p.setAttribute('stroke', 'white')
      p.setAttribute('stroke-opacity', String(opacity))
      p.setAttribute('stroke-width', String(width))
      p.setAttribute('stroke-linecap', 'round')
      p.setAttribute('stroke-linejoin', 'round')
      p.setAttribute('stroke-dasharray', `${dashLen} 99999`)
      p.setAttribute('stroke-dashoffset', String(STREAK_PX))
      return p
    }

    const g = document.createElementNS(svgNS, 'g')
    // Tail layers — full STREAK_PX length, dim: visible along the entire trail
    const glow = makePath(GLOW_WIDTH, GLOW_OPACITY, STREAK_PX)
    glow.style.filter = `blur(${GLOW_BLUR})`
    const core = makePath(CORE_WIDTH, CORE_OPACITY, STREAK_PX)
    // Leading tip layers — shorter dash at the front, brighter additive layer
    const leadGlow = makePath(GLOW_WIDTH, LEAD_GLOW_OPACITY, LEAD_LEN)
    leadGlow.style.filter = `blur(${GLOW_BLUR})`
    const leadCore = makePath(CORE_WIDTH, LEAD_CORE_OPACITY, LEAD_LEN)
    g.appendChild(glow)
    g.appendChild(core)
    g.appendChild(leadGlow)
    g.appendChild(leadCore)
    svg.appendChild(g)

    const creationTime = performance.now()
    const speed = rand(STREAK_SPEED_MIN, STREAK_SPEED_MAX)
    const duration = Math.round((pathLen + STREAK_PX * 2) / speed * 1000)
    const offsetStart = STREAK_PX
    const offsetEnd = -(pathLen + STREAK_PX)

    const state = { active: true }
    activeStreaks.add(state)

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
      const currentOffset = rawOffset.toFixed(2)
      // Lead tip offset: shift forward so its dash aligns with the leading edge
      const leadOffset = (rawOffset - (STREAK_PX - LEAD_LEN)).toFixed(2)
      glow.setAttribute('stroke-dashoffset', currentOffset)
      core.setAttribute('stroke-dashoffset', currentOffset)
      leadGlow.setAttribute('stroke-dashoffset', leadOffset)
      leadCore.setAttribute('stroke-dashoffset', leadOffset)

      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
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
