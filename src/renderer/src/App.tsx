import React from 'react'
import Layout from './components/layout/Layout'

function App(): React.JSX.Element {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard en construcción
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Estructura base de OptiFlow integrada con éxito
        </p>
      </div>
    </Layout>
  )
}

export default App
