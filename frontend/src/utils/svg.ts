/**
 * Strips the <title> element from an SVG string.
 *
 * Simple Icons (and other icon sets) include a <title> that browsers render
 * as a native tooltip. Remove it when a custom tooltip is already provided.
 *
 * @param svg - Raw SVG markup string.
 * @returns The SVG string with any <title>…</title> block removed.
 */
export function stripTitle(svg: string): string {
  return svg.replace(/<title>.*?<\/title>/s, '')
}
