import React from 'react'

export type ButtonVariant = 'primary' | 'outline'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/25 border border-transparent focus:ring-orange-400',
    outline:
      'bg-transparent hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-200 shadow-xs focus:ring-gray-300'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && (
        <span className="inline-flex items-center justify-center shrink-0 text-current">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  )
}

export default Button
