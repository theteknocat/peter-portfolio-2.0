import { useHead } from '@unhead/vue'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

const SITE_URL = 'https://peter-epp.dev'
const SITE_NAME = 'Peter Epp'

interface SeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  /** Route path, e.g. '/portfolio' (root is ''). */
  path: MaybeRefOrGetter<string>
  /** og:type — 'website' for listings, 'article' for detail pages. */
  type?: string
}

/**
 * Sets the per-route document head: title, description, canonical link, and
 * Open Graph / Twitter card tags, all derived from the site domain.
 *
 * @param options - Page title, description, route path, and optional og:type.
 */
export function useSeo(options: SeoOptions): void {
  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const url = computed(() => SITE_URL + toValue(options.path))

  useHead({
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: options.type ?? 'website' },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    link: [{ rel: 'canonical', href: url }],
  })
}
