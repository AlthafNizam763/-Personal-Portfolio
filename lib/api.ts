import { NextResponse } from 'next/server'
import type { FilterQuery, SortOrder } from 'mongoose'
import type { ApiResponse } from './types'
import type { ResourceConfig } from './resources'

/** Consistent JSON envelope for every API route. */
export function ok<T>(data: T, meta?: ApiResponse<T>['meta'], status = 200) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data, meta }, { status })
}

export function fail(
  error: string,
  status = 400,
  fieldErrors?: Record<string, string[]>
) {
  return NextResponse.json<ApiResponse>({ ok: false, error, fieldErrors }, { status })
}

export const unauthorized = () =>
  fail('You must be signed in to perform this action.', 401)

export const notFound = (what = 'Resource') => fail(`${what} not found.`, 404)

export const serverError = (err: unknown) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error.'
  console.error('[api]', message)
  return fail(
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : message,
    500
  )
}

/** Escapes user input before embedding it in a MongoDB $regex. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface ListQuery {
  filter: FilterQuery<unknown>
  sort: Record<string, SortOrder>
  page: number
  pageSize: number
  skip: number
}

const MAX_PAGE_SIZE = 100

/**
 * Translates `?search=&sort=&dir=&page=&pageSize=&enabled=&category=` into a
 * Mongo query, restricted to the fields the resource declares as searchable /
 * sortable / filterable so a caller cannot probe arbitrary fields.
 */
export function parseListQuery(
  searchParams: URLSearchParams,
  config: ResourceConfig
): ListQuery {
  const filter: FilterQuery<unknown> = {}

  // --- search ---
  const search = searchParams.get('search')?.trim()
  if (search && config.searchFields.length > 0) {
    const rx = new RegExp(escapeRegex(search), 'i')
    filter.$or = config.searchFields.map((field) => ({ [field]: rx }))
  }

  // --- boolean filters ---
  for (const field of config.booleanFilters) {
    const raw = searchParams.get(field)
    if (raw === 'true' || raw === 'false') {
      filter[field] = raw === 'true'
    }
  }

  // --- exact-match filters ---
  for (const field of config.enumFilters) {
    const raw = searchParams.get(field)?.trim()
    if (raw) filter[field] = raw
  }

  // --- sort ---
  const requestedSort = searchParams.get('sort')?.trim()
  const dir: SortOrder = searchParams.get('dir') === 'desc' ? -1 : 1
  const sort: Record<string, SortOrder> =
    requestedSort && config.sortFields.includes(requestedSort)
      ? { [requestedSort]: dir }
      : config.defaultSort

  // --- pagination ---
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const requestedSize = Number(searchParams.get('pageSize')) || 20
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize))

  return { filter, sort, page, pageSize, skip: (page - 1) * pageSize }
}

/** Best-effort client IP for rate limiting and abuse triage. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Reads a JSON body, returning null instead of throwing on malformed input. */
export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json()
  } catch {
    return null
  }
}
