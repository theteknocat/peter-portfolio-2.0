<script setup lang="ts">
/**
 * Interactive hexagonal grid of skill icons.
 * Wide containers: hex/Catan shape (grows from top, peaks in middle, tapers to bottom).
 * Narrow containers: brick pattern (alternating row widths, rectangular overall).
 * Responds to container width changes via ResizeObserver.
 * Mouse position tilts the whole grid away from the cursor in 3D.
 * Icons spin on hover (velocity-based). Hexes can be drag-reordered.
 */
import { computed, onMounted, reactive, ref, watch, onUnmounted, type Component } from 'vue'
import type { Tag } from '@/types/portfolio'
import { siIcons } from '@/utils/techIcons'
import { stripTitle } from '@/utils/svg'
import { Plug, RefreshCw, Smartphone, Database, Terminal, Server } from '@lucide/vue'

const props = defineProps<{ skills: Tag[] }>()

const lucideComponents: Record<string, Component> = {
  Plug, RefreshCw, Smartphone, Database, Terminal, Server,
}

// ─── Pointy-top hex geometry (px) ────────────────────────────────────────────
// R (circumradius) scales with the container so hexes shrink on narrow screens
// (~4-5 across on mobile) and cap at MAX_R on wide ones. Everything below derives
// from R, so the whole grid scales from this one value.
const MAX_R = 50        // hex size on wide containers (current/desktop size)
const MIN_R = 30        // floor so very narrow screens stay legible
// ponytail: linear scale; 0.13 keeps ~4-5 across in the shrink band. Tune here.
const R = computed(() => {
  const w = availableWidth.value
  if (w <= 0) return MAX_R
  return Math.max(MIN_R, Math.min(MAX_R, w * 0.13))
})
const HEX_W = computed(() => R.value * Math.sqrt(3))  // flat-to-flat width
const HEX_H = computed(() => R.value * 2)             // vertex-to-vertex height
const ROW_SPACING = computed(() => R.value * 1.5)     // row centre-to-centre

// ─── Mouse interaction parameters ────────────────────────────────────────────
const TILT_MAX = 18     // degrees — max tilt at the grid edge
// Gaussian falloff radius for per-hex scale; proportional to R (110px at MAX_R).
const SIGMA = computed(() => R.value * (110 / 60))
const SCALE_MIN = 0.80  // scale of hexes furthest from mouse

// ─── Row distribution ─────────────────────────────────────────────────────────
// Wide containers (maxWidth ≥ 5): hex/diamond shape — scans W upward from 3 to
//   find the tallest valid diamond (most symmetric layout first). Adjacent rows
//   differ by ≤ 1, so hex nesting holds throughout.
// Narrow containers (maxWidth < 5): brick — alternating [W, W-1] rows, with a
//   tapered bottom ([k, k-1, …, 1]) when the remainder is a triangular number.

// Builds a symmetric diamond with peak row width W. Starts from the peak and
// works outward, adding paired rows of width W-1, W-2, … down to 2:
//   - enough for both sides  → symmetric pair, both top and bottom get width w
//   - enough for top only    → top gets w, bottom gets the remainder (asymmetric)
//   - less than a full row   → remainder lands on the bottom half only
// Any items still unplaced after w reaches 2 are appended as a single bottom row.
// The result is [...top, W, ...bottom], reading narrow→wide→narrow top to bottom.
function buildHexRows(n: number, W: number): number[] {
  const top: number[] = []
  const bottom: number[] = []
  let remaining = n - W
  for (let w = W - 1; w >= 2 && remaining > 0; w--) {
    if (remaining >= 2 * w) {
      top.unshift(w)
      bottom.push(w)
      remaining -= 2 * w
    } else if (remaining > w) {
      top.unshift(w)
      bottom.push(remaining - w)
      remaining = 0
    } else {
      bottom.push(remaining)
      remaining = 0
    }
  }
  if (remaining > 0) bottom.push(remaining)
  return [...top, W, ...bottom]
}

// Returns k if n is the k-th triangular number (n = k(k+1)/2), else null.
// Derived by solving k² + k − 2n = 0 via the quadratic formula; Math.round
// corrects for floating-point drift before the exact integer check.
function triangularRoot(n: number): number | null {
  const k = Math.round((-1 + Math.sqrt(1 + 8 * n)) / 2)
  return k * (k + 1) / 2 === n ? k : null
}

function buildBrickRows(n: number, W: number): number[] {
  const rows: number[] = []
  let remaining = n
  let wide = false  // start with the shorter row (W-1) so the grid opens narrow
  while (remaining > 0) {
    // Taper check: when a wide row can't be filled, try replacing the partial row
    // with a descending tail [k, k-1, …, 1] if remaining is a triangular number.
    // Guards:
    //   wide      — only fires for a partial wide row; narrow rows are never partial
    //               (W-1 ≤ remaining < W can't happen since W-1 < W).
    //   k >= W-2  — the taper starts no more than 1 step below the last narrow row
    //               (W-1), preventing a visual jump (e.g. 4 → 2 would be wrong).
    //   k <= W-1  — taper doesn't exceed the narrow row width.
    //   k >= 2    — avoids a degenerate taper of just [1] (that's still an orphan).
    if (wide && remaining < W) {
      const k = triangularRoot(remaining)
      if (k !== null && k >= 2 && k >= W - 2 && k <= W - 1) {
        for (let i = k; i >= 1; i--) rows.push(i)
        break
      }
    }
    const w = wide ? W : W - 1
    rows.push(Math.min(w, remaining))
    remaining -= Math.min(w, remaining)
    wide = !wide
  }
  return rows
}

function computeRows(n: number, maxWidth: number): number[] {
  if (n === 0 || maxWidth < 1) return []

  if (maxWidth >= 5) {
    // Pass 1 — balanced diamond: top/bottom rows must be ≥ half the peak width.
    // Scanning upward finds the tallest diamond that still meets that balance constraint.
    // On wide containers this prefers a shorter/wider shape over a tall/pointy one.
    for (let W = 3; W <= maxWidth; W++) {
      const rows = buildHexRows(n, W)
      const last = rows.length - 1
      if (
        rows.length >= 3 &&
        rows[last] !== 1 &&
        rows[last] <= rows[last - 1] &&
        rows[0] * 2 >= W &&
        rows[last] * 2 >= W
      ) return rows
    }
    // Pass 2 — narrow diamond fallback: if no balanced diamond fits, accept the
    // tallest valid diamond for the available width. Covers narrow containers where
    // the peak W is too small to satisfy the balance constraint but a diamond is still
    // achievable (e.g. n=34 with maxWidth=6 → [2,3,4,5,6,5,4,3,2]).
    for (let W = 3; W <= maxWidth; W++) {
      const rows = buildHexRows(n, W)
      const last = rows.length - 1
      if (rows.length >= 3 && rows[last] !== 1 && rows[last] <= rows[last - 1]) return rows
    }
  }

  // Brick mode fallback: alternating W / W-1, avoid orphan last row.
  // Tapered bottoms (ending ...2,1) are accepted — they're pointed, not orphaned.
  for (let W = maxWidth; W >= 2; W--) {
    const rows = buildBrickRows(n, W)
    const last = rows[rows.length - 1]
    const prev = rows[rows.length - 2]
    if (last !== 1 || prev === 2) return rows
  }

  // No orphan-free layout found — accept W=2 with an orphan rather than one overflow row
  if (maxWidth >= 2) return buildBrickRows(n, 2)
  // maxWidth === 1: single column
  return Array(n).fill(1)
}

// ─── Hex position data ────────────────────────────────────────────────────────
interface HexItem {
  skill: Tag
  x: number        // centre x relative to grid centre
  y: number        // centre y relative to grid centre
  siIcon: { svg: string; title: string } | null
  lucideIcon: Component | null
}

// Local copy of skills — reordered by drag-and-drop
const originalSkillsOrder = ref<Tag[]>([...props.skills])
const localSkills = ref<Tag[]>([...props.skills])

watch(() => props.skills, (newSkills) => {
  originalSkillsOrder.value = [...newSkills]
  localSkills.value = [...newSkills]
})

const isReordered = computed(() =>
  localSkills.value.some((s, i) => s.label !== originalSkillsOrder.value[i]?.label)
)

let isResetting = false
let justDropped = false

function resetOrder() {
  isResetting = true
  localSkills.value = [...originalSkillsOrder.value]
  // Flag cleared after Vue flushes — watch fires synchronously on assignment above
  Promise.resolve().then(() => { isResetting = false })
}

function shuffleOrder() {
  const arr = [...localSkills.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  localSkills.value = arr
}

const victoryActive = ref(false)
let victoryTimer: ReturnType<typeof setTimeout> | null = null

watch(isReordered, (nowReordered, wasReordered) => {
  if (wasReordered && !nowReordered && !isResetting) {
    if (victoryTimer) clearTimeout(victoryTimer)
    mousePos.value = null   // freeze tilt/scale to neutral for the duration
    victoryActive.value = true
    victoryTimer = setTimeout(() => {
      victoryActive.value = false
      mousePos.value = lastKnownMousePos.value
    }, 1400)
  }
})

// ─── Responsive max row width (drives computeRows) ───────────────────────────
const wrapperRef = ref<HTMLElement | null>(null)
const availableWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

const maxRowWidth = computed(() =>
  availableWidth.value > 0
    ? Math.max(1, Math.floor(availableWidth.value / HEX_W.value))
    : Math.max(2, Math.ceil(Math.sqrt(localSkills.value.length)))
)

const rows = computed(() => computeRows(localSkills.value.length, maxRowWidth.value))

const hexItems = computed<HexItem[]>(() => {
  const r = rows.value
  const totalHeight = (r.length - 1) * ROW_SPACING.value
  const firstY = -totalHeight / 2
  const items: HexItem[] = []
  let skillIdx = 0

  r.forEach((rowWidth, rowIdx) => {
    const y = firstY + rowIdx * ROW_SPACING.value
    const isLastRow = rowIdx === r.length - 1
    for (let col = 0; col < rowWidth; col++) {
      const x = (col - (rowWidth - 1) / 2) * HEX_W.value
        - (isLastRow && lastRowNeedsOffset.value ? HEX_W.value / 2 : 0)
      const skill = localSkills.value[skillIdx++]
      items.push({
        skill,
        x, y,
        siIcon: skill.si ? (siIcons[skill.si] ?? null) : null,
        lucideIcon: skill.lucide ? (lucideComponents[skill.lucide] ?? null) : null,
      })
    }
  })
  return items
})

const containerWidth = computed(() => Math.max(...rows.value, 0) * HEX_W.value)

// The centering formula staggers two adjacent rows by (W1 - W2) / 2 * HEX_W.
// That lands on a half-hex boundary (proper hex nesting) only when W1 and W2 have
// different parity. When both are odd or both are even, the shift is a whole-hex
// multiple and the rows column-align instead of nesting. Interior rows are always
// ±1 apart (guaranteed different parity), so only the last row can have this issue.
const lastRowNeedsOffset = computed(() => {
  const r = rows.value
  if (r.length < 2) return false
  return r[r.length - 2] % 2 === r[r.length - 1] % 2
})

const containerHeight = computed(() => {
  const r = rows.value
  return r.length === 0 ? 0 : (r.length - 1) * ROW_SPACING.value + HEX_H.value
})

// ─── Mouse interaction ────────────────────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)
// Tracks the last position the mouse was seen over the grid — never nulled,
// so victory animation end can restore tilt without waiting for a mousemove.
const lastKnownMousePos = ref<{ x: number; y: number } | null>(null)

// ─── Keyboard focus interaction ───────────────────────────────────────────────
// Last-used wins: whichever of mouse/keyboard acted most recently controls tilt/scale.
const controlSource = ref<'mouse' | 'keyboard' | null>(null)
const focusedHexPos = ref<{ x: number; y: number } | null>(null)

// Keyboard-driven tilt only on devices with a fine pointer (mouse/trackpad).
// On touch screens, tab-focus still moves the grid visually via the focus ring
// but shouldn't tilt the whole grid unexpectedly.
const keyboardTiltEnabled = typeof window !== 'undefined'
  && window.matchMedia('(hover: hover) and (pointer: fine)').matches

// ponytail: read once at setup — reduced-motion rarely toggles mid-session.
// When set, the grid drops tilt/scale (via effectivePos) and spin (via startSpin);
// hover/focus colour + label still work (those are plain CSS :hover/:focus).
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Resolves to the position that should drive tilt and per-hex scaling.
const effectivePos = computed(() => {
  if (prefersReducedMotion) return null   // no tilt, no per-hex scale
  return controlSource.value === 'keyboard'
    ? (keyboardTiltEnabled ? focusedHexPos.value : null)
    : mousePos.value
})

// DOM refs for each rendered hex cell — populated by :ref callback in v-for.
const hexCellEls = ref<(HTMLElement | null)[]>([])

function blurFocusedHex() {
  const el = document.activeElement as HTMLElement | null
  if (el?.classList.contains('hex-cell')) el.blur()
}

function onHexFocus(hex: HexItem, event: FocusEvent) {
  // Only keyboard focus drives the grid tilt. A pointer click also focuses the
  // hex, but :focus-visible is false then — without this guard a click would
  // switch controlSource to 'keyboard' and snap the tilt to the hex centre
  // (and a trackball click, with no follow-up mousemove, would leave it stuck).
  if (!(event.currentTarget as HTMLElement).matches(':focus-visible')) return
  focusedHexPos.value = { x: hex.x, y: hex.y }
  controlSource.value = 'keyboard'
}

function onHexBlur() {
  focusedHexPos.value = null
  // Defer the controlSource clear so that tabbing to the next hex cell (which fires
  // focus synchronously after this blur) can claim keyboard control first — if it did,
  // focusedHexPos will already be non-null again and we leave controlSource alone.
  Promise.resolve().then(() => {
    if (focusedHexPos.value === null && controlSource.value === 'keyboard') {
      controlSource.value = null
    }
  })
}

function onHexKeydown(event: KeyboardEvent, fromIdx: number) {
  if (isDragging.value) return
  const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  if (!arrows.includes(event.key)) return
  event.preventDefault()

  const items = hexItems.value
  const n = items.length
  if (n === 0) return

  const current = items[fromIdx]
  let targetIdx: number

  if (event.key === 'ArrowLeft') {
    targetIdx = (fromIdx - 1 + n) % n
  } else if (event.key === 'ArrowRight') {
    targetIdx = (fromIdx + 1) % n
  } else {
    const isUp = event.key === 'ArrowUp'
    const targetY = current.y + (isUp ? -ROW_SPACING.value : ROW_SPACING.value)
    const targetX = current.x + (isUp ? -HEX_W.value / 2 : HEX_W.value / 2)

    const rowCandidates = items.filter(h => Math.abs(h.y - targetY) < ROW_SPACING.value / 2)

    if (rowCandidates.length === 0) {
      // No row above/below — wrap to last (up) or first (down)
      targetIdx = isUp ? n - 1 : 0
    } else {
      const best = rowCandidates.reduce((a, b) =>
        Math.abs(a.x - targetX) <= Math.abs(b.x - targetX) ? a : b
      )
      targetIdx = items.indexOf(best)
    }
  }

  hexCellEls.value[targetIdx]?.focus()
}

function onMouseMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  if (!wrapperRef.value) return
  // Wrapper is the hit area (full container width); grid is centred within it on
  // both axes, so wrapper-centre == grid-centre and pos stays in hex coordinates.
  const rect = wrapperRef.value.getBoundingClientRect()
  const pos = {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  }
  lastKnownMousePos.value = pos
  if (victoryActive.value) return
  mousePos.value = pos
  controlSource.value = 'mouse'
}

function onMouseLeave() {
  // Suppressed during drag — mousePos is managed by the window mousemove handler
  if (isDragging.value) return
  mousePos.value = null
  lastKnownMousePos.value = null
  if (controlSource.value === 'mouse') controlSource.value = null
}

// Returns 3D tilt for the whole grid, tilting away from the mouse position.
// nx/ny are normalised to [-1, 1] across the grid's half-dimensions.
// rotateX(+θ) → top toward viewer / bottom away; rotateY(+θ) → right away / left toward.
const gridStyle = computed(() => {
  if (!effectivePos.value) return { transform: 'perspective(900px)' }
  const halfW = containerWidth.value / 2
  const halfH = containerHeight.value / 2
  const nx = halfW > 0 ? Math.max(-1, Math.min(1, effectivePos.value.x / halfW)) : 0
  const ny = halfH > 0 ? Math.max(-1, Math.min(1, effectivePos.value.y / halfH)) : 0
  const rotX = (ny * TILT_MAX).toFixed(2)
  const rotY = (-nx * TILT_MAX).toFixed(2)
  return { transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)` }
})

function hexCellStyle(hex: HexItem) {
  const base: Record<string, string> = {
    left: `${containerWidth.value / 2 + hex.x - HEX_W.value / 2}px`,
    top: `${containerHeight.value / 2 + hex.y - HEX_H.value / 2}px`,
    width: `${HEX_W.value}px`,
    height: `${HEX_H.value}px`,
    '--vx': `${(hex.x * 0.52).toFixed(1)}px`,
    '--vy': `${(hex.y * 0.52).toFixed(1)}px`,
  }
  if (!effectivePos.value) return base
  const dx = hex.x - effectivePos.value.x
  const dy = hex.y - effectivePos.value.y
  const weight = Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA.value * SIGMA.value))
  const scale = SCALE_MIN + (1.0 - SCALE_MIN) * weight
  return { ...base, transform: `scale(${scale.toFixed(3)})` }
}

// ─── Per-hex icon spin (velocity-based, not transition-based) ─────────────────
// On hover: omega accelerates toward SPIN_MAX (like spinning a top).
// On leave: two paths depending on how fast the icon is spinning:
//   High speed → coast naturally under sqrt drag; stop at the first 360° boundary
//               crossing where less than one full turn of momentum remains.
//   Low speed  → ease-out to nearest multiple with duration proportional to distance/speed.
//
// Decay model: sqrt drag (dω/dt = -k·√ω).
// Unlike exponential, this holds near max speed for longer then drops sharply to zero.
// Total coast distance from ω₀: 2/(3k)·ω₀^1.5. Coast time: 2√ω₀/k.

const SPIN_ALPHA = 8640       // acceleration deg/s² (~250ms to SPIN_MAX)
const SPIN_MAX = 2160         // max angular velocity deg/s (6 rotations/sec)
const SPIN_DECAY = 10         // sqrt-drag coefficient k — smaller = less drag = longer coast; T = 2√ω/k
const SPIN_BLUR_MAX = 3       // max blur px at SPIN_MAX omega

interface IconAnim {
  rotation: number
  omega: number
  phase: 'idle' | 'spinup' | 'spindown' | 'settling' | 'held'
  lastTime: number
  settleFrom: number
  settleTarget: number
  settleDuration: number
  settleElapsed: number
}

const iconAnims = new Map<string, IconAnim>()
const iconRotations = reactive<Record<string, number>>({})
const iconBlurs = reactive<Record<string, number>>({})
const iconHeld = reactive<Record<string, boolean>>({})
let spinRafId: number | null = null

function getIconAnim(key: string): IconAnim {
  if (!iconAnims.has(key)) {
    iconAnims.set(key, {
      rotation: 0, omega: 0, phase: 'idle', lastTime: 0,
      settleFrom: 0, settleTarget: 0, settleDuration: 0.2, settleElapsed: 0,
    })
    iconRotations[key] = 0
  }
  return iconAnims.get(key)!
}

// Quadratic ease-out: starts at max speed, decelerates to 0
function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t)
}

function spinTick(now: number) {
  let anyActive = false

  iconAnims.forEach((anim, key) => {
    if (anim.phase === 'idle' || anim.phase === 'held') return

    const dt = anim.lastTime ? Math.min((now - anim.lastTime) / 1000, 0.05) : 0
    anim.lastTime = now

    if (anim.phase === 'spinup') {
      anim.omega = Math.min(anim.omega + SPIN_ALPHA * dt, SPIN_MAX)
      anim.rotation += anim.omega * dt
      anyActive = true
    } else if (anim.phase === 'spindown') {
      // Sqrt drag: dω/dt = -k·√ω → holds near max speed then brakes to a hard stop
      anim.omega = Math.max(0, anim.omega - SPIN_DECAY * Math.sqrt(anim.omega) * dt)
      const prevFloor = Math.floor(anim.rotation / 360)
      anim.rotation += anim.omega * dt

      const remaining = (2 / (3 * SPIN_DECAY)) * Math.pow(anim.omega, 1.5)
      const newFloor = Math.floor(anim.rotation / 360)

      if (newFloor > prevFloor && remaining < 360) {
        // Just crossed a 360° boundary with less than one full turn of momentum left — stop here
        anim.rotation = 0
        anim.omega = 0
        anim.phase = 'idle'
      } else if (remaining < (360 - (anim.rotation % 360)) && remaining < 360) {
        // Won't reach the next boundary — settle to nearest multiple with a quick ease-out
        const r = anim.rotation % 360
        anim.settleFrom = anim.rotation
        anim.settleTarget = r <= 180 ? anim.rotation - r : anim.rotation + (360 - r)
        const distance = Math.abs(anim.settleTarget - anim.settleFrom)
        anim.settleDuration = Math.max(0.15, Math.min(0.6, 2 * distance / Math.max(anim.omega, 30)))
        anim.settleElapsed = 0
        anim.phase = 'settling'
      } else if (anim.omega <= 0) {
        anim.rotation = 0
        anim.phase = 'idle'
      } else {
        anyActive = true
      }
    } else if (anim.phase === 'settling') {
      anim.settleElapsed += dt
      const t = Math.min(anim.settleElapsed / anim.settleDuration, 1)
      anim.rotation = anim.settleFrom + (anim.settleTarget - anim.settleFrom) * easeOut(t)
      if (t >= 1) {
        anim.rotation = 0
        anim.omega = 0
        anim.phase = 'idle'
      } else {
        anyActive = true
      }
    }

    iconRotations[key] = anim.rotation
    iconBlurs[key] = (anim.omega / SPIN_MAX) * SPIN_BLUR_MAX
  })

  spinRafId = anyActive ? requestAnimationFrame(spinTick) : null
}

function startSpin(key: string) {
  if (prefersReducedMotion || isDragging.value || justDropped) return
  const anim = getIconAnim(key)
  anim.phase = 'spinup'
  anim.lastTime = performance.now()
  if (spinRafId === null) spinRafId = requestAnimationFrame(spinTick)
}

function holdSpin(key: string) {
  if (!iconAnims.has(key)) return
  const anim = iconAnims.get(key)!
  if (anim.phase === 'idle') return
  anim.omega = 0
  anim.phase = 'held'
  iconHeld[key] = true
}

function resetSpin(key: string) {
  iconAnims.delete(key)
  iconRotations[key] = 0
  iconBlurs[key] = 0
  iconHeld[key] = false
}

function releaseSpin(key: string) {
  const anim = getIconAnim(key)
  if (anim.phase !== 'held') return
  iconHeld[key] = false
  anim.settleFrom = anim.rotation
  anim.settleTarget = Math.round(anim.rotation / 360) * 360
  anim.settleDuration = 0.25
  anim.settleElapsed = 0
  anim.phase = 'settling'
  if (spinRafId === null) spinRafId = requestAnimationFrame(spinTick)
}

function stopSpin(key: string) {
  if (isDragging.value) return
  const anim = getIconAnim(key)
  if (anim.phase === 'held') { releaseSpin(key); return }
  if (anim.phase !== 'spinup') return

  const remainder = anim.rotation % 360
  const distToNextBoundary = remainder < 0.01 ? 360 : (360 - remainder)
  const naturalRemaining = (2 / (3 * SPIN_DECAY)) * Math.pow(anim.omega, 1.5)

  if (naturalRemaining >= distToNextBoundary) {
    anim.phase = 'spindown'
  } else {
    const nearest = remainder <= 180
      ? anim.rotation - remainder
      : anim.rotation + distToNextBoundary
    anim.settleFrom = anim.rotation
    anim.settleTarget = nearest
    const distance = Math.abs(nearest - anim.rotation)
    anim.settleDuration = Math.max(0.15, Math.min(0.8, 2 * distance / Math.max(anim.omega, 30)))
    anim.settleElapsed = 0
    anim.omega = 0
    anim.phase = 'settling'
  }
}

// Touch has no hover, so a tap toggles the spin: an idle icon launches at full
// speed and coasts down (the same fade a mouse-out gives), and a tap on an
// already-spinning icon (frozen to 'held' by holdSpin on press) settles it to a stop.
function tapSpin(key: string) {
  if (prefersReducedMotion) return
  const anim = getIconAnim(key)
  if (anim.phase === 'held') {
    releaseSpin(key)
    return
  }
  anim.omega = SPIN_MAX
  anim.rotation = 0
  anim.lastTime = performance.now()
  anim.phase = 'spindown'
  if (spinRafId === null) spinRafId = requestAnimationFrame(spinTick)
}

// ─── Drag-to-reorder ──────────────────────────────────────────────────────────
const isDragging = ref(false)
const dragSourceIdx = ref<number | null>(null)
const dragTargetIdx = ref<number | null>(null)
const dragX = ref(0)
const dragY = ref(0)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)

// Finds the slot index whose centre is nearest to (mx, my) in grid-relative coords.
function nearestHexIndex(mx: number, my: number): number {
  let best = 0, bestDist = Infinity
  hexItems.value.forEach((hex, i) => {
    const dx = hex.x - mx, dy = hex.y - my
    const d = dx * dx + dy * dy
    if (d < bestDist) { bestDist = d; best = i }
  })
  return best
}

// During drag, real items are kept in stable localSkills order so Vue never needs to
// insertBefore any DOM node — only left/top styles change, so CSS transitions always fire.
// The ghost is rendered as a separate element (not in this list) for the same reason.
const stableItems = computed<HexItem[]>(() => {
  if (!isDragging.value || dragSourceIdx.value === null || dragTargetIdx.value === null) {
    return hexItems.value
  }
  const src = dragSourceIdx.value
  const tgt = dragTargetIdx.value
  const slots = hexItems.value
  const result: HexItem[] = []
  let filteredIdx = 0
  for (let localIdx = 0; localIdx < localSkills.value.length; localIdx++) {
    if (localIdx === src) continue
    // Map position in the without-source list to a visual slot, skipping the ghost slot.
    const slot = filteredIdx < tgt ? filteredIdx : filteredIdx + 1
    result.push({ ...slots[localIdx], x: slots[slot].x, y: slots[slot].y })
    filteredIdx++
  }
  return result
})

// Ghost: the slot where the dragged item will land — rendered as a lone v-if div.
const ghostHex = computed(() =>
  isDragging.value && dragTargetIdx.value !== null
    ? hexItems.value[dragTargetIdx.value]
    : null
)

// The item being dragged — used to render the floating hex following the cursor.
const dragSkill = computed(() =>
  dragSourceIdx.value !== null ? hexItems.value[dragSourceIdx.value] : null
)

const floatingStyle = computed(() => ({
  '--hex-r': R.value,
  width: `${HEX_W.value}px`,
  height: `${HEX_H.value}px`,
  left: `${dragX.value - dragOffsetX.value - HEX_W.value / 2}px`,
  top: `${dragY.value - dragOffsetY.value - HEX_H.value / 2}px`,
}))

let pendingDragCancelFn: (() => void) | null = null

// Suppress the long-press context menu for the whole press→drag gesture. The
// floating hex is teleported to body, so a target-scoped handler misses it;
// window-level is the only reliable point. Attached in onHexPointerDown, removed
// once the gesture ends (cancel / onDragEnd / unmount).
const blockContextMenu = (e: Event) => e.preventDefault()

function startDrag(key: string, index: number, hexEl: HTMLElement, pointerId: number, clientX: number, clientY: number) {
  resetSpin(key)
  if (victoryTimer) { clearTimeout(victoryTimer); victoryTimer = null }
  victoryActive.value = false
  // Keep pointermove events flowing to us even when the pointer leaves the cell.
  // Touch scroll is already suppressed by touch-action: none on .hex-cell.
  hexEl.setPointerCapture(pointerId)
  dragSourceIdx.value = index
  dragTargetIdx.value = index
  isDragging.value = true
  // Cursor follows the pointer over any element during drag — element-level
  // cursor (grab on the hexes, default elsewhere) wins otherwise.
  document.body.classList.add('hex-dragging')
  dragX.value = clientX
  dragY.value = clientY
  // Use the element's actual rendered rect so the offset is correct under any 3D tilt.
  const hexRect = hexEl.getBoundingClientRect()
  dragOffsetX.value = clientX - (hexRect.left + hexRect.width  / 2)
  dragOffsetY.value = clientY - (hexRect.top  + hexRect.height / 2)
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
}

// Pointer travel (px) past the press point before a press becomes a drag rather
// than a tap/click. Touch can't scroll a hex (touch-action: none), so the same
// threshold distinguishes tap from drag for both input types.
const DRAG_THRESHOLD = 6

function onHexPointerDown(key: string, index: number, event: PointerEvent) {
  if (event.button !== 0) return
  // Capture element and coords now — event.currentTarget is nulled after this handler returns.
  const hexEl = event.currentTarget as HTMLElement
  const { clientX, clientY, pointerId } = event
  const isTouch = event.pointerType === 'touch'

  holdSpin(key)

  // Suppress the long-press context menu for the whole touch gesture (removed in
  // cancel for a tap, in onDragEnd for a drag).
  if (isTouch) window.addEventListener('contextmenu', blockContextMenu)

  // Don't start on press — a plain press is a tap/click (mouse: stop the hover
  // spin; touch: toggle the spin). Begin the drag only once the pointer travels
  // past DRAG_THRESHOLD; a release before then is the tap.
  const teardownPending = () => {
    pendingDragCancelFn = null
    window.removeEventListener('pointerup', cancel)
    window.removeEventListener('pointercancel', cancel)
    window.removeEventListener('pointermove', onPendingMove)
  }
  const onPendingMove = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - clientX, e.clientY - clientY) <= DRAG_THRESHOLD) return
    teardownPending()
    startDrag(key, index, hexEl, pointerId, clientX, clientY)
  }
  const cancel = () => {
    teardownPending()
    if (isTouch) {
      window.removeEventListener('contextmenu', blockContextMenu)
      tapSpin(key)
    } else {
      resetSpin(key)
    }
  }
  pendingDragCancelFn = cancel

  window.addEventListener('pointerup', cancel, { once: true })
  window.addEventListener('pointercancel', cancel, { once: true })
  window.addEventListener('pointermove', onPendingMove)
}

function onDragMove(event: PointerEvent) {
  event.preventDefault()
  dragX.value = event.clientX
  dragY.value = event.clientY
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const mx = event.clientX - rect.left - rect.width / 2
  const my = event.clientY - rect.top - rect.height / 2
  const inBounds =
    mx >= -containerWidth.value / 2 - HEX_W.value &&
    mx <= containerWidth.value / 2 + HEX_W.value &&
    my >= -containerHeight.value / 2 - HEX_H.value &&
    my <= containerHeight.value / 2 + HEX_H.value
  if (inBounds) {
    if (event.pointerType === 'mouse') {
      mousePos.value = { x: mx, y: my }
      lastKnownMousePos.value = { x: mx, y: my }
      controlSource.value = 'mouse'
    }
    dragTargetIdx.value = nearestHexIndex(mx, my)
  }
  // Outside grid bounds: mousePos and dragTargetIdx stay frozen at last in-grid values
}

function onDragEnd(event: PointerEvent) {
  if (!isDragging.value) return
  const src = dragSourceIdx.value!
  const tgt = dragTargetIdx.value!
  if (src !== tgt) {
    const skills = [...localSkills.value]
    const [item] = skills.splice(src, 1)
    skills.splice(tgt, 0, item)
    localSkills.value = skills
  }
  isDragging.value = false
  document.body.classList.remove('hex-dragging')
  dragSourceIdx.value = null
  dragTargetIdx.value = null
  justDropped = true
  setTimeout(() => { justDropped = false }, 150)
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
                   event.clientY >= rect.top  && event.clientY <= rect.bottom
    if (!inside) mousePos.value = null
  }
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  window.removeEventListener('contextmenu', blockContextMenu)
}

onMounted(() => {
  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      availableWidth.value = entry.contentRect.width
    })
    resizeObserver.observe(wrapperRef.value)
  }
})

onUnmounted(() => {
  document.body.classList.remove('hex-dragging')
  resizeObserver?.disconnect()
  if (spinRafId !== null) cancelAnimationFrame(spinRafId)
  // Invoke the pending-cancel fn so its own listeners (incl. pointermove) are torn down.
  pendingDragCancelFn?.()
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  window.removeEventListener('contextmenu', blockContextMenu)
})

defineExpose({ isReordered, resetOrder, shuffleOrder })
</script>

<template>
  <div
    ref="wrapperRef"
    class="hex-grid-wrapper"
  >
    <div
      ref="containerRef"
      class="hex-grid"
      :class="{ dragging: isDragging }"
      :style="[{ width: `${containerWidth}px`, height: `${containerHeight}px`, '--hex-r': R }, gridStyle]"
      @pointermove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <!-- Ghost: separate element so real items never move in the DOM -->
      <div v-if="ghostHex" class="hex-cell hex-cell--ghost" :style="hexCellStyle(ghostHex)">
        <div class="hex-border" />
        <div class="hex-face" />
      </div>

      <div
        v-for="(hex, i) in stableItems"
        :key="hex.skill.label"
        :ref="(el) => { hexCellEls[i] = el as HTMLElement | null }"
        class="hex-cell"
        tabindex="0"
        :class="{ 'hex-cell--victory': victoryActive }"
        :style="hexCellStyle(hex)"
        @mouseenter="blurFocusedHex"
        @focus="onHexFocus(hex, $event)"
        @blur="onHexBlur"
        @keydown="(e) => onHexKeydown(e, i)"
      >
        <div class="hex-border" />
        <div
          class="hex-face"
          :style="iconHeld[hex.skill.label] ? { cursor: 'grabbing' } : {}"
          @mouseenter="startSpin(hex.skill.label)"
          @mouseleave="stopSpin(hex.skill.label)"
          @pointerdown="(e: PointerEvent) => onHexPointerDown(hex.skill.label, i, e)"
          @dragstart.prevent
          @contextmenu.prevent
          @mouseup="releaseSpin(hex.skill.label)"
        >
          <div class="hex-icon-wrap" :style="{ transform: `rotateY(${iconRotations[hex.skill.label] ?? 0}deg)`, filter: `blur(${(iconBlurs[hex.skill.label] ?? 0).toFixed(2)}px)` }">
            <span
              v-if="hex.siIcon"
              class="hex-icon"
              v-html="stripTitle(hex.siIcon.svg)"
              aria-hidden="true"
            />
            <component
              v-else-if="hex.lucideIcon"
              :is="hex.lucideIcon"
              class="hex-icon"
              aria-hidden="true"
            />
          </div>
        </div>
        <div class="hex-label">{{ hex.skill.label }}</div>
      </div>
    </div>

    <!--
      Floating hex follows the cursor during drag.
      Teleported to <body> to escape the grid's CSS transform, which would otherwise
      break position:fixed for any child element.
    -->
    <Teleport to="body">
      <div v-if="isDragging && dragSkill" class="hex-floating" :style="floatingStyle">
        <div class="hex-border" />
        <div class="hex-face">
          <div
            class="hex-icon-wrap"
            :style="{ transform: `rotateY(${iconRotations[dragSkill!.skill.label] ?? 0}deg)`, filter: `blur(${(iconBlurs[dragSkill!.skill.label] ?? 0).toFixed(2)}px)` }"
          >
            <span
              v-if="dragSkill.siIcon"
              class="hex-icon"
              v-html="stripTitle(dragSkill.siIcon.svg)"
              aria-hidden="true"
            />
            <component
              v-else-if="dragSkill.lucideIcon"
              :is="dragSkill.lucideIcon"
              class="hex-icon"
              aria-hidden="true"
            />
          </div>
        </div>
        <div class="hex-label">{{ dragSkill.skill.label }}</div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.hex-grid-wrapper {
  width: 100%;
  user-select: none;
}

.hex-grid {
  position: relative;
  margin-inline: auto;
  transition: transform 300ms ease-out;
}

.hex-cell {
  position: absolute;
  /* A touch starting on a hex is ours (drag candidate) — never the browser's to
     scroll. touch-action is locked at touchstart, so anything but `none` lets the
     browser commit a scroll mid-hold that can't be reclaimed. Page scroll is by
     swiping off the hexes; the DRAG_THRESHOLD travel distinguishes tap from drag. */
  touch-action: none;
  /* Suppress the iOS long-press callout so it can't compete with the drag hold. */
  -webkit-touch-callout: none;
  transition: left 200ms ease-out, top 200ms ease-out, transform 200ms ease-out;
}

.hex-border,
.hex-face
 {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.hex-label {
  position: absolute;
  z-index: 10;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  will-change: opacity;
  /* Scales with hex size (12px ≙ 0.75rem at MAX_R 60). */
  font-size: calc(var(--hex-r, 60) * 0.2px);
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  white-space: nowrap;
  padding: 0.25rem 1rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 3s ease-out 200ms;
}

.hex-label::before,
.hex-label::after {
  content: '';
  display: block;
  position: absolute;
  inset: 0;
}

.hex-label::after {
  z-index: -1;
}

.hex-label::before {
  z-index: -2;
}

/*
 * Ring outline — traces outer hex CW then bridges to inner hex and traces it CCW.
 * The nonzero winding rule fills only the ring between the two paths, not the centre.
 * Inner vertices are at ≈93% of R from centre (≈4px inset before the scale).
 * scale(0.95) sets the gap between adjacent hexes.
 */
.hex-border {
  transform: scale(0.95);
  background: var(--color-primary);
  transition: background 6s ease-out 200ms;
  clip-path: polygon(
    50%    0%,    100%   25%,   100%   75%,
    50%    100%,  0%     75%,   0%     25%,
    2px    calc(25% + 1px),
    2px    calc(75% - 1px), 50% calc(100% - 2px), calc(100% - 2px)  calc(75% - 1px),
    calc(100% - 2px)  calc(25% + 1px), 50% 2px, 2px calc(25% + 1px),
    0%     25%
  );
}

.hex-label::after {
  background: var(--color-primary);
  clip-path: polygon(
    0%     50%,   10px              100%, calc(100% - 10px) 100%,
    100%   50%,   calc(100% - 10px) 0%,   10px 0%,
    11px   2px,
    calc(100% - 11px) 2px,
    calc(100% - 2px) 50%,
    calc(100% - 11px) calc(100% - 2px),
    11px calc(100% - 2px),
    2px 50%,
    11px 2px,
    10px 0
  );
}

/* Solid fill hex sits inside the border ring */
.hex-face {
  transform: scale(0.95);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: rgba(0, 45, 22, 0.274);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-light);
  perspective: 100px;
  cursor: grab;
  transition: background 6s ease-out 200ms;
}

.hex-label::before {
  background: rgba(0, 29, 14, 0.95);
  clip-path: polygon(0% 50%, 10px 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0%, 10px 0%);
}

.hex-cell:hover,
.hex-cell:focus-visible,
.hex-floating {
  z-index: 100;
  outline: none;
  & .hex-border {
    background: var(--color-accent-light);
    transition: background 80ms ease-in;
  }
  & .hex-face {
    background: rgba(255, 213, 43, 0.222);
    transition: background 80ms ease-in;
  }
}

.hex-cell:hover,
.hex-cell:focus-visible,
.hex-floating {
  & .hex-label {
    opacity: 1;
    transition: opacity 80ms ease-in;
    animation: nav-text-glitch 4s linear infinite;
    &::before,
    &::after {
      animation: shape-glitch 5s linear infinite;
    }
  }
}

/* Ghost slot: faint placeholder showing where the dragged hex will land */
.hex-cell--ghost .hex-border,
.hex-cell--ghost .hex-face {
  opacity: 0.2;
  pointer-events: none;
}

/* Disable all hex hover events while a drag is in progress */
.hex-grid.dragging .hex-face {
  pointer-events: none;
  cursor: default;
}

/* Wrapper receives the JS-driven rotateY transform */
.hex-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SI icons: SVG rendered inside a wrapper span */
.hex-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hex-icon :deep(svg) {
  /* Scales with hex size (48px ≙ 3rem at MAX_R 60). */
  width: calc(var(--hex-r, 60) * 0.8px);
  height: calc(var(--hex-r, 60) * 0.8px);
  fill: currentColor;
}

/* Lucide: component renders SVG as the root element, gets class directly */
svg.hex-icon {
  width: calc(var(--hex-r, 60) * 0.8px);
  height: calc(var(--hex-r, 60) * 0.8px);
  stroke: currentColor;
  fill: none;
}

/* Floating hex: follows cursor during drag; position:fixed via teleport to body */
.hex-floating {
  position: fixed;
  z-index: 1000;
}

/* Body class set while dragging — forces grabbing over every element the
   pointer crosses, not just the floating hex. */
:global(body.hex-dragging),
:global(body.hex-dragging *) {
  cursor: grabbing !important;
}

/* Victory animation — triggered when user drags skills back to original order.
 * Glow is on .hex-cell (not .hex-face) so drop-shadow can escape the clip-path. */
.hex-cell--victory {
  animation:
    hex-victory-spread 1.4s linear forwards,
    hex-victory-glow   1.4s ease-out forwards;
}

/* Reduced motion: keep the glow, drop the spread (translate/scale/jiggle).
   !important + scoped specificity survives the global * reset in transitions.css. */
@media (prefers-reduced-motion: reduce) {
  .hex-cell--victory {
    animation: hex-victory-glow 1.4s ease-out forwards !important;
  }
}

@keyframes hex-victory-spread {
  /* Spread: ease-in-out so translate/scale decelerate into the peak — builds anticipation.
   * Jiggle keyframes distributed across 0–45% (spread) then 45–66% (slam). */
  0%   { translate: 0px 0px; scale: 1;    rotate:   0deg; animation-timing-function: ease-in-out; }
  10%  {                                  rotate:   5deg; }
  17%  {                                  rotate:  -6deg; }
  23%  {                                  rotate:   8deg; }
  29%  {                                  rotate:  -8deg; }
  34%  {                                  rotate:  10deg; }
  38%  {                                  rotate: -10deg; }
  42%  {                                  rotate:  10deg; }
  /* Peak — translate/scale float to a stop here, jiggle continues uninterrupted.
   * ease-out on slam so it slams fast then eases into settle. */
  45%  { translate: var(--vx) var(--vy); scale: 1.32;    animation-timing-function: ease-out; }
  /* Slam: peak-frequency jiggle holds through impact */
  47%  {                                  rotate: -10deg; }
  50%  {                                  rotate:  10deg; }
  53%  {                                  rotate: -10deg; }
  56%  {                                  rotate:  10deg; }
  59%  {                                  rotate: -10deg; }
  62%  {                                  rotate:  10deg; }
  64%  {                                  rotate:  -5deg; }
  /* Impact: jiggle snaps to zero, slight overshoot */
  66%  { translate: calc(var(--vx) * -0.07) calc(var(--vy) * -0.07); scale: 0.94; rotate: 0deg; animation-timing-function: ease-out; }
  100% { translate: 0px 0px; scale: 1;    rotate: 0deg; }
}

@keyframes hex-victory-glow {
  0%   { filter: none; }
  45%  { filter: brightness(1.7) drop-shadow(0 0 8px var(--color-accent)); }
  /* inner glow dims as hexes slam home */
  64%  { filter: brightness(1.2) drop-shadow(0 0 3px var(--color-accent)); }
  /* impact: outer green splash fires near-instantly */
  66%  { filter: brightness(1.15) drop-shadow(0 0 42px #3dff7a) drop-shadow(0 0 14px var(--color-accent)); }
  /* hold briefly so it reads, then slow retract */
  78%  { filter: brightness(1.05) drop-shadow(0 0 28px #3dff7a) drop-shadow(0 0 8px var(--color-accent)); }
  100% { filter: none; }
}
</style>
