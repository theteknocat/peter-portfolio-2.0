# TypeScript + Vue 3 Concepts

A working checklist of concepts to cover during the build.
Ordered roughly by when they'll appear naturally in the code.
Check off each one as it comes up and gets explained.

---

## TypeScript Fundamentals

### Basic Types

- [ ] Type annotations — `const name: string = 'Peter'`
- [ ] Primitive types — `string`, `number`, `boolean`, `null`, `undefined`
- [ ] Arrays — `string[]` vs `Array<string>`
- [ ] Type inference — when TypeScript figures it out without you annotating
- [ ] `any` — what it means and why to avoid it

### Shapes

- [x] `interface` — defining the shape of an object
- [ ] `type` alias — similar to interface, when to use which
- [ ] Optional properties — `title?: string`
- [ ] Readonly properties — `readonly slug: string`
- [ ] Extending interfaces — `interface B extends A`

### Functions

- [ ] Function parameter types — `function greet(name: string): string`
- [ ] Return type annotations
- [ ] Void return type
- [ ] Arrow function types

### Union & Intersection

- [ ] Union types — `string | number`
- [ ] Literal types — `type Status = 'loading' | 'success' | 'error'`
- [ ] Narrowing — how TypeScript knows which type you're using inside an `if`

### Generics

- [ ] What a generic is — `function wrap<T>(value: T): T`
- [ ] Generic interfaces — `interface ApiResponse<T> { data: T }`
- [ ] Why generics matter for `ref<T>()` in Vue

### Utility Types

- [ ] `Partial<T>` — makes all properties optional
- [ ] `Required<T>` — makes all properties required
- [ ] `Pick<T, K>` — select a subset of properties
- [ ] `Omit<T, K>` — exclude properties
- [ ] `Record<K, V>` — object with known key/value types

### Other

- [ ] `as` type assertion — when and why (and why to be careful)
- [ ] Non-null assertion `!` — `element!.value`
- [ ] `unknown` vs `any` — the safer alternative
- [ ] `typeof` and `instanceof` narrowing

---

## Vue 3 — Composition API

Peter has Vue 2 / Options API experience. This section focuses on the Composition API
and draws parallels to Options API equivalents where helpful.

### script setup & SFC structure

- [x] The three blocks — `<script setup>`, `<template>`, `<style scoped>` (known)
- [ ] `<script setup>` vs `export default defineComponent()` — why setup is preferred
- [ ] How scoped styles work — what `:deep()` is for and when you need it

### Reactivity (parallels to Options API `data`, `computed`, `watch`)

- [ ] `ref()` — like a reactive `data` property; wraps a primitive value
- [ ] `.value` — why you need it in `<script>` but not in `<template>`
- [ ] `reactive()` — reactive objects; why `ref` is usually preferred anyway
- [ ] `computed()` — same idea as Options API `computed`, different syntax
- [ ] `watch()` — like Options API `watch`; explicit source + callback
- [ ] `watchEffect()` — no Options API equivalent; auto-tracks dependencies

### Component Communication (parallels to Options API `props`, `$emit`)

- [ ] `defineProps()` — replaces the `props: {}` options block
- [ ] `defineProps` with TypeScript — typed props without a runtime schema
- [ ] `withDefaults()` — default prop values in the TS style
- [ ] `defineEmits()` — replaces `emits: []` and `this.$emit()`
- [ ] `v-model` on custom components — how it maps to a prop + emit under the hood

### Template Directives

These work the same as Vue 2, but worth a refresh on the less common ones:

- [x] `v-if` / `v-else` / `v-for` / `v-bind` / `v-on` (known)
- [ ] `v-show` vs `v-if` — when to use which and the performance difference
- [ ] `v-for` with `:key` — why the key matters for DOM diffing
- [ ] `v-model` modifiers — `.lazy`, `.trim`, `.number`
- [x] Custom directives — `v-tooltip` directive: `mounted`/`unmounted`, `DirectiveBinding<T>`, `WeakMap` state, global `app.directive()` registration

### Lifecycle (parallels to Options API hooks)

- [x] `onMounted()` → replaces `mounted()`
- [x] `onUnmounted()` → replaces `beforeDestroy()` / `destroyed()`; cleanup pattern
- [ ] `onUpdated()` → replaces `updated()`
- [x] Why lifecycle hooks can be called multiple times in a composable

### Slots

- [ ] Default slot — `<slot />` and passing content from parent
- [ ] Named slots — `<slot name="header" />` and `v-slot:header`
- [ ] Scoped slots — passing data back up to the parent through a slot
- [ ] The `$slots` object and checking if a slot was provided

### Advanced

- [x] Template refs — `ref()` for DOM elements: `const el = ref<HTMLElement | null>(null)`
- [ ] Dynamic components — `<component :is="..." />` and use cases
- [ ] `defineExpose()` — exposing methods to parent components (rare but useful)

---

## Composables

- [x] What a composable is — a function that encapsulates reactive logic
- [x] Naming convention — `useXxx`
- [x] Returning refs from a composable
- [x] Why composables replace mixins from Vue 2
- [ ] `useFetch` pattern — async data fetching in a composable

---

## Vue Router

- [ ] `<RouterView />` — where the matched route renders
- [ ] `<RouterLink />` — navigation without page reload
- [ ] `useRoute()` — reading current route params and query
- [ ] `useRouter()` — programmatic navigation
- [ ] Route params — `/portfolio/:slug` and reading `route.params.slug`
- [ ] Lazy-loaded routes — `() => import('./views/...')` and why it matters for bundle size
- [ ] Navigation guards — protecting routes

---

## TypeScript + Vue Patterns

- [ ] Typing `ref()` — `ref<string>('')` vs letting TS infer
- [ ] Typing `computed()` — when TypeScript needs help with the return type
- [ ] Typed props with interfaces — `defineProps<{ item: PortfolioItem }>()`
- [ ] Typed emits — `defineEmits<{ select: [id: string] }>()`
- [x] Typing async functions — `async function fetch(): Promise<PortfolioItem[]>` — used in `createTooltip` returning `Promise<{ el: HTMLElement; cleanup: () => void }>`
- [ ] Handling `null` and `undefined` in templates safely

---

## Vite-Specific

- [ ] `vite-env.d.ts` — why it exists (covered already ✓)
- [ ] `import.meta.env` — environment variables in Vite
- [ ] `@/` path alias — shorthand for `src/`
- [ ] Asset imports — images, fonts, and how Vite processes them
- [ ] HMR (Hot Module Replacement) — what it is and how Vite uses it
- [ ] Build output — what ends up in `dist/` and why filenames have hashes
