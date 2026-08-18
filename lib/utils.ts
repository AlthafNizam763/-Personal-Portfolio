/** Small shared helpers used by both the portfolio and the admin panel. */

/** Joins class names, dropping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** "My Project (v2)" -> "my-project-v2" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * "2024-07-01" -> "July 2024". Rendered on the server and the client, so it
 * deliberately avoids `toLocaleDateString` (locale/timezone drift between the
 * two would cause a hydration mismatch).
 */
export function formatMonthYear(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Renders the "July 2024 - Present" style range used by Experience/Education. */
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
  current = false
): string {
  const from = formatMonthYear(start)
  const to = current ? 'Present' : formatMonthYear(end)
  if (!from && !to) return ''
  if (!from) return to
  if (!to) return from
  return `${from} - ${to}`
}

/** "17 Aug 2026, 14:30" — stable across server/client. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = MONTHS[d.getUTCMonth()]!.slice(0, 3)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${day} ${month} ${d.getUTCFullYear()}, ${hh}:${mm}`
}

/** "2 days ago" — used in the admin messages list. */
export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

/** Total whole years between the earliest start date and now. */
export function yearsOfExperience(
  entries: Array<{ startDate: string | null }>
): number {
  const timestamps = entries
    .map((e) => (e.startDate ? new Date(e.startDate).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
  if (timestamps.length === 0) return 0
  const earliest = Math.min(...timestamps)
  const years = (Date.now() - earliest) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.max(0, Math.floor(years))
}

/** Truncates on a word boundary, appending an ellipsis. */
export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** Zero-pads the project index the way the original design did ("01", "02"). */
export function padIndex(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Groups skills by category, preserving render order: a category appears at
 * the position of its lowest-ordered skill, which reproduces the original
 * hardcoded category sequence.
 *
 * Lives here rather than in lib/data.ts so client components can import it
 * without pulling Mongoose into the browser bundle.
 */
export function groupSkillsByCategory<T extends { category: string }>(
  skills: T[]
): { category: string; skills: T[] }[] {
  const groups = new Map<string, T[]>()
  for (const skill of skills) {
    const list = groups.get(skill.category)
    if (list) list.push(skill)
    else groups.set(skill.category, [skill])
  }
  return Array.from(groups, ([category, items]) => ({ category, skills: items }))
}

/** Turns an absolute URL into a display host, e.g. "github.com". */
export function displayHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}
