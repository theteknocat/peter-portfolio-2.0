import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import './assets/css/main.css'
import { vTooltip } from './directives/tooltip'
import { vSpecularHighlight } from './directives/specularHighlight'

const app = createApp(App)
app.use(router)
app.directive('tooltip', vTooltip)
app.directive('specular-highlight', vSpecularHighlight)
app.mount('#app')
