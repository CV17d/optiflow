import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Badge from '../ui/Badge'
import Logo from './Logo'
import { useTheme } from '../../context/ThemeContext'

export interface HeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  className?: string
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const navTabs = [
    { name: t('nav.dashboard', 'Panel Principal'), path: '/' },
    { name: t('nav.ergonomics', 'Análisis Ergonómico'), path: '/analisis' },
    { name: t('nav.history', 'Historial y Pausas'), path: '/historial' },
    { name: t('nav.calibration', 'Calibración & Privacidad'), path: '/calibracion' },
    { name: t('nav.settings', 'Configuración'), path: '/configuracion' }
  ]

  return (
    <header className={`h-20 flex justify-between items-center w-full px-8 py-5 shrink-0 z-10 ${className}`}>
      {/* Izquierda: Logotipo Oficial */}
      <NavLink
        to="/"
        className="flex items-center select-none hover:opacity-90 transition-opacity"
      >
        <Logo size="lg" isotypeClassName="w-11 h-11" variant={theme === 'dark' ? 'dark' : 'light'} />
      </NavLink>

      {/* Centro: Barra de Navegación con NavLink y estados dinámicos */}
      <nav className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-full px-3 py-2 shadow-sm border border-slate-200/70 dark:border-slate-800 flex items-center gap-1.5 transition-colors duration-200">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `px-5 py-2 text-sm sm:text-base rounded-full transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>

      {/* Derecha: Privacidad 100% Local */}
      <div className="flex items-center justify-end">
        <Badge
          variant="success-outline"
          className="px-4 py-1.5 text-xs sm:text-sm font-semibold dark:bg-slate-900 dark:border-emerald-500/40 dark:text-slate-200"
          icon={
            <svg
              className="w-4 h-4 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        >
          {t('nav.local_processing', 'Procesamiento 100% Local (Privado)')}
        </Badge>
      </div>
    </header>
  )
}

export default Header
