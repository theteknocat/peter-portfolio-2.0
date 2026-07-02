import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import './assets/css/main.css'
import { vTooltip } from './directives/tooltip'
import { vSpecularHighlight } from './directives/specularHighlight'

// ViteSSG owns the app + router: it calls this factory once per route in Node
// at build time (to prerender HTML) and once in the browser (to hydrate).
export const createApp = ViteSSG(
  App,
  {
    routes,
    // Modal open/close keeps the underlying page's scroll position (restored
    // via App.vue's --page-scroll-y anchoring); any other navigation resets
    // to the top.
    scrollBehavior(to, from) {
      if (to.meta.modal || from.meta.modal) return false
      // scrollBehavior overrides the browser's native anchor scrolling entirely,
      // so hash links must be handled explicitly — otherwise they'd fall through
      // to the top: 0 default below. scrollIntoView() is used instead of
      // returning { el } so that scroll-margin-top is respected; returning false
      // then prevents Vue Router from also running its own window.scrollTo().
      if (to.hash) {
        document.querySelector(to.hash)?.scrollIntoView()
        return false
      }
      return { top: 0, behavior: 'instant' }
    },
  },
  ({ app }) => {
    app.directive('tooltip', vTooltip)
    app.directive('specular-highlight', vSpecularHighlight)
  },
)
