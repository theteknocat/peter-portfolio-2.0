/**
 * Maps tag icon identifiers to their icon data.
 *
 * Simple Icons slugs (si field in YAML) map to SI icon objects with .svg and .title.
 * Lucide component names (lucide field in YAML) are the PascalCase export name from
 * @lucide/vue — used as dynamic components in TechBadge.vue.
 *
 * Add imports here when introducing new skill tags that use Simple Icons.
 */
import {
  siPhp,
  siDrupal,
  siLaravel,
  siSymfony,
  siMysql,
  siHtml5,
  siCss,
  siJavascript,
  siJquery,
  siVuedotjs,
  siBootstrap,
  siTypescript,
  siVite,
  siDocker,
  siPython,
  siAlpinedotjs,
  siTailwindcss,
  siMarkdown,
  siYaml,
  siGit,
  siGithub,
  siLinux,
  siWordpress,
} from 'simple-icons'

export interface SiIcon {
  svg: string
  title: string
}

export const siIcons: Record<string, SiIcon> = {
  php: siPhp,
  drupal: siDrupal,
  laravel: siLaravel,
  symfony: siSymfony,
  mysql: siMysql,
  html5: siHtml5,
  css: siCss,
  javascript: siJavascript,
  jquery: siJquery,
  vuedotjs: siVuedotjs,
  bootstrap: siBootstrap,
  typescript: siTypescript,
  vite: siVite,
  docker: siDocker,
  python: siPython,
  alpinedotjs: siAlpinedotjs,
  tailwindcss: siTailwindcss,
  markdown: siMarkdown,
  yaml: siYaml,
  git: siGit,
  github: siGithub,
  linux: siLinux,
  wordpress: siWordpress,
}
