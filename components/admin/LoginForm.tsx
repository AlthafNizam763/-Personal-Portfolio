'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbEye, TbEyeOff, TbAlertTriangle } from 'react-icons/tb'
import { api, ApiError } from '@/lib/api-client'

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      await api.post('/api/auth/login', { email, password })
      // `replace` so Back does not return to the login screen once signed in.
      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors ?? {})
      } else {
        setError('Could not sign in. Please try again.')
      }
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-admin-border px-3.5 py-2.5 text-sm text-admin-ink placeholder:text-admin-muted/70 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-shadow'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <TbAlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-admin-ink mb-1.5">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          autoFocus
          aria-invalid={fieldErrors.email ? true : undefined}
          className={inputClass}
          placeholder="you@example.com"
        />
        {fieldErrors.email?.map((message) => (
          <p key={message} className="text-xs text-red-600 mt-1.5">
            {message}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-admin-ink mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            aria-invalid={fieldErrors.password ? true : undefined}
            className={`${inputClass} pr-11`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-ink transition-colors"
          >
            {showPassword ? <TbEyeOff size={18} /> : <TbEye size={18} />}
          </button>
        </div>
        {fieldErrors.password?.map((message) => (
          <p key={message} className="text-xs text-red-600 mt-1.5">
            {message}
          </p>
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
