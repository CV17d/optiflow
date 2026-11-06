import React from 'react'
import EyeRender3D from './EyeRender3D'

export interface EyeBiometricsWidgetProps {
  ear?: number
  trackingPoints?: number
}

export const EyeBiometricsWidget: React.FC<EyeBiometricsWidgetProps> = ({
  ear = 0.28,
  trackingPoints = 468
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none py-0">
      {/* Contenedor circular con borde y resplandor turquesa */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.15)] flex items-center justify-center bg-teal-500/[0.02] overflow-hidden">
        {/* Render 3D del Ojo interactivo mediante React Three Fiber */}
        <div className="absolute inset-0 z-0">
          <EyeRender3D ear={ear} />
        </div>

        {/* Retícula Cyan (HUD) superpuesta encima del Canvas */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          {/* Anillos concéntricos de retícula HUD */}
          <div className="absolute inset-3 rounded-full border border-teal-400/25 border-dashed animate-[spin_40s_linear_infinite]" />
          <div className="absolute inset-6 rounded-full border border-teal-400/35" />
          <div className="absolute inset-12 rounded-full border border-teal-400/20 border-dotted" />

          {/* Ejes de mira biométrica */}
          <div className="absolute inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
          <div className="absolute inset-y-2 w-[1px] bg-gradient-to-b from-transparent via-teal-400/50 to-transparent" />

          {/* Caja de escaneo central HUD con esquinas reforzadas */}
          <div className="absolute w-24 h-24 border border-teal-400/40 rounded-xl">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-teal-300" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-teal-300" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-teal-300" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-teal-300" />
          </div>

          {/* Punto de fijación ocular central */}
          <div className="w-3.5 h-3.5 rounded-full border border-teal-300/80 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-teal-300 animate-ping opacity-80" />
          </div>
        </div>
      </div>

      {/* Etiqueta de Telemetría Biometría en Vivo conectada con el socket */}
      <div className="mt-2 flex flex-col items-center gap-1 z-10">
        <span className="text-[9px] text-teal-700 tracking-wider font-mono uppercase bg-teal-100/70 border border-teal-300/50 px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
          TRACKING {trackingPoints} PTS • EAR {typeof ear === 'number' ? ear.toFixed(2) : ear}
        </span>
      </div>
    </div>
  )
}

export default EyeBiometricsWidget
