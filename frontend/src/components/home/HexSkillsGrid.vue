<script setup lang="ts">
/**
 * Interactive hexagonal grid of skill icons.
 * Row widths follow a diamond shape (widest in centre, tapering outward).
 * Mouse position tilts the whole grid away from the cursor in 3D.
 * Icons spin on hover (velocity-based). Hexes can be drag-reordered.
 */
import { computed, reactive, ref, onUnmounted, type Component } from 'vue'
import type { Tag } from '@/types/portfolio'
import { siIcons } from '@/utils/techIcons'
import { stripTitle } from '@/utils/svg'
import { Plug, RefreshCw, Smartphone, Database, Terminal, Server } from '@lucide/vue'

const props = defineProps<{ skills: Tag[] }>()

const lucideComponents: Record<string, Component> = {
  Plug, RefreshCw, Smartphone, Database, Terminal, Server,
}

// ─── Pointy-top hex geometry (px) ────────────────────────────────────────────
const R = 60
const HEX_W = R * Math.sqrt(3)  // flat-to-flat width  ≈ 103.9px
const HEX_H = 2 * R             // vertex-to-vertex height = 120px
const ROW_SPACING = 1.5 * R     // row centre-to-centre = 90px

// ─── Mouse interaction parameters ────────────────────────────────────────────
const TILT_MAX = 18     // degrees — max tilt at the grid edge
const SIGMA = 110       // Gaussian falloff radius for per-hex scale (px)
const SCALE_MIN = 0.80  // scale of hexes furthest from mouse

// ─── Row distribution: full diamond [1..W..1] trimmed from the bottom ────────
// For N skills, W = ceil(√N). Diamond sums to W²; surplus rows removed bottom-up
// so narrower rows appear at the top, widest row radiates near centre.
function computeRows(n: number): number[] {
  if (n === 0) return []
  const W = Math.ceil(Math.sqrt(n))
  const diamond: number[] = []
  for (let i = 1; i <= W; i++) diamond.push(i)
  for (let i = W - 1; i >= 1; i--) diamond.push(i)

  let surplus = W * W - n
  let hi = diamond.length - 1
  while (surplus > 0) {
    const take = Math.min(diamond[hi], surplus)
    diamond[hi] -= take
    surplus -= take
    if (diamond[hi] === 0) hi--
  }
  return diamond.slice(0, hi + 1)
}

// ─── Hex position data ────────────────────────────────────────────────────────
interface HexItem {
  skill: Tag
  x: number        // centre x relative to grid centre
  y: number        // centre y relative to grid centre
  index: number    // localSkills index — stable across drag, keys iconAnims/iconRotations
  siIcon: { svg: string; title: string } | null
  lucideIcon: Component | null
}

// Local copy of skills — reordered by drag-and-drop
const originalSkillsOrder = [...props.skills]
const localSkills = ref<Tag[]>([...props.skills])

const isReordered = computed(() =>
  localSkills.value.some((s, i) => s.label !== originalSkillsOrder[i]?.label)
)

function resetOrder() {
  localSkills.value = [...originalSkillsOrder]
}

const rows = computed(() => computeRows(localSkills.value.length))

const hexItems = computed<HexItem[]>(() => {
  const r = rows.value
  const totalHeight = (r.length - 1) * ROW_SPACING
  const firstY = -totalHeight / 2
  const items: HexItem[] = []
  let skillIdx = 0

  r.forEach((rowWidth, rowIdx) => {
    const y = firstY + rowIdx * ROW_SPACING
    // Centering each row gives natural hex stagger:
    // adjacent rows of width W and W-1 are automatically offset by HEX_W/2.
    for (let col = 0; col < rowWidth; col++) {
      const x = (col - (rowWidth - 1) / 2) * HEX_W
      const skill = localSkills.value[skillIdx++]
      items.push({
        skill,
        x, y,
        index: items.length,
        siIcon: skill.si ? (siIcons[skill.si] ?? null) : null,
        lucideIcon: skill.lucide ? (lucideComponents[skill.lucide] ?? null) : null,
      })
    }
  })
  return items
})

const containerWidth = computed(() => Math.max(...rows.value, 0) * HEX_W)

const containerHeight = computed(() => {
  const r = rows.value
  return r.length === 0 ? 0 : (r.length - 1) * ROW_SPACING + HEX_H
})

// ─── Mouse interaction ────────────────────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)

function onMouseMove(event: MouseEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  mousePos.value = {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  }
}

function onMouseLeave() {
  // Suppressed during drag — mousePos is managed by the window mousemove handler
  if (isDragging.value) return
  mousePos.value = null
}

// Returns 3D tilt for the whole grid, tilting away from the mouse position.
// nx/ny are normalised to [-1, 1] across the grid's half-dimensions.
// rotateX(+θ) → top toward viewer / bottom away; rotateY(+θ) → right away / left toward.
const gridStyle = computed(() => {
  if (!mousePos.value) return { transform: 'perspective(900px)' }
  const halfW = containerWidth.value / 2
  const halfH = containerHeight.value / 2
  const nx = halfW > 0 ? Math.max(-1, Math.min(1, mousePos.value.x / halfW)) : 0
  const ny = halfH > 0 ? Math.max(-1, Math.min(1, mousePos.value.y / halfH)) : 0
  const rotX = (ny * TILT_MAX).toFixed(2)
  const rotY = (-nx * TILT_MAX).toFixed(2)
  return { transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)` }
})

function hexCellStyle(hex: HexItem) {
  const base = {
    left: `${containerWidth.value / 2 + hex.x - HEX_W / 2}px`,
    top: `${containerHeight.value / 2 + hex.y - HEX_H / 2}px`,
    width: `${HEX_W}px`,
    height: `${HEX_H}px`,
  }
  if (!mousePos.value) return base
  const dx = hex.x - mousePos.value.x
  const dy = hex.y - mousePos.value.y
  const weight = Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA))
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

const SPIN_ALPHA = 2400       // acceleration deg/s²
const SPIN_MAX = 2160         // max angular velocity deg/s (6 rotations/sec)
const SPIN_DECAY = 10         // sqrt-drag coefficient k — smaller = less drag = longer coast; T = 2√ω/k

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

const iconAnims = new Map<number, IconAnim>()
const iconRotations = reactive<Record<number, number>>({})
const iconHeld = reactive<Record<number, boolean>>({})
let spinRafId: number | null = null

function getIconAnim(index: number): IconAnim {
  if (!iconAnims.has(index)) {
    iconAnims.set(index, {
      rotation: 0, omega: 0, phase: 'idle', lastTime: 0,
      settleFrom: 0, settleTarget: 0, settleDuration: 0.2, settleElapsed: 0,
    })
    iconRotations[index] = 0
  }
  return iconAnims.get(index)!
}

// Quadratic ease-out: starts at max speed, decelerates to 0
function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t)
}

function spinTick(now: number) {
  let anyActive = false

  iconAnims.forEach((anim, index) => {
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

    iconRotations[index] = anim.rotation
  })

  spinRafId = anyActive ? requestAnimationFrame(spinTick) : null
}

function startSpin(index: number) {
  if (isDragging.value) return
  const anim = getIconAnim(index)
  anim.phase = 'spinup'
  anim.lastTime = performance.now()
  if (spinRafId === null) spinRafId = requestAnimationFrame(spinTick)
}

function holdSpin(index: number) {
  const anim = getIconAnim(index)
  if (anim.phase === 'idle') return
  anim.omega = 0
  anim.phase = 'held'
  iconHeld[index] = true
}

function releaseSpin(index: number) {
  const anim = getIconAnim(index)
  if (anim.phase !== 'held') return
  iconHeld[index] = false
  anim.settleFrom = anim.rotation
  anim.settleTarget = Math.round(anim.rotation / 360) * 360
  anim.settleDuration = 0.25
  anim.settleElapsed = 0
  anim.phase = 'settling'
  if (spinRafId === null) spinRafId = requestAnimationFrame(spinTick)
}

function stopSpin(index: number) {
  if (isDragging.value) return
  const anim = getIconAnim(index)
  if (anim.phase === 'held') { releaseSpin(index); return }
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
    anim.phase = 'settling'
  }
}

// ─── Drag-to-reorder ──────────────────────────────────────────────────────────
const isDragging = ref(false)
const dragSourceIdx = ref<number | null>(null)
const dragTargetIdx = ref<number | null>(null)
const dragX = ref(0)
const dragY = ref(0)

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
  width: `${HEX_W}px`,
  height: `${HEX_H}px`,
  left: `${dragX.value - HEX_W / 2}px`,
  top: `${dragY.value - HEX_H / 2}px`,
}))

function startDrag(index: number, event: MouseEvent) {
  holdSpin(index)
  dragSourceIdx.value = index
  dragTargetIdx.value = index
  isDragging.value = true
  dragX.value = event.clientX
  dragY.value = event.clientY
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(event: MouseEvent) {
  dragX.value = event.clientX
  dragY.value = event.clientY
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const mx = event.clientX - rect.left - rect.width / 2
  const my = event.clientY - rect.top - rect.height / 2
  const inBounds =
    mx >= -containerWidth.value / 2 - HEX_W &&
    mx <= containerWidth.value / 2 + HEX_W &&
    my >= -containerHeight.value / 2 - HEX_H &&
    my <= containerHeight.value / 2 + HEX_H
  if (inBounds) {
    mousePos.value = { x: mx, y: my }
    dragTargetIdx.value = nearestHexIndex(mx, my)
  }
  // Outside grid bounds: mousePos and dragTargetIdx stay frozen at last in-grid values
}

function onDragEnd(event: MouseEvent) {
  if (!isDragging.value) return
  const src = dragSourceIdx.value!
  const tgt = dragTargetIdx.value!
  if (src !== tgt) {
    const skills = [...localSkills.value]
    const [item] = skills.splice(src, 1)
    skills.splice(tgt, 0, item)
    localSkills.value = skills
  }
  // Clear all animation state — localSkills indices shift after reorder, so stale
  // entries at old indices must not be inherited by items that land there.
  iconAnims.clear()
  if (spinRafId !== null) { cancelAnimationFrame(spinRafId); spinRafId = null }
  Object.keys(iconRotations).forEach(k => { iconRotations[+k] = 0 })
  Object.keys(iconHeld).forEach(k => { iconHeld[+k] = false })
  isDragging.value = false
  dragSourceIdx.value = null
  dragTargetIdx.value = null
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
                   event.clientY >= rect.top  && event.clientY <= rect.bottom
    if (!inside) mousePos.value = null
  }
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

onUnmounted(() => {
  if (spinRafId !== null) cancelAnimationFrame(spinRafId)
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
})

defineExpose({ isReordered, resetOrder })
</script>

<template>
  <div
    ref="containerRef"
    class="hex-grid"
    :class="{ dragging: isDragging }"
    :style="[{ width: `${containerWidth}px`, height: `${containerHeight}px` }, gridStyle]"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Ghost: separate element so real items never move in the DOM -->
    <div v-if="ghostHex" class="hex-cell hex-cell--ghost" :style="hexCellStyle(ghostHex)">
      <div class="hex-border" />
      <div class="hex-face" />
    </div>

    <div
      v-for="hex in stableItems"
      :key="hex.skill.label"
      class="hex-cell"
      :style="hexCellStyle(hex)"
    >
      <div class="hex-border" />
      <div
        class="hex-face"
        :style="iconHeld[hex.index] ? { cursor: 'grabbing' } : {}"
        @mouseenter="startSpin(hex.index)"
        @mouseleave="stopSpin(hex.index)"
        @mousedown="(e: MouseEvent) => startDrag(hex.index, e)"
        @mouseup="releaseSpin(hex.index)"
      >
        <div class="hex-icon-wrap" :style="{ transform: `rotateY(${iconRotations[hex.index] ?? 0}deg)` }">
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
          :style="{ transform: `rotateY(${iconRotations[dragSourceIdx ?? 0] ?? 0}deg)` }"
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
    </div>
  </Teleport>
</template>

<style scoped>
.hex-grid {
  position: relative;
  margin-inline: auto;
  transition: transform 300ms ease-out;
}

.hex-cell {
  position: absolute;
  transition: left 200ms ease-out, top 200ms ease-out, transform 200ms ease-out;
}

.hex-border,
.hex-face {
  position: absolute;
  inset: 0;
  will-change: transform;
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
  clip-path: polygon(
    50%    0%,    100%   25%,   100%   75%,
    50%    100%,  0%     75%,   0%     25%,
    2px    calc(25% + 1px),
    2px    calc(75% - 1px), 50% calc(100% - 2px), calc(100% - 2px)  calc(75% - 1px),
    calc(100% - 2px)  calc(25% + 1px), 50% 2px, 2px calc(25% + 1px),
    0%     25%
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
  width: 3rem;
  height: 3rem;
  fill: currentColor;
}

/* Lucide: component renders SVG as the root element, gets class directly */
svg.hex-icon {
  width: 3rem;
  height: 3rem;
  stroke: currentColor;
  fill: none;
}

/* Floating hex: follows cursor during drag; position:fixed via teleport to body */
.hex-floating {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  cursor: grabbing;
}
</style>
