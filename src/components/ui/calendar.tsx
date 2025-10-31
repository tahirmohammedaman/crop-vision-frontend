import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center space-x-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'h-7 w-7 bg-transparent p-0 text-muted-foreground opacity-60 hover:opacity-100'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'h-7 w-7 bg-transparent p-0 text-muted-foreground opacity-60 hover:opacity-100'
        ),
        month_grid: 'mt-2 w-full border-collapse',
        weekdays: 'text-muted-foreground',
        weekday: 'h-9 w-9 text-center text-[0.8rem] font-normal',
        weeks: 'w-full',
        week: 'w-full',
        day: 'relative p-0 text-center align-middle text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-9 w-9 p-0 font-normal text-sm aria-selected:opacity-100'
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-muted-foreground opacity-50',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        chevron: 'h-4 w-4',
        dropdowns: 'flex items-center justify-center space-x-2',
        footer: 'pt-4',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, size = 16 }) => {
          const iconClass = cn('h-4 w-4', className)
          switch (orientation) {
            case 'right':
              return <ChevronRight className={iconClass} size={size} />
            case 'up':
              return <ChevronUp className={iconClass} size={size} />
            case 'down':
              return <ChevronDown className={iconClass} size={size} />
            case 'left':
            default:
              return <ChevronLeft className={iconClass} size={size} />
          }
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'
