import type { CardProps } from '../../types'
import { cn } from '../../utils/cn'

export default function Card({
  children,
  noPadding = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-pink-100 bg-white shadow-sm',
        !noPadding && 'p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
