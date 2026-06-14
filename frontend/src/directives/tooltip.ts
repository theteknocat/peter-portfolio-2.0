/**
 * v-tooltip directive.
 *
 * Usage:
 *   v-tooltip                  — reads the element's `title` attribute
 *   v-tooltip="'Custom text'"  — uses the provided string directly
 *
 * If the element has target="_blank", the phrase " - Open link in a new
 * window/tab" is automatically appended (or used alone when there is no
 * other text). The native `title` attribute is removed on mount so the
 * browser's own tooltip does not appear alongside.
 */

import { computePosition, flip, shift, offset, arrow, autoUpdate } from '@floating-ui/dom'
import type { DirectiveBinding } from 'vue'

// 8px square rotated 45° — ceil(8 * √2) = 12px full diagonal, 6px half.
const HALF_DIAG = 6
const FULL_DIAG = 12

interface TooltipState {
  tooltipEl: HTMLElement | null
  onEnter: () => void
  onLeave: () => void
  getTooltipEl: () => HTMLElement | null
  getCleanup: () => (() => void) | null
}

const stateMap = new WeakMap<HTMLElement, TooltipState>()

/**
 * Composes the tooltip text from the directive binding and element attributes.
 *
 * @param el - The element the directive is bound to.
 * @param binding - The Vue directive binding (value is an optional string).
 * @returns The composed tooltip string, or empty string if nothing to show.
 */
function resolveText(el: HTMLElement, binding: DirectiveBinding<string | undefined>): string {
  let text = binding.value ?? el.getAttribute('title') ?? ''

  if (el.getAttribute('target') === '_blank') {
    text = text ? `${text} - Open link in a new window/tab` : 'Open link in a new window/tab'
  }

  return text
}

/**
 * Creates and positions the tooltip element relative to the target.
 * Returns the element and an `autoUpdate` cleanup function that continuously
 * repositions the tooltip as the anchor moves (e.g. mid-CSS-transform).
 *
 * @param anchor - The element to position the tooltip against.
 * @param text - The text to display inside the tooltip.
 * @returns The created tooltip element and its autoUpdate cleanup function.
 */
async function createTooltip(
  anchor: HTMLElement,
  text: string,
): Promise<{ el: HTMLElement; cleanup: () => void }> {
  const tooltipEl = document.createElement('div')
  tooltipEl.className = 'tooltip-popup'
  tooltipEl.textContent = text

  // Pre-sized to the full diagonal so arrow() middleware measures a consistent
  // element; width/height are corrected below once we know the placement side.
  const arrowEl = document.createElement('div')
  arrowEl.className = 'tooltip-arrow-wrapper'
  Object.assign(arrowEl.style, { width: `${FULL_DIAG}px`, height: `${FULL_DIAG}px` })
  tooltipEl.appendChild(arrowEl)

  document.body.appendChild(tooltipEl)

  async function updatePosition(): Promise<void> {
    const { x, y, placement, middlewareData } = await computePosition(anchor, tooltipEl, {
      placement: 'top',
      middleware: [
        offset(10),
        flip(),
        shift({ padding: 8 }),
        arrow({ element: arrowEl }),
      ],
    })

    Object.assign(tooltipEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    })

    // Position the wrapper on the tooltip edge closest to the anchor.
    // staticSide is that edge; arrowX/Y give its position along the edge.
    const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {}
    const staticSide = ({ top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const)[
      placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right'
    ]

    // Horizontal edges (top/bottom): wrapper is wide and short; vertical: tall and narrow.
    const isHorizontal = staticSide === 'bottom' || staticSide === 'top'
    arrowEl.dataset.side = staticSide
    Object.assign(arrowEl.style, {
      width: `${isHorizontal ? FULL_DIAG : HALF_DIAG}px`,
      height: `${isHorizontal ? HALF_DIAG : FULL_DIAG}px`,
      left: arrowX != null ? `${arrowX}px` : '',
      top: arrowY != null ? `${arrowY}px` : '',
      // 1px overlap into the tooltip box hides the seam between arrow and border.
      [staticSide]: `-${HALF_DIAG - 1}px`,
    })
  }

  // Initial position — awaited so the tooltip is correctly placed before it
  // becomes visible.
  await updatePosition()

  // autoUpdate re-runs updatePosition whenever the anchor or viewport changes
  // (scroll, resize, DOM mutations), keeping the tooltip locked to the anchor
  // even if a CSS transform is mid-animation when mouseenter fired.
  const cleanup = autoUpdate(anchor, tooltipEl, updatePosition)

  return { el: tooltipEl, cleanup }
}

export const vTooltip = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | undefined>) {
    const text = resolveText(el, binding)
    if (!text) return

    // Remove native title to prevent the browser tooltip appearing alongside.
    if (el.hasAttribute('title')) {
      el.removeAttribute('title')
    }

    let tooltipEl: HTMLElement | null = null
    let tooltipCleanup: (() => void) | null = null
    let cancelled = false

    const onEnter = () => {
      cancelled = false
      createTooltip(el, text).then(({ el: tip, cleanup }) => {
        // mouseleave fired before the async position calculation finished — discard.
        if (cancelled) {
          cleanup()
          tip.remove()
          return
        }
        tooltipEl = tip
        tooltipCleanup = cleanup
        requestAnimationFrame(() => tip.classList.add('is-visible'))
      })
    }

    const onLeave = () => {
      if (!tooltipEl) {
        // Still resolving — mark cancelled so the .then() discards it.
        cancelled = true
        return
      }
      const tip = tooltipEl
      const cleanup = tooltipCleanup
      tooltipEl = null
      tooltipCleanup = null
      // Stop position tracking before beginning the exit transition.
      cleanup?.()
      tip.classList.remove('is-visible')
      tip.addEventListener('transitionend', () => tip.remove(), { once: true })
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)

    // getTooltipEl / getCleanup let unmounted reach the live closure variables.
    stateMap.set(el, {
      tooltipEl: null,
      onEnter,
      onLeave,
      getTooltipEl: () => tooltipEl,
      getCleanup: () => tooltipCleanup,
    })
  },

  unmounted(el: HTMLElement) {
    const state = stateMap.get(el)
    if (!state) return

    state.getCleanup()?.()
    state.getTooltipEl()?.remove()
    el.removeEventListener('mouseenter', state.onEnter)
    el.removeEventListener('mouseleave', state.onLeave)
    stateMap.delete(el)
  },
}
