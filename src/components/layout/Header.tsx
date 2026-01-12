import type { HeaderProps } from '../../types'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Header({
  title,
  subtitle,
  backTo,
  rightContent,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 py-4 backdrop-blur',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-pink-200 bg-white"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {rightContent && (
          <div className="flex items-center gap-2">{rightContent}</div>
        )}
      </div>
    </header>
  )
}
