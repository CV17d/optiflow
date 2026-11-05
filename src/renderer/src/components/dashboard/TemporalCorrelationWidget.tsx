import React, { useMemo } from 'react'
import type { HistoricalEarRecord } from '../../hooks/useTelemetry'

export interface TemporalCorrelationWidgetProps {
  ear?: string
  distance?: string
  earHistory?: HistoricalEarRecord[]
}

export const TemporalCorrelationWidget: React.FC<TemporalCorrelationWidgetProps> = ({
  ear = '0.26',
  distance = '58.4 cm',
  earHistory = []
}) => {
  // Calcular promedio real de EAR a partir del historial persistido en SQLite
  const displayEar = useMemo(() => {
    if (earHistory && earHistory.length > 0) {
      const sum = earHistory.reduce((acc, curr) => acc + (curr.ear || 0), 0)
      return (sum / earHistory.length).toFixed(2)
    }
    return ear
  }, [earHistory, ear])

  // Generar dinámicamente el trazado SVG con base en la serie temporal de EAR
  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!earHistory || earHistory.length === 0) {
      return {
        linePath: 'M0 60 Q 80 60, 150 50 T 260 20 T 300 25',
        areaPath: 'M0 60 Q 80 60, 150 50 T 260 20 T 300 25 L 300 70 L 0 70 Z',
        lastPoint: { x: 275, y: 21 }
      }
    }

    const count = earHistory.length
    if (count === 1) {
      return {
        linePath: 'M 0 45 L 300 45',
        areaPath: 'M 0 45 L 300 45 L 300 70 L 0 70 Z',
        lastPoint: { x: 300, y: 45 }
      }
    }

    const earValues = earHistory.map((h) => h.ear)
    const minEar = Math.min(...earValues)
    const maxEar = Math.max(...earValues)
    const range = maxEar - minEar === 0 ? 0.1 : maxEar - minEar

    const points = earHistory.map((item, index) => {
      const x = (index / (count - 1)) * 300
      // A mayor apertura de ojo (EAR), más alto en el gráfico HUD (menor Y)
      const normalized = (item.ear - minEar) / range
      const y = 60 - normalized * 42
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
    })

    const line =
      `M ${points[0].x} ${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(' ')
    const area = `${line} L 300 70 L 0 70 Z`
    const last = points[points.length - 1]

    return {
      linePath: line,
      areaPath: area,
      lastPoint: last
    }
  }, [earHistory])

  return (
    <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-md h-full flex flex-col justify-between select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-white leading-tight">
            Correlación Temporal
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Fatiga vs Carga de Trabajo
          </p>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-white p-1 -mr-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Opciones"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Métricas: EAR Promedio Real y Distancia */}
      <div className="flex items-center gap-8 mt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            EAR PROM.
          </span>
          <span className="text-xl font-extrabold text-white mt-0.5">
            {displayEar}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            DISTANCIA
          </span>
          <span className="text-xl font-extrabold text-white mt-0.5">
            {distance}
          </span>
        </div>
      </div>

      {/* Gráfico de Tendencia con Curva Naranja Dinámica y Punto Final */}
      <div className="w-full mt-4 pt-2">
        <svg
          className="w-full h-20 overflow-visible"
          viewBox="0 0 300 70"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="orangeTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Relleno degradado dinámico */}
          <path d={areaPath} fill="url(#orangeTrendGradient)" />

          {/* Línea de tendencia dinámica */}
          <path
            d={linePath}
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Círculo indicador blanco con borde naranja al final de la curva */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="4.5"
            fill="#FFFFFF"
            stroke="#F97316"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>
  )
}

export default TemporalCorrelationWidget
