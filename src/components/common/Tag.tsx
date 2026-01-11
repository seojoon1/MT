import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  selected?: boolean
  variant?: 'pink' | 'purple' | 'slate'
  clickable?: boolean
  showHash?: boolean
}

const variantStyles = {
  pink: {
    selected: 'border-pink-200 bg-pink-600 text-white',
    unselected: 'border-pink-200 bg-white text-slate-700 hover:bg-pink-50',
    static: 'bg-pink-50 text-pink-700',
  },
  purple: {
    selected: 'border-purple-200 bg-purple-600 text-white',
    unselected: 'border-pink-200 bg-white text-slate-700 hover:bg-purple-50',
    static: 'bg-purple-50 text-purple-700',
  },
  slate: {
    selected: 'border-slate-200 bg-slate-600 text-white',
    unselected: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    static: 'bg-slate-100 text-slate-600',
  },
}

export default function Tag({
  label,
  selected = false,
  variant = 'pink',
  clickable = true,
  showHash = true,
  className,
  ...props
}: TagProps) {
  const styles = variantStyles[variant]

  if (!clickable) {
    return (
      <span
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium',
          styles.static,
          className
        )}
      >
        {showHash ? `#${label}` : label}
      </span>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'h-11 rounded-full border px-4 text-sm font-medium transition-colors',
        selected ? styles.selected : styles.unselected,
        className
      )}
      {...props}
    >
      {showHash ? `#${label}` : label}
    </button>
  )
}
