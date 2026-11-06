import React from 'react'
import { NavLink } from 'react-router-dom'
import Badge from '../ui/Badge'

export interface HeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  className?: string
}

const navTabs = [
  { name: 'Panel Principal', path: '/' },
  { name: 'Análisis Ergonómico', path: '/analisis' },
  { name: 'Historial y Pausas', path: '/historial' },
  { name: 'Calibración & Privacidad', path: '/calibracion' },
  { name: 'Configuración', path: '/configuracion' }
]

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`flex justify-between items-center w-full px-8 py-4 ${className}`}>
      {/* Izquierda: Logotipo */}
      <NavLink
        to="/"
        className="flex items-center gap-2 select-none hover:opacity-90 transition-opacity"
      >
        <div className="text-orange-500 flex items-center justify-center">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-900">
          OptiFlow<span className="text-orange-500">.</span>
        </span>
      </NavLink>

      {/* Centro: Barra de Navegación con NavLink y estados dinámicos */}
      <nav className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-sm border border-slate-200/60 flex items-center gap-1">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs rounded-full transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>

      {/* Derecha: Privacidad, Notificaciones y Avatar */}
      <div className="flex items-center gap-3">
        <Badge
          variant="success-outline"
          icon={
            <svg
              className="w-3.5 h-3.5 text-emerald-500"
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
          Procesamiento 100% Local (Privado)
        </Badge>

        {/* Botón Campana */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200/70 shadow-xs transition-colors cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Avatar Usuario */}
        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs select-none">
          JD
        </div>
      </div>
    </header>
  )
}

export default Header
