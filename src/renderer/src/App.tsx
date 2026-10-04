import React from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'

function App(): React.JSX.Element {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

export default App
