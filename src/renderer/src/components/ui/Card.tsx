import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-slate-100/80 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-[0_12px_36px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_12px_36px_rgb(0,0,0,0.35)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
