import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card'

interface KinoshiCardProps extends React.ComponentProps<typeof Card> {
  variant?: 'default' | 'elevated' | 'outlined'
  children: React.ReactNode
}

const KinoshiCard = React.forwardRef<
  React.ElementRef<typeof Card>,
  KinoshiCardProps
>(({ className, variant = 'default', children, ...props }, ref) => {
  const variantStyles = {
    default:
      'bg-[#FAFAF7] border border-[var(--kinoshi-gold)]/40 shadow-lg rounded-2xl',
    elevated:
      'bg-[#F5F3ED] border border-[var(--kinoshi-gold)]/50 shadow-2xl rounded-2xl',
    outlined:
      'bg-[#FEFEFC] border border-[var(--kinoshi-gold)]/30 shadow-none rounded-2xl',
  }

  return (
    <Card
      ref={ref}
      className={cn(
        'transition-all duration-200 hover:shadow-xl relative overflow-hidden',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === 'elevated' && (
        <span className="pointer-events-none absolute inset-0 z-0 bg-[var(--kinoshi-gold)]/10" />
      )}
      <div className="relative z-10">{children}</div>
    </Card>
  )
})
KinoshiCard.displayName = 'KinoshiCard'

const KinoshiCardHeader = React.forwardRef<
  React.ElementRef<typeof CardHeader>,
  React.ComponentProps<typeof CardHeader>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn('border-b border-[var(--kinoshi-border)]/30', className)}
    {...props}
  />
))
KinoshiCardHeader.displayName = 'KinoshiCardHeader'

const KinoshiCardTitle = React.forwardRef<
  React.ElementRef<typeof CardTitle>,
  React.ComponentProps<typeof CardTitle>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn(
      'text-[var(--kinoshi-text)] font-serif text-2xl font-extrabold tracking-tight',
      className
    )}
    {...props}
  />
))
KinoshiCardTitle.displayName = 'KinoshiCardTitle'

const KinoshiCardDescription = React.forwardRef<
  React.ElementRef<typeof CardDescription>,
  React.ComponentProps<typeof CardDescription>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn(
      'text-[var(--kinoshi-text)]/90 font-sans text-base font-medium',
      className
    )}
    {...props}
  />
))
KinoshiCardDescription.displayName = 'KinoshiCardDescription'

const KinoshiCardContent = React.forwardRef<
  React.ElementRef<typeof CardContent>,
  React.ComponentProps<typeof CardContent>
>(({ className, ...props }, ref) => (
  <CardContent
    ref={ref}
    className={cn('text-[var(--kinoshi-text)] font-sans', className)}
    {...props}
  />
))
KinoshiCardContent.displayName = 'KinoshiCardContent'

export {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardDescription,
  KinoshiCardContent,
}
