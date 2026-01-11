import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className={cn('mx-auto flex h-full max-w-[480px] flex-col', className)}>
        {children}
      </div>
    </div>
  )
}
