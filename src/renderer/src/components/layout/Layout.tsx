import React from 'react'
import Header from './Header'

export interface LayoutProps {
  children: React.ReactNode
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen w-full bg-[#F5F5F7] text-gray-900 flex flex-col font-sans antialiased ${className}`}>
      <Header />
      <main className="flex-1 p-8 pt-2">
        {children}
      </main>
    </div>
  )
}

export default Layout
