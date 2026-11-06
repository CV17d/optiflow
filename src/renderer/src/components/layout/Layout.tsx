import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

export interface LayoutProps {
  children?: React.ReactNode
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`h-screen w-full bg-[#F5F5F7] text-gray-900 flex flex-col font-sans antialiased overflow-hidden ${className}`}
    >
      <Header />
      <main className="flex-1 overflow-y-auto p-8 pt-2 pb-16">
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default Layout
