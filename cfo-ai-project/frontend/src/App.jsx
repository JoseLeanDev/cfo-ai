import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/shell/AppShell'
import { QoraMark } from './components/brand/QoraLogo'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import HistorialVentas from './pages/HistorialVentas'
import Margenes from './pages/Margenes'
import Produccion from './pages/Produccion'
import Compras from './pages/Compras'
import GastosOperativos from './pages/GastosOperativos'
import Tesoreria from './pages/Tesoreria'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import CuentasPorPagar from './pages/CuentasPorPagar'
import CuentasBancarias from './pages/CuentasBancarias'
import ProyeccionesFinancieras from './pages/ProyeccionesFinancieras'
import Contabilidad from './pages/Contabilidad'
import LibroDiario from './pages/LibroDiario'
import CierreDashboard from './pages/CierreDashboard'
import CierreWizard from './pages/CierreWizard'
import SAT from './pages/SAT'
import InsightsIA from './pages/InsightsIA'
import Reportes from './pages/Reportes'
import LogActividades from './pages/LogActividades'
import Asistente from './pages/Asistente'
import Usuarios from './pages/Usuarios'

function Cargando() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <QoraMark className="mx-auto h-6 w-6 animate-qora-pulse text-ink" />
        <p className="eyebrow mt-4">Verificando sesión</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Cargando />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />

                {/* Operación */}
                <Route path="/ventas" element={<Ventas />} />
                <Route path="/compras/historial-ventas" element={<HistorialVentas />} />
                <Route path="/margenes" element={<Margenes />} />
                <Route path="/produccion" element={<Produccion />} />
                <Route path="/compras" element={<Compras />} />
                <Route path="/gastos-operativos" element={<GastosOperativos />} />

                {/* Tesorería */}
                <Route path="/tesoreria" element={<Tesoreria />} />
                <Route path="/tesoreria/cuentas-por-cobrar" element={<CuentasPorCobrar />} />
                <Route path="/tesoreria/cuentas-por-pagar" element={<CuentasPorPagar />} />
                <Route path="/tesoreria/cuentas-bancarias" element={<CuentasBancarias />} />
                <Route path="/tesoreria/proyecciones" element={<ProyeccionesFinancieras />} />

                {/* Registro */}
                <Route path="/contabilidad" element={<Contabilidad />} />
                <Route path="/contabilidad/libro-diario" element={<LibroDiario />} />
                <Route path="/contabilidad/cierre" element={<CierreDashboard />} />
                <Route path="/contabilidad/cierre/nuevo" element={<CierreWizard />} />
                <Route path="/sat" element={<SAT />} />

                {/* Inteligencia */}
                <Route path="/insights" element={<InsightsIA />} />
                <Route path="/analisis" element={<Navigate to="/insights" replace />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/asistente" element={<Asistente />} />
                <Route path="/agentes" element={<LogActividades />} />

                {/* Administración */}
                <Route path="/usuarios" element={<Usuarios />} />

                {/* Rutas del diseño anterior que se conservan como redirección
                    para no romper enlaces guardados. */}
                <Route path="/log-actividades" element={<Navigate to="/agentes" replace />} />
                <Route path="/margen-productos" element={<Navigate to="/margenes" replace />} />
                <Route path="/libro-diario" element={<Navigate to="/contabilidad/libro-diario" replace />} />
                <Route path="/cierre" element={<Navigate to="/contabilidad/cierre" replace />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
