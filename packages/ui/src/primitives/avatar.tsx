import * as React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'

export type AvatarSize = 'sm' | 'default' | 'md' | 'lg'

export type AvatarProps = {
  name?: string
  src?: string
  alt?: string
  size?: AvatarSize
  className?: string
  children?: React.ReactNode
}

export type AvatarStackProps = {
  children: React.ReactNode
  max?: number
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm:      'size-6 text-[9px] font-semibold',  // 24px — tiny initials, DS exception same as notification badge
  default: 'size-8 text-xs font-semibold',     // 32px
  md:      'size-10 text-sm font-semibold',    // 40px
  lg:      'size-20 text-2xl font-semibold',   // 80px
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, src, alt, size = 'default', className, children }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background',
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        children ?? (name ? getInitials(name) : null)
      )}
    </span>
  )
}

export function AvatarStack({ children, max = 4, size = 'default', className }: AvatarStackProps) {
  const items = React.Children.toArray(children)
  const visible = items.slice(0, max)
  const overflow = items.length - max

  return (
    <div className={cn('flex items-center [&>*:not(:first-child)]:-ml-2', className)}>
      {visible}
      {overflow > 0 && (
        <Avatar size={size} className="-ml-2">
          +{overflow}
        </Avatar>
      )}
    </div>
  )
}
