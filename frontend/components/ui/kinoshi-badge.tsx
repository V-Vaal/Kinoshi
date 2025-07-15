import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'

interface KinoshiBadgeProps
  extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const KinoshiBadge = React.forwardRef<
  React.ElementRef<typeof Badge>,
  KinoshiBadgeProps
>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default:
      'bg-[var(--kinoshi-primary)]/10 text-[var(--kinoshi-primary)] border-[var(--kinoshi-primary)]/20',
    success:
      'bg-[var(--kinoshi-success)]/10 text-[var(--kinoshi-success)] border-[var(--kinoshi-success)]/20',
    warning:
      'bg-[var(--kinoshi-gold)]/10 text-[var(--kinoshi-text)] border-[var(--kinoshi-gold)]/20',
    danger:
      'bg-[var(--kinoshi-danger)]/10 text-[var(--kinoshi-danger)] border-[var(--kinoshi-danger)]/20',
    info: 'bg-[var(--kinoshi-muted)]/10 text-[var(--kinoshi-muted)] border-[var(--kinoshi-muted)]/20',
  }

  return (
    <Badge
      ref={ref}
      className={cn(
        'font-medium text-xs px-2 py-1 rounded-full border',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
KinoshiBadge.displayName = 'KinoshiBadge'

export { KinoshiBadge }
