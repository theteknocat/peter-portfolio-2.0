/**
 * Drives the scrolling background glitch spots.
 *
 * Each .bg-spot runs its own independent loop:
 *   1. CSS transition scales the spot from 0 → 1 (smooth spread from a point)
 *   2. JS steps rapid filter changes on .bg-spot-inner (brightness/contrast flicker)
 *   3. CSS transition scales back to 0
 *   4. Spot is repositioned (invisibly, while scaled to zero) before next burst
 *
 * The radial mask-image on .bg-spot fades edges to transparent, so the
 * background shows through at the edges — no dark vignette.
 *
 * @param containerRef - Ref to the element containing .bg-spot wrappers.
 */
import { onMounted, onUnmounted, type Ref } from 'vue'

const FRAME_MS = 55
const SPREAD_MS = 450  // must match CSS transition duration on .bg-spot
const MIN_DELAY_MS = 600
const MAX_DELAY_MS = 3200

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function randomTurbulenceMask(): string {
  const seed = randInt(0, 9999)
  const freq = rand(0.008, 0.025).toFixed(3)
  // SVG <mask> with a radial gradient fades the turbulence rect's hard edges to
  // transparent — all references are self-contained within the data URI so they resolve.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><defs><radialGradient id='g' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='white' stop-opacity='1'/><stop offset='100%' stop-color='white' stop-opacity='0'/></radialGradient><mask id='m'><rect width='100' height='100' fill='url(#g)'/></mask><filter id='f' x='0%' y='0%' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' seed='${seed}'/><feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 0 0 0 -1.5'/></filter></defs><rect width='100' height='100' filter='url(#f)' mask='url(#m)'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function randomGlitchFilter(): string {
  // contrast() and saturate() can push dark pixels darker — avoid them.
  // brightness >= 1.0 is the only safe way to guarantee no darkening.
  const b = rand(1.0, 4.5).toFixed(2)
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
    const w = randInt(200, 480)
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

  function startSpotLoop(spot: HTMLElement): void {
    function loop(): void {
      const inner = spot.querySelector<HTMLElement>('.bg-spot-inner')
      if (!inner) return

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
            after(rand(MIN_DELAY_MS, MAX_DELAY_MS), loop)
          })
        })
      })
    }

    // Stagger initial starts across the full delay range
    after(rand(0, MAX_DELAY_MS), loop)
  }

  onMounted(() => {
    const spots = Array.from(
      containerRef.value?.querySelectorAll<HTMLElement>('.bg-spot') ?? []
    )
    spots.forEach(spot => {
      repositionSpot(spot)
      startSpotLoop(spot)
    })
  })

  onUnmounted(() => {
    timers.forEach(clearTimeout)
    timers.length = 0
  })
}
