import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Minimal .env loader for the CLI scripts.
 *
 * Next.js loads .env.local automatically, but `tsx scripts/…` does not, and
 * pulling in dotenv just for two scripts is not worth a dependency. Values
 * already present in the real environment always win.
 */
const FILES = ['.env.local', '.env']

export function loadEnv(): void {
  for (const file of FILES) {
    const fullPath = path.join(process.cwd(), file)
    if (!existsSync(fullPath)) continue

    const contents = readFileSync(fullPath, 'utf8')

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue

      const equals = line.indexOf('=')
      if (equals === -1) continue

      const key = line.slice(0, equals).trim()
      let value = line.slice(equals + 1).trim()

      // Strip a single matching pair of surrounding quotes.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}

/** Fails fast with an actionable message rather than a stack trace. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(
      `\n✖ ${name} is not set.\n  Copy .env.example to .env.local and fill it in, then run this again.\n`
    )
    process.exit(1)
  }
  return value
}
