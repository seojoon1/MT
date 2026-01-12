import type { SpinnerProps, SpinnerSize } from '../../types'
import { cn } from '../../utils/cn'

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-pink-200 border-t-pink-600',
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="로딩 중"
    />
  )
}
