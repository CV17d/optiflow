import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'

export interface LayoutProps {
  children?: React.ReactNode
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const location = useLocation()
  const isCompactView = location.pathname === '/' || location.pathname === '/calibracion'

  return (
    <div
      className={`h-screen w-full bg-[#F5F5F7] text-gray-900 flex flex-col font-sans antialiased overflow-hidden ${className}`}
    >
      <Header />
      <main
        className={
          isCompactView
            ? 'flex-1 overflow-y-auto px-8 pt-0 pb-6 flex flex-col min-h-0'
            : 'flex-1 overflow-y-auto p-8 pt-2 pb-16'
        }
      >
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default Layout
