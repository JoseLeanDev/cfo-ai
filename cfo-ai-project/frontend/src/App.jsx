import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/dashboard/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Tesoreria from './pages/Tesoreria'
import Contabilidad from './pages/Contabilidad'
import Analisis from './pages/Analisis'
import SAT from './pages/SAT'

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tesoreria" element={<Tesoreria />} />
        <Route path="/contabilidad" element={<Contabilidad />} />
        <Route path="/analisis" element={<Analisis />} />
        <Route path="/sat" element={<SAT />} />
      </Routes>
    </DashboardLayout>
  )
}

export default App
