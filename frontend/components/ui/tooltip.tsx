import * as React from 'react'

import { cn } from '@/lib/utils'

const Tooltip = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & {
    content?: string
    children: React.ReactNode
  }
>(({ className, content, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('group relative inline-block', className)}
    {...props}
  >
    {children}
    {content && (
      <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
        <div className="rounded-md bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-popover"></div>
        </div>
      </div>
    )}
  </div>
))
Tooltip.displayName = 'Tooltip'

export { Tooltip }
