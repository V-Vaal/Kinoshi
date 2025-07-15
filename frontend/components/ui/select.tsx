import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
  </div>
))
Select.displayName = 'Select'

const SelectGroup = React.forwardRef<
  HTMLOptGroupElement,
  React.OptgroupHTMLAttributes<HTMLOptGroupElement>
>(({ className, ...props }, ref) => (
  <optgroup
    ref={ref}
    className={cn('text-muted-foreground', className)}
    {...props}
  />
))
SelectGroup.displayName = 'SelectGroup'

const SelectValue = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option ref={ref} className={cn('', className)} {...props} />
))
SelectValue.displayName = 'SelectValue'

export { Select, SelectGroup, SelectValue }
