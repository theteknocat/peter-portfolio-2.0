import type { Component } from 'vue'

/**
 * Maps a resolved section's `template` to the Vue component that renders it.
 *
 * @param map - Lookup from template name to component.
 * @returns `resolveSection`, which looks up a component by template and warns
 *   in dev if nothing is registered for it.
 */
export function useSectionComponents(map: Record<string, Component>) {
  function resolveSection(template: string): Component | undefined {
    const component = map[template]
    if (!component && import.meta.env.DEV) {
      console.warn(`No component registered for section template: "${template}"`)
    }
    return component
  }

  return { resolveSection }
}
