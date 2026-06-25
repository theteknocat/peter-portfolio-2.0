/**
 * Drives the scrolling background glitch spots.
 *
 * Glitches fire in clusters: 2–3 spots trigger in quick succession, then a
 * long pause before the next cluster. Each spot runs a single glitch cycle:
 *   1. CSS transition scales the spot from 0 → 1 (smooth spread from a point)
 *   2. JS steps rapid filter changes on .bg-spot-inner (brightness/contrast flicker)
 *   3. Spot fades to opacity 0, then collapses and repositions (invisibly)
 *
 * The radial mask-image on .bg-spot fades edges to transparent, so the
 * background shows through at the edges — no dark vignette.
 *
 * @param containerRef - Ref to the element containing .bg-spot wrappers.
 */
import { onMounted, onUnmounted, type Ref } from 'vue'

const FRAME_MS = 55
const SPREAD_MS = 450          // must match CSS transition duration on .bg-spot

const CLUSTER_WAVES_MIN = 4           // number of waves per cluster
const CLUSTER_WAVES_MAX = 6
const CLUSTER_WAVE_INTERVAL_MIN = 500 // ms between waves within a cluster
const CLUSTER_WAVE_INTERVAL_MAX = 1000
const CLUSTER_SPOTS_PER_WAVE_MIN = 1  // spots fired per wave
const CLUSTER_SPOTS_PER_WAVE_MAX = 2
const CLUSTER_DELAY_MIN = 7000        // ms quiet gap between clusters
const CLUSTER_DELAY_MAX = 14000
const CLUSTER_INITIAL_DELAY = 2000    // ms before the first cluster fires

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

// Controls how much of the turbulence cloud is visible.
// alpha = CLOUD_SHARPNESS × (turbulence alpha) + CLOUD_THRESHOLD
// Raising CLOUD_SHARPNESS → harder edges. Lowering CLOUD_THRESHOLD → more holes.
const CLOUD_SHARPNESS = 5
const CLOUD_THRESHOLD = -2

function randomTurbulenceMask(): string {
  const seed = randInt(0, 9999)
  const freq = rand(0.008, 0.025).toFixed(3)

  // Radial gradient fades the turbulence rect's hard edges to transparent.
  // All IDs are self-contained within the data URI so they resolve correctly.
  const radialGradient = `
    <radialGradient id='g' cx='50%' cy='50%' r='50%'>
      <stop offset='0%'   stop-color='white' stop-opacity='1'/>
      <stop offset='100%' stop-color='white' stop-opacity='0'/>
    </radialGradient>`

  // Mask applies the radial gradient so edges fade out
  const edgeMask = `
    <mask id='m'>
      <rect width='100' height='100' fill='url(#g)'/>
    </mask>`

  // feTurbulence generates the cloud shape; feColorMatrix thresholds it to an alpha mask
  const cloudFilter = `
    <filter id='f' x='0%' y='0%' width='100%' height='100%'>
      <feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' seed='${seed}'/>
      <feColorMatrix type='matrix' values='
        0 0 0 0 0
        0 0 0 0 0
        0 0 0 0 0
        ${CLOUD_SHARPNESS} 0 0 0 ${CLOUD_THRESHOLD}'/>
    </filter>`

  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
      <defs>
        ${radialGradient}
        ${edgeMask}
        ${cloudFilter}
      </defs>
      <rect width='100' height='100' filter='url(#f)' mask='url(#m)'/>
    </svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function randomGlitchFilter(): string {
  // contrast() and saturate() can push dark pixels darker — avoid them.
  // brightness >= 1.0 is the only safe way to guarantee no darkening.
  const b = rand(1.0, 3.5).toFixed(2)
  const parts = [`brightness(${b})`]
  if (Math.random() > 0.4) parts.push(`hue-rotate(${randInt(-70, 70)}deg)`)
  if (Math.random() > 0.6) parts.push(`saturate(${rand(0.5, 6.0).toFixed(2)})`)
  return parts.join(' ')
}

export function useBackgroundGlitch(containerRef: Ref<HTMLElement | null>): void {
  const timers: ReturnType<typeof setTimeout>[] = []

  function after(ms: number, fn: () => void): void {
    timers.push(setTimeout(fn, ms))
  }

  function repositionSpot(spot: HTMLElement): void {
    const w = randInt(400, 800)
    spot.style.setProperty('--spot-w', `${w}px`)
    // Height constrained to 4:3 max (h ≤ w×0.75), wider aspects allowed
    spot.style.setProperty('--spot-h', `${randInt(Math.floor(w * 0.35), Math.floor(w * 0.75))}px`)
    spot.style.setProperty('--spot-top', `${rand(5, 85).toFixed(1)}vh`)
    spot.style.setProperty('--spot-left', `${rand(5, 85).toFixed(1)}vw`)
    const mask = randomTurbulenceMask()
    spot.style.setProperty('mask-image', mask)
    spot.style.setProperty('-webkit-mask-image', mask)
  }

  function runFilterFrames(
    inner: HTMLElement,
    remaining: number,
    onDone: () => void,
  ): void {
    if (remaining <= 0) {
      inner.style.filter = ''
      onDone()
      return
    }
    inner.style.filter = randomGlitchFilter()
    after(FRAME_MS, () => runFilterFrames(inner, remaining - 1, onDone))
  }

  /**
   * Runs a single glitch cycle on a spot, then calls onDone when fully collapsed
   * and repositioned. The spot must already be at scale(0) / opacity 1 on entry.
   */
  function runSpotOnce(spot: HTMLElement, onDone: () => void): void {
    const inner = spot.querySelector<HTMLElement>('.bg-spot-inner')
    if (!inner) { onDone(); return }

    // Spread from a point — CSS transition handles the smooth grow
    spot.style.transform = 'scale(1)'

    // Start filter glitching after spread is underway
    after(SPREAD_MS * 0.3, () => {
      runFilterFrames(inner, randInt(6, 18), () => {
        // Fade to transparent via opacity (avoids the brightness-1.0 blot that
        // appears when the inner's texture is slightly out of sync with bg-layer)
        spot.style.opacity = '0'

        // After fade, collapse and reposition while invisible
        after(420, () => {
          spot.style.transform = 'scale(0)'
          spot.style.opacity = '1'
          repositionSpot(spot)
          onDone()
        })
      })
    })
  }

  function startClusterLoop(spots: HTMLElement[]): void {
    const isActive = new Map<HTMLElement, boolean>(spots.map(s => [s, false]))

    function fireWave(): void {
      const available = spots.filter(s => !isActive.get(s))
      const count = Math.min(
        randInt(CLUSTER_SPOTS_PER_WAVE_MIN, CLUSTER_SPOTS_PER_WAVE_MAX),
        available.length,
      )
      available.sort(() => Math.random() - 0.5).slice(0, count).forEach(spot => {
        isActive.set(spot, true)
        runSpotOnce(spot, () => isActive.set(spot, false))
      })
    }

    function loop(): void {
      // Schedule each wave with a cumulative offset so they spread across 2–6s
      const waves = randInt(CLUSTER_WAVES_MIN, CLUSTER_WAVES_MAX)
      let offset = 0
      for (let i = 0; i < waves; i++) {
        after(offset, fireWave)
        offset += rand(CLUSTER_WAVE_INTERVAL_MIN, CLUSTER_WAVE_INTERVAL_MAX)
      }

      // Next cluster fires after the last wave completes + quiet gap
      after(offset + rand(CLUSTER_DELAY_MIN, CLUSTER_DELAY_MAX), loop)
    }

    after(CLUSTER_INITIAL_DELAY, loop)
  }

  onMounted(() => {
    // Honour reduced-motion: this timer-driven glitch can't be stopped by CSS, so skip it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const spots = Array.from(
      containerRef.value?.querySelectorAll<HTMLElement>('.bg-spot') ?? []
    )
    spots.forEach(repositionSpot)
    startClusterLoop(spots)
  })

  onUnmounted(() => {
    timers.forEach(clearTimeout)
    timers.length = 0
  })
}
