/**
 * v-specular-highlight directive.
 *
 * Tracks the angle from the element's centre to the cursor and writes it to
 * --specular-angle on the element, driving a conic-gradient border glow that
 * mimics specular reflection off a slightly convex surface.
 *
 * The cursor is normalised to the element's own dimensions before computing
 * atan2, so the angle responds to "where on the face" rather than raw pixel
 * distance from centre. A per-frame lerp loop adds a natural drift lag.
 *
 * Usage:
 *   v-specular-highlight              — default lerp factor (0.06)
 *   v-specular-highlight="0.12"       — custom lerp factor (snappier)
 */

import type { Directive, DirectiveBinding } from 'vue'

const DEFAULT_LERP = 0.06

interface SpecularState {
  onMouseMove: (e: MouseEvent) => void
  cancel: () => void
}

const stateMap = new WeakMap<HTMLElement, SpecularState>()

/**
 * Shortest-path lerp between two angles in degrees, handling the ±180 wrap.
 */
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 180) % 360 + 360) % 360 - 180
  return a + diff * t
}

export const vSpecularHighlight: Directive<HTMLElement, number | undefined> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number | undefined>) {
    const lerp = binding.value ?? DEFAULT_LERP
    const REST_ANGLE = 135
    let targetAngle = REST_ANGLE
    let currentAngle = REST_ANGLE
    let rafId: number | null = null
    let isHovered = false

    function tick(): void {
      currentAngle = lerpAngle(currentAngle, targetAngle, lerp)
      el.style.setProperty('--specular-angle', `${currentAngle.toFixed(2)}deg`)
      if (isHovered || Math.abs(currentAngle - targetAngle) > 0.1) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = null
      }
    }

    function startLoop(): void {
      if (rafId === null) rafId = requestAnimationFrame(tick)
    }

    function onMouseMove(e: MouseEvent): void {
      const rect = el.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      targetAngle = Math.atan2(ny, nx) * 180 / Math.PI
    }

    function onMouseEnter(): void {
      isHovered = true
      el.addEventListener('mousemove', onMouseMove)
      startLoop()
    }

    function onMouseLeave(): void {
      isHovered = false
      targetAngle = REST_ANGLE
      el.removeEventListener('mousemove', onMouseMove)
      startLoop()
    }

    function onVisibilityChange(): void {
      if (document.hidden) {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
      } else if (isHovered) {
        startLoop()
      }
    }

    el.classList.add('specular-highlight')
    el.addEventListener('mouseenter', onMouseEnter)
    el.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)

    stateMap.set(el, {
      onMouseMove,
      cancel: () => {
        el.classList.remove('specular-highlight')
        el.removeEventListener('mouseenter', onMouseEnter)
        el.removeEventListener('mouseleave', onMouseLeave)
        el.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('visibilitychange', onVisibilityChange)
        if (rafId !== null) cancelAnimationFrame(rafId)
      },
    })
  },

  unmounted(el: HTMLElement) {
    stateMap.get(el)?.cancel()
    stateMap.delete(el)
  },
}
