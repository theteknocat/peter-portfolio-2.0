/// <reference types="vite-ssg" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE_URL = 'https://peter-epp.dev'

/** Walk a dist dir for prerendered .html files, returning route paths. */
function htmlRoutes(dir: string, base = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return htmlRoutes(join(dir, e.name), `${base}/${e.name}`)
    if (!e.name.endsWith('.html')) return []
    return [e.name === 'index.html' ? base || '/' : `${base}/${e.name.replace(/\.html$/, '')}`]
  })
}

// ponytail: env var lets `ddev deploy-frontend` build into a separate dir
// without touching the local dev dist/
const outDir = process.env.VITE_OUT_DIR || 'dist'

export default defineConfig({
  build: {
    outDir,
  },
  ssgOptions: {
    onFinished() {
      const urls = htmlRoutes(outDir).sort()
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n') +
        '\n</urlset>\n'
      writeFileSync(`${outDir}/sitemap.xml`, xml)
    },
  },
  plugins: [
    vue({ template: { compilerOptions: { comments: false } } }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['peter-portfolio.ddev.site'],
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
})
