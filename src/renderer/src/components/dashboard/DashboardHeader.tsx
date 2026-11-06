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
  const handleTriggerBreak = (): void => {
    // Si se pasa callback externo, ejecutarlo
    if (onTriggerBreak) {
      onTriggerBreak()
      return
    }

    // Disparar bloqueo Kiosk de Pausa Activa vía IPC hacia el Main Process de Electron
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('trigger-break')
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('OptiFlow • Pausa Activa Ergonómica', {
        body: '¡Momento de descansar la vista! Mira a 6 metros por 20 segundos.'
      })
    }
  }

  return (
    <div className="flex flex-col select-none">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-1">
        Salud Ocular
      </h1>
      <p className="text-sm sm:text-base font-medium text-gray-500 mb-4">
        Control Biométrico de Fatiga y Enfoque
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="primary"
          className="px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm"
          onClick={handleTriggerBreak}
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
          className="px-4 py-2 text-xs sm:text-sm font-semibold"
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
              {isMonitoring ? (
                <>
                  <line x1="10" y1="15" x2="10" y2="9" />
                  <line x1="14" y1="15" x2="14" y2="9" />
                </>
              ) : (
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              )}
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
export { Header as NavHeader } from '../layout/Header'
