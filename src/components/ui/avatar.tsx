import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 40, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-muted text-foreground/70 overflow-hidden select-none',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    />
  ),
)
Avatar.displayName = 'Avatar'

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number
}

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, size = 40, alt, ...props }, ref) => (
    <img
      ref={ref}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      width={size}
      height={size}
      {...props}
    />
  ),
)
AvatarImage.displayName = 'AvatarImage'

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number
}

export const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center text-xs font-medium',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
)
AvatarFallback.displayName = 'AvatarFallback'
