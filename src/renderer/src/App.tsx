import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import Intercept from './components/dashboard/Intercept'
import AnalisisErgonomico from './views/AnalisisErgonomico'
import HistorialPausas from './views/HistorialPausas'
import CalibracionPrivacidad from './views/CalibracionPrivacidad'
import Configuracion from './views/Configuracion'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route path="/analisis" element={<AnalisisErgonomico />} />
        <Route path="/historial" element={<HistorialPausas />} />
        <Route path="/calibracion" element={<CalibracionPrivacidad />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/intercept" element={<Intercept />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
