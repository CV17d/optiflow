import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-6 transition-all duration-300 hover:shadow-[0_12px_36px_rgb(0,0,0,0.06)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
