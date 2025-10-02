import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const v = Math.max(0, Math.min(100, value))
    return (
      <div ref={ref} className={cn('relative h-2 w-full overflow-hidden rounded bg-muted', className)} {...props}>
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${v}%` }} />
      </div>
    )
  },
)
Progress.displayName = 'Progress'
