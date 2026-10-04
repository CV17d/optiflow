import React from 'react'

export interface TemporalCorrelationWidgetProps {
  ear?: string
  distance?: string
}

export const TemporalCorrelationWidget: React.FC<TemporalCorrelationWidgetProps> = ({
  ear = '0.26',
  distance = '58.4 cm'
}) => {
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

      {/* Métricas: EAR y Distancia */}
      <div className="flex items-center gap-8 mt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            EAR PROM.
          </span>
          <span className="text-xl font-extrabold text-white mt-0.5">
            {ear}
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

      {/* Gráfico de Tendencia con Curva Naranja y Punto Final */}
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

          {/* Relleno degradado */}
          <path
            d="M0 60 Q 80 60, 150 50 T 260 20 T 300 25 L 300 70 L 0 70 Z"
            fill="url(#orangeTrendGradient)"
          />

          {/* Línea de tendencia */}
          <path
            d="M0 60 Q 80 60, 150 50 T 260 20 T 300 25"
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Círculo indicador blanco con borde naranja al final */}
          <circle
            cx="275"
            cy="21"
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
