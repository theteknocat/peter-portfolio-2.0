/**
 * Umami custom-event helper.
 *
 * The Umami tracker is a plain <script> in index.html that attaches
 * `umami` to `window`. `declare global` teaches TypeScript about that
 * property, since it isn't part of the DOM typings. The tracker may be
 * missing (ad blocker, local dev, prerender), so the call is optional.
 */
declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, string | number | boolean>) => void }
  }
}

/**
 * Send a custom event to Umami, doing nothing if the tracker isn't present.
 *
 * Use `data-umami-event` in templates for plain clicks; use this for events
 * that come from script logic (drag-and-drop, game state).
 *
 * @param name - Event name (Umami caps these at 50 characters).
 * @param data - Optional properties to attach to the event.
 */
export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return
  window.umami?.track(name, data)
}
