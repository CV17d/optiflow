import React, { useMemo } from 'react'
import type { HistoricalEarRecord } from '../../hooks/useTelemetry'

export interface TemporalCorrelationWidgetProps {
  ear?: string
  distance?: string
  earHistory?: HistoricalEarRecord[]
}

/**
 * Genera un path SVG con curvas cúbicas de Bézier continuas y suaves (Spline Catmull-Rom)
 * para eliminar picos rectos y suavizar la visualización de fatiga ocular.
 */
function generateBezierCurve(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    const cpX = (points[0].x + points[1].x) / 2
    return `M ${points[0].x} ${points[0].y} Q ${cpX} ${points[0].y}, ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[i] : points[i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i + 2 < points.length ? points[i + 2] : p2

    // Puntos de control Bézier con curvatura ergonómica
    const cp1x = p1.x + (p2.x - p0.x) / 5.5
    const cp1y = p1.y + (p2.y - p0.y) / 5.5
    const cp2x = p2.x - (p3.x - p1.x) / 5.5
    const cp2y = p2.y - (p3.y - p1.y) / 5.5

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return path
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

  // Generar trazado SVG suavizado con curvas de Bézier y relleno degradado
  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!earHistory || earHistory.length === 0) {
      const fallbackPoints = [
        { x: 0, y: 58 },
        { x: 70, y: 55 },
        { x: 140, y: 46 },
        { x: 210, y: 28 },
        { x: 265, y: 20 },
        { x: 300, y: 24 }
      ]
      const fallbackLine = generateBezierCurve(fallbackPoints)
      return {
        linePath: fallbackLine,
        areaPath: `${fallbackLine} L 300 70 L 0 70 Z`,
        lastPoint: { x: 265, y: 20 }
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
      // A mayor apertura ocular (EAR), mayor altura en el gráfico (menor Y)
      const normalized = (item.ear - minEar) / range
      const y = 58 - normalized * 40
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
    })

    const line = generateBezierCurve(points)
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

      {/* Gráfico de Tendencia con Curva Bézier Naranja y Relleno Degradado */}
      <div className="w-full mt-4 pt-2">
        <svg
          className="w-full h-20 overflow-visible"
          viewBox="0 0 300 70"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="orangeTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.5" />
              <stop offset="65%" stopColor="#F97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Relleno degradado Bézier suave */}
          <path d={areaPath} fill="url(#orangeTrendGradient)" />

          {/* Línea de tendencia suavizada continua */}
          <path
            d={linePath}
            stroke="#F97316"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Círculo indicador blanco con resplandor y borde naranja en el extremo */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="4.5"
            fill="#FFFFFF"
            stroke="#F97316"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]"
          />
        </svg>
      </div>
    </div>
  )
}

export default TemporalCorrelationWidget
