import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'
import type { InputVariant } from '../../types'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  leftIcon?: ReactNode
  variant?: InputVariant
  error?: string
}

const variantStyles: Record<InputVariant, string> = {
  default: 'border-pink-200 focus-within:border-pink-400',
  error: 'border-red-300 focus-within:border-red-500',
}

export default function Input({
  label,
  leftIcon,
  variant = 'default',
  error,
  className,
  ...props
}: InputProps) {
  const inputVariant = error ? 'error' : variant

  return (
    <label className="block">
      {label && (
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      )}
      <div
        className={cn(
          'mt-2 flex h-12 items-center gap-2 rounded-2xl border bg-white px-3',
          variantStyles[inputVariant],
          className
        )}
      >
        {leftIcon && (
          <span className="text-slate-400">{leftIcon}</span>
        )}
        <input
          className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </label>
  )
}
