import React from 'react'

export const EyeBiometricsWidget: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] relative select-none py-4">
      {/* Contenedor circular con borde y resplandor turquesa */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-teal-500/30 shadow-[0_0_40px_rgba(20,184,166,0.15)] flex items-center justify-center bg-teal-500/[0.02]">
        {/* Anillos concéntricos de retícula HUD */}
        <div className="absolute inset-3 rounded-full border border-teal-400/20 border-dashed animate-[spin_40s_linear_infinite]" />
        <div className="absolute inset-8 rounded-full border border-teal-400/30" />

        {/* Ejes de retícula biométrica */}
        <div className="absolute inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
        <div className="absolute inset-y-2 w-[1px] bg-gradient-to-b from-transparent via-teal-400/40 to-transparent" />

        {/* Caja de escaneo central */}
        <div className="absolute w-28 h-28 border border-teal-400/50 rounded-lg pointer-events-none" />

        {/* Pupila/Iris y Etiqueta central */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-b from-teal-500/10 to-teal-500/25 border border-teal-400/60 flex items-center justify-center shadow-inner">
            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-teal-400 flex items-center justify-center relative shadow-md">
              <div className="w-3 h-3 rounded-full bg-teal-300 animate-ping absolute opacity-75" />
              <div className="w-2.5 h-2.5 rounded-full bg-teal-200" />
            </div>
          </div>
          <span className="mt-3 text-xs font-semibold tracking-wider text-teal-800 uppercase bg-teal-100/70 border border-teal-200 px-3 py-1 rounded-full">
            [Render 3D del Ojo]
          </span>
          <span className="text-[10px] text-teal-600 font-mono mt-1 font-medium">
            TRACKING 468 PTS • EAR 0.28
          </span>
        </div>
      </div>
    </div>
  )
}

export default EyeBiometricsWidget
