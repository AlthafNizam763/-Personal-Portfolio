import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __dirname = dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({ baseDirectory: __dirname })

/**
 * ESLint 9 flat config. `next lint` is deprecated in Next.js 15 and removed in
 * 16, so `npm run lint` calls the ESLint CLI directly.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      // The original Vite app, kept for reference only.
      'legacy-react/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Deliberate `any` in the generic CRUD layer is annotated inline; keep
      // the rule as a warning elsewhere rather than failing the build.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]

export default config
