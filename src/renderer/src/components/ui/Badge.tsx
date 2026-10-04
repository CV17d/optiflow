import React from 'react'

export type BadgeVariant = 'success-outline' | 'warning-text' | 'solid-orange'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'success-outline',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold select-none transition-colors duration-150'

  const variantStyles: Record<BadgeVariant, string> = {
    'success-outline':
      'bg-white text-slate-700 border border-emerald-400 px-3 py-1 shadow-xs',
    'warning-text':
      'bg-transparent text-orange-500 uppercase tracking-wider p-0',
    'solid-orange':
      'bg-orange-500 text-white px-3.5 py-1 shadow-sm shadow-orange-500/30 uppercase tracking-wider'
  }

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && (
        <span className="inline-flex shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}

export default Badge
