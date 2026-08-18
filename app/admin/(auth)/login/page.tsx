import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from '@/components/admin/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  // Only ever return to an in-app admin path — prevents the `next` parameter
  // being used as an open redirect to another origin.
  const safeNext =
    typeof next === 'string' && next.startsWith('/admin') && !next.startsWith('//')
      ? next
      : '/admin'

  return (
    <div className="font-sora min-h-screen bg-admin-bg flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-black text-white items-center justify-center font-extrabold text-lg">
            A
          </span>
          <h1 className="text-2xl font-bold text-admin-ink mt-5">
            Portfolio <span className="font-extrabold">Admin</span>
          </h1>
          <p className="text-sm text-admin-muted mt-2">
            Sign in to manage your portfolio content.
          </p>
        </div>

        <div className="bg-white border border-admin-border rounded-xl shadow-sm p-6 sm:p-8">
          <LoginForm redirectTo={safeNext} />
        </div>

        <p className="text-center text-xs text-admin-muted mt-6">
          <Link href="/" className="hover:text-admin-ink underline underline-offset-2">
            ← Back to the portfolio
          </Link>
        </p>
      </div>
    </div>
  )
}
