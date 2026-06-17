type DateFormat = 'short' | 'long' | 'month-year' | 'iso'

/**
 * Format a job date string for display.
 *
 * Handles three formats from content YAML: `"present"` → `"Present"`,
 * `"YYYY"` → `"2003"`, `"YYYY-MM"` → `"Apr 2021"`. Uses the local Date
 * constructor for partial dates to avoid UTC midnight timezone shifts.
 * Unrecognised strings are returned unchanged.
 *
 * @param value - Partial ISO date string or the literal `"present"`.
 */
export function formatJobDate(value: string): string {
  if (value.toLowerCase() === 'present') return 'Present'
  if (/^\d{4}$/.test(value)) return value

  const m = /^(\d{4})-(\d{2})$/.exec(value)
  if (m) {
    const date = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1)
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short' }).format(date)
  }

  return value
}



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
