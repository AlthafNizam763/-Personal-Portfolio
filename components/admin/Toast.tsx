'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TbCircleCheck, TbAlertTriangle, TbInfoCircle, TbX } from 'react-icons/tb'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const ICONS: Record<ToastKind, typeof TbCircleCheck> = {
  success: TbCircleCheck,
  error: TbAlertTriangle,
  info: TbInfoCircle,
}

const STYLES: Record<ToastKind, string> = {
  success: 'border-black bg-black text-white',
  error: 'border-red-600 bg-white text-red-700',
  info: 'border-admin-border bg-white text-admin-ink',
}

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId++
      setToasts((current) => [...current, { id, kind, message }])
      // Errors linger longer — they usually need reading, not just noticing.
      window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000)
    },
    [dismiss]
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message: string) => push(message, 'success'),
      error: (message: string) => push(message, 'error'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-[calc(100vw-2.5rem)] max-w-sm"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.kind]
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 shadow-lg ${STYLES[toast.kind]}`}
                role={toast.kind === 'error' ? 'alert' : 'status'}
              >
                <Icon size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm leading-5 flex-1">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss notification"
                >
                  <TbX size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
