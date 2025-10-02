import * as React from 'react'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  header: React.ReactNode
  content: React.ReactNode
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Item[]
  type?: 'single' | 'multiple'
  defaultOpenIds?: string[]
}

export function Accordion({ items, className, type = 'single', defaultOpenIds = [], ...props }: AccordionProps) {
  const [open, setOpen] = React.useState<string[]>(defaultOpenIds)

  function toggle(id: string) {
    setOpen((prev) => {
      const isOpen = prev.includes(id)
      if (type === 'single') {
        return isOpen ? [] : [id]
      }
      return isOpen ? prev.filter((x) => x !== id) : [...prev, id]
    })
  }

  return (
    <div className={cn('divide-y rounded-md border', className)} {...props}>
      {items.map((item) => {
        const isOpen = open.includes(item.id)
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              aria-expanded={isOpen}
              aria-controls={`acc-panel-${item.id}`}
              id={`acc-header-${item.id}`}
            >
              <span>{item.header}</span>
              <span className={cn('transition-transform', isOpen && 'rotate-180')}>▾</span>
            </button>
            <div
              id={`acc-panel-${item.id}`}
              role="region"
              aria-labelledby={`acc-header-${item.id}`}
              aria-hidden={!isOpen}
              className={cn('grid transition-[grid-template-rows] duration-200 ease-in-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
            >
              <div className={cn('overflow-hidden text-sm text-muted-foreground', isOpen && 'px-4 py-3')}>
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
