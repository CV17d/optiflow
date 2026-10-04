import React from 'react'
import Button from '../ui/Button'

export interface DashboardHeaderProps {
  onTriggerBreak?: () => void
  onToggleMonitoring?: () => void
  isMonitoring?: boolean
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onTriggerBreak,
  onToggleMonitoring,
  isMonitoring = true
}) => {
  return (
    <div className="flex flex-col select-none">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
        Salud Ocular
      </h1>
      <p className="text-sm font-medium text-gray-500 mb-6">
        Control Biométrico de Fatiga y Enfoque
      </p>

      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="primary"
          onClick={onTriggerBreak}
          icon={
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        >
          Probar Pausa Activa
        </Button>

        <Button
          variant="outline"
          onClick={onToggleMonitoring}
          icon={
            <svg
              className="w-4 h-4 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="10" y1="15" x2="10" y2="9" />
              <line x1="14" y1="15" x2="14" y2="9" />
            </svg>
          }
        >
          {isMonitoring ? 'Pausar Monitoreo' : 'Reanudar Monitoreo'}
        </Button>
      </div>
    </div>
  )
}

export default DashboardHeader
