import type { TextareaProps, InputVariant } from '../../types'
import { cn } from '../../utils/cn'

const variantStyles: Record<InputVariant, string> = {
  default: 'border-pink-200 focus:border-pink-400',
  error: 'border-red-300 focus:border-red-500',
}

export default function Textarea({
  label,
  variant = 'default',
  error,
  className,
  ...props
}: TextareaProps) {
  const inputVariant = error ? 'error' : variant

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
      )}
      <textarea
        className={cn(
          'mt-2 w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400',
          variantStyles[inputVariant],
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
