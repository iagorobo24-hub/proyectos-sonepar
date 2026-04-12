import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import LoginPage from './components/auth/LoginPage'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import useDocumentTitle from './hooks/useDocumentTitle'

/* Carga diferida (Code Splitting) para optimización Vercel */
const FichasTecnicas = lazy(() => import('./tools/FichasTecnicas'))
const SimuladorAlmacen = lazy(() => import('./tools/SimuladorAlmacen'))
const DashboardIncidencias = lazy(() => import('./tools/DashboardIncidencias'))
const KpiLogistico = lazy(() => import('./tools/KpiLogistico'))
const Presupuestos = lazy(() => import('./tools/Presupuestos'))
const FormacionInterna = lazy(() => import('./tools/FormacionInterna'))
const Sonex = lazy(() => import('./tools/Sonex'))

/* Componentes wrapper con títulos dinámicos */
const FichasTecnicasPage    = () => { useDocumentTitle('Fichas Técnicas');    return <FichasTecnicas /> }
const SimuladorAlmacenPage  = () => { useDocumentTitle('Simulador Almacén');  return <SimuladorAlmacen /> }
const DashboardIncidenciasPage = () => { useDocumentTitle('Incidencias');     return <DashboardIncidencias /> }
const KpiLogisticoPage      = () => { useDocumentTitle('KPI Logístico');      return <KpiLogistico /> }
const PresupuestosPage      = () => { useDocumentTitle('Presupuestos');       return <Presupuestos /> }
const FormacionInternaPage  = () => { useDocumentTitle('Formación Interna');  return <FormacionInterna /> }
const SonexPage             = () => { useDocumentTitle('SONEX — Asistente Técnico'); return <Sonex /> }

/* Placeholder de carga para Suspense */
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--blue-800)' }}>
    <div className="animate-pulse">Cargando herramienta...</div>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/sonex" replace />} />
        
        {/* Envolvemos las rutas en Suspense para manejar la carga diferida */}
        <Route path="*" element={
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="fichas"       element={<FichasTecnicasPage />} />
              <Route path="almacen"      element={<SimuladorAlmacenPage />} />
              <Route path="incidencias"  element={<DashboardIncidenciasPage />} />
              <Route path="kpi"          element={<KpiLogisticoPage />} />
              <Route path="presupuestos" element={<PresupuestosPage />} />
              <Route path="formacion"    element={<FormacionInternaPage />} />
              <Route path="sonex"        element={<SonexPage />} />
            </Routes>
          </Suspense>
        } />
      </Route>
    </Routes>
  )
}
