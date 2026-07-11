/// <reference types="vite-ssg" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE_URL = 'https://peter-epp.dev'
const AUTHOR = { '@type': 'Person', name: 'Peter Epp' }

/** Walk a dist dir for prerendered .html files, returning route paths. */
function htmlRoutes(dir: string, base = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return htmlRoutes(join(dir, e.name), `${base}/${e.name}`)
    if (!e.name.endsWith('.html')) return []
    return [e.name === 'index.html' ? base || '/' : `${base}/${e.name.replace(/\.html$/, '')}`]
  })
}

/** Fetch a fully-resolved page from the local API (reachable during `ddev exec` builds). */
async function fetchPage(page: string): Promise<{ sections: Array<{ template: string; content: Record<string, unknown>; items?: Array<Record<string, unknown>> }> }> {
  const res = await fetch(`http://localhost/api/page/${page}`)
  if (!res.ok) throw new Error(`Failed to fetch /api/page/${page}: ${res.status}`)
  return res.json()
}

/** Inject a JSON-LD block into a prerendered HTML file's <head>, if it exists. */
function injectJsonLd(htmlPath: string, data: Record<string, unknown>): void {
  if (!existsSync(htmlPath)) return
  const html = readFileSync(htmlPath, 'utf-8')
  const script = `<script type="application/ld+json">${JSON.stringify(data)}</script>`
  writeFileSync(htmlPath, html.replace('</head>', `${script}</head>`))
}

/** Build and inject JSON-LD for the home page (schema.org/Person) and every published portfolio/article item. */
async function injectStructuredData(outDir: string): Promise<void> {
  const home = await fetchPage('home')
  const intro = home.sections.find((s) => s.template === 'intro')?.content
  const skills = home.sections.find((s) => s.template === 'skills')?.content

  injectJsonLd(`${outDir}/index.html`, {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR.name,
    jobTitle: intro?.subtitle,
    url: SITE_URL,
    description: intro?.body,
    knowsAbout: (skills?.skills as Array<{ label: string }> | undefined)?.map((s) => s.label),
  })

  for (const type of ['portfolio', 'articles'] as const) {
    const page = await fetchPage(type)
    const items = page.sections.find((s) => Array.isArray(s.items))?.items ?? []

    for (const item of items) {
      const url = `${SITE_URL}/${type}/${item.slug}`
      const jsonLd =
        type === 'portfolio'
          ? {
              '@context': 'https://schema.org',
              '@type': 'CreativeWork',
              name: item.title,
              description: item.summary,
              url,
              keywords: (item.tags as Array<{ label: string }> | undefined)?.map((t) => t.label).join(', '),
              author: AUTHOR,
            }
          : {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: item.title,
              description: item.summary,
              datePublished: item.date,
              url,
              author: AUTHOR,
            }

      injectJsonLd(`${outDir}/${type}/${item.slug}.html`, jsonLd)
    }
  }
}

/** Add `/portfolio/{slug}` and `/articles/{slug}` for every item so vite-ssg prerenders them. */
async function includedRoutes(paths: string[]): Promise<string[]> {
  const routes = paths.filter((p) => !p.includes(':'))
  for (const type of ['portfolio', 'articles'] as const) {
    const page = await fetchPage(type)
    const items = page.sections.find((s) => Array.isArray(s.items))?.items ?? []
    for (const item of items) routes.push(`/${type}/${item.slug}`)
  }
  return routes
}

// ponytail: env var lets `ddev deploy-frontend` build into a separate dir
// without touching the local dev dist/
const outDir = process.env.VITE_OUT_DIR || 'dist'

export default defineConfig({
  build: {
    outDir,
  },
  ssgOptions: {
    includedRoutes,
    async onFinished() {
      const urls = htmlRoutes(outDir).sort()
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n') +
        '\n</urlset>\n'
      writeFileSync(`${outDir}/sitemap.xml`, xml)

      await injectStructuredData(outDir)
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
