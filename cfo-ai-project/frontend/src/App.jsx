import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/dashboard/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Tesoreria from './pages/Tesoreria'
import Contabilidad from './pages/Contabilidad'
import Analisis from './pages/Analisis'
import SAT from './pages/SAT'
import LogActividades from './pages/LogActividades'
// Páginas secundarias
import LibroDiario from './pages/LibroDiario'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import CuentasPorPagar from './pages/CuentasPorPagar'
import CuentasBancarias from './pages/CuentasBancarias'
import ProyeccionesFinancieras from './pages/ProyeccionesFinancieras'
// Cierre Mensual
import CierreDashboard from './pages/CierreDashboard'
import CierreWizard from './pages/CierreWizard'
import ConciliacionBancaria from './pages/ConciliacionBancaria'

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tesoreria" element={<Tesoreria />} />
        <Route path="/contabilidad" element={<Contabilidad />} />
        <Route path="/analisis" element={<Analisis />} />
        <Route path="/sat" element={<SAT />} />
        <Route path="/log-actividades" element={<LogActividades />} />
        {/* Páginas secundarias */}
        <Route path="/contabilidad/libro-diario" element={<LibroDiario />} />
        <Route path="/tesoreria/cuentas-por-cobrar" element={<CuentasPorCobrar />} />
        <Route path="/tesoreria/cuentas-por-pagar" element={<CuentasPorPagar />} />
        <Route path="/tesoreria/cuentas-bancarias" element={<CuentasBancarias />} />
        <Route path="/tesoreria/proyecciones" element={<ProyeccionesFinancieras />} />
        {/* Cierre Mensual */}
        <Route path="/contabilidad/cierre" element={<CierreDashboard />} />
        <Route path="/contabilidad/cierre/:anio/:mes" element={<CierreWizard />} />
        <Route path="/contabilidad/conciliacion/:cuentaId/:anio/:mes" element={<ConciliacionBancaria />} />
      </Routes>
    </DashboardLayout>
  )
}

export default App