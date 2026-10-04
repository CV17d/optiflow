import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-slate-100/60 p-6 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
