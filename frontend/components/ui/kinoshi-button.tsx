import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface KinoshiButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'variant'> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'success'
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

const KinoshiButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  KinoshiButtonProps
>(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  const variantStyles = {
    primary:
      'bg-[var(--kinoshi-primary)] text-white hover:bg-[var(--kinoshi-primary)]/90 shadow-sm',
    secondary:
      'bg-[var(--kinoshi-gold)] text-[var(--kinoshi-text)] hover:bg-[var(--kinoshi-gold)]/90 shadow-sm',
    outline:
      'border border-[var(--kinoshi-border)] bg-transparent text-[var(--kinoshi-text)] hover:bg-[var(--kinoshi-surface)]',
    ghost: 'text-[var(--kinoshi-text)] hover:bg-[var(--kinoshi-surface)]',
    destructive:
      'bg-[var(--kinoshi-danger)] text-white hover:bg-[var(--kinoshi-danger)]/90 shadow-sm',
    success:
      'bg-[var(--kinoshi-success)] text-[var(--kinoshi-text)] hover:bg-[var(--kinoshi-success)]/90 shadow-sm',
  }

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    default: 'h-9 px-4 py-2',
    lg: 'h-10 px-6 text-base',
    icon: 'h-9 w-9',
  }

  return (
    <Button
      ref={ref}
      className={cn(
        'font-medium transition-all duration-200 focus:ring-2 focus:ring-[var(--kinoshi-primary)]/20',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
})
KinoshiButton.displayName = 'KinoshiButton'

export { KinoshiButton }
