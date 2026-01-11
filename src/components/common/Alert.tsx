import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type AlertVariant = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  className?: string
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'border-pink-200 bg-pink-50 text-pink-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export default function Alert({
  children,
  variant = 'error',
  className,
}: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 text-sm',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  )
}
