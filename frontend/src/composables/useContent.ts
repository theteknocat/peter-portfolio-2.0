import { ref } from 'vue'

/**
 * Fetches a single content item from `/api/content/{type}/{slug}`.
 *
 * The generic `T` parameter lets callers type the returned data ref to their
 * specific content type (e.g. `useContent<PortfolioItem>('portfolio', slug)`).
 * Awaited during `setup()` (async setup, requires a `<Suspense>` ancestor) so
 * the data is present in prerendered SSG output, not just client-side.
 *
 * @param type - The content type directory name (e.g. `'portfolio'`, `'articles'`).
 * @param slug - The item slug matching the YAML filename without extension.
 * @returns Reactive refs for the item data and any error message.
 */
export async function useContent<T>(type: string, slug: string) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)

  try {
    const base = import.meta.env.SSR ? 'http://localhost' : ''
    const response = await fetch(`${base}/api/content/${type}/${slug}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data.value = await response.json() as T
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  }

  return { data, error }
}
