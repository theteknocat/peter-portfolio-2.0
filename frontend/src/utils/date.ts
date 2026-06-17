type DateFormat = 'short' | 'long' | 'month-year' | 'iso'

const formatOptions: Record<Exclude<DateFormat, 'iso'>, Intl.DateTimeFormatOptions> = {
  short:        { year: 'numeric', month: 'short', day: 'numeric' },
  long:         { year: 'numeric', month: 'long',  day: 'numeric' },
  'month-year': { year: 'numeric', month: 'long' },
}

/**
 * Format a date value for display.
 *
 * Accepts an ISO string (`"2025-06-01"`), a Unix timestamp in seconds
 * (what PHP/Symfony YAML produces for unquoted date fields), or a `Date`.
 * Returns the original value stringified if it can't be parsed.
 *
 * @param value - The date to format.
 * @param format - `'short'` (default) → "Jun 1, 2025", `'long'` → "June 1, 2025",
 *   `'month-year'` → "June 2025", `'iso'` → "2025-06-01".
 */
export function formatDate(
  value: string | number | Date,
  format: DateFormat = 'short',
): string {
  // PHP Unix timestamps are seconds; JS Date expects milliseconds.
  const date = new Date(typeof value === 'number' ? value * 1000 : value)

  if (isNaN(date.getTime())) return String(value)

  if (format === 'iso') {
    return date.toISOString().slice(0, 10)
  }

  return new Intl.DateTimeFormat('en-CA', formatOptions[format]).format(date)
}
