import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface MainProps {
  children: ReactNode
  className?: string
}

export default function Main({ children, className }: MainProps) {
  return (
    <main className={cn('flex-1 overflow-y-auto px-4 pb-6 pt-4', className)}>
      {children}
    </main>
  )
}
