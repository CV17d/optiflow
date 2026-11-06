import React, { useMemo } from 'react'
import Card from '../ui/Card'

export interface VisualHealthIndexWidgetProps {
  fatigueLevel?: number
  averageFatigue?: number
  status?: string
  degradation?: string
  score?: number
}

export const VisualHealthIndexWidget: React.FC<VisualHealthIndexWidgetProps> = ({
  fatigueLevel,
  averageFatigue,
  status,
  degradation,
  score
}) => {
  // Score Ergonómico (0 a 100) basado en la fórmula reactiva: Math.round(100 - fatigueLevel)
  const effectiveFatigue =
    typeof fatigueLevel === 'number' && !isNaN(fatigueLevel)
      ? fatigueLevel
      : typeof averageFatigue === 'number' && !isNaN(averageFatigue)
        ? averageFatigue
        : typeof score === 'number'
          ? 100 - score
          : 18

  const healthScore = useMemo(() => {
    return Math.max(0, Math.min(100, Math.round(100 - effectiveFatigue)))
  }, [effectiveFatigue])

  // Estado descriptivo de salud visual dinámico: Excelente, Bueno, Alerta
  const calculatedStatus = useMemo(() => {
    if (status) return status
    if (healthScore >= 80) return 'Excelente'
    if (healthScore >= 50) return 'Bueno'
    return 'Alerta'
  }, [healthScore, status])

  // Nivel de degradación ocular dinámico: Baja, Media, Alta
  const calculatedDegradation = useMemo(() => {
    if (degradation) return degradation
    if (healthScore >= 80) return 'Baja'
    if (healthScore >= 50) return 'Media'
    return 'Alta'
  }, [healthScore, degradation])

  // Cálculo del arco de velocímetro (240 grados de barrido: de 150° a 390°)
  // Radio 38, circunferencia completa = 2 * PI * 38 = 238.76. Longitud de arco 240° = 159.17
  const arcLength = 159.17
  const progressOffset = Math.max(0, Math.min(arcLength, (healthScore / 100) * arcLength))

  // Color de acento según estado de alerta
  const statusColorClass =
    healthScore >= 80
      ? 'text-emerald-700'
      : healthScore >= 50
        ? 'text-slate-800'
        : 'text-amber-600'

  const degradationColorClass =
    healthScore >= 80
      ? 'text-slate-800'
      : healthScore >= 50
        ? 'text-amber-600'
        : 'text-rose-600'

  return (
    <Card className="p-5 flex flex-col justify-between select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
            Índice de Salud Visual
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Score Ergonómico</p>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Opciones"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Contenido: Bloques de estado dinámico y Medidor de Velocímetro (Arco de 240°) */}
      <div className="flex justify-between items-center mt-3">
        {/* Bloque Izquierdo Reactivo */}
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            ESTADO
          </span>
          <span className={`text-lg sm:text-xl lg:text-2xl font-black mt-0.5 ${statusColorClass}`}>
            {calculatedStatus}
          </span>

          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-3">
            DEGRADACIÓN
          </span>
          <span className={`text-base sm:text-lg lg:text-xl font-bold mt-0.5 ${degradationColorClass}`}>
            {calculatedDegradation}
          </span>
        </div>

        {/* Medidor de Arco tipo Velocímetro HUD (240°) */}
        <div className="relative w-28 h-24 sm:w-32 sm:h-28 flex items-center justify-center">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 104 94"
            fill="none"
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>

            {/* Pista de fondo punteada del velocímetro */}
            <path
              d="M 19.1 71.0 A 38 38 0 1 1 84.9 71.0"
              stroke="#FED7AA"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="4 6"
              className="opacity-75"
            />

            {/* Arco de progreso activo suavizado */}
            <path
              d="M 19.1 71.0 A 38 38 0 1 1 84.9 71.0"
              stroke="url(#gaugeGradient)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeDasharray={`${progressOffset.toFixed(1)} 200`}
              className="transition-all duration-700 ease-out filter drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"
            />
          </svg>

          {/* Lectura Central de Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-3.5 pointer-events-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              HEALTH SCORE
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 leading-none font-mono">
              {healthScore}
              <span className="text-xs font-semibold text-slate-400 ml-0.5">/100</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default VisualHealthIndexWidget
