import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import LoginPage from './components/auth/LoginPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import FichasTecnicas from './tools/FichasTecnicas'
import SimuladorAlmacen from './tools/SimuladorAlmacen'
import DashboardIncidencias from './tools/DashboardIncidencias'
import KpiLogistico from './tools/KpiLogistico'
import Presupuestos from './tools/Presupuestos'
import FormacionInterna from './tools/FormacionInterna'
import Sonex from './tools/Sonex'
import useDocumentTitle from './hooks/useDocumentTitle'

/* Componentes wrapper con títulos dinámicos */
const FichasTecnicasPage    = () => { useDocumentTitle('Fichas Técnicas');    return <FichasTecnicas /> }
const SimuladorAlmacenPage  = () => { useDocumentTitle('Simulador Almacén');  return <SimuladorAlmacen /> }
const DashboardIncidenciasPage = () => { useDocumentTitle('Incidencias');     return <DashboardIncidencias /> }
const KpiLogisticoPage      = () => { useDocumentTitle('KPI Logístico');      return <KpiLogistico /> }
const PresupuestosPage      = () => { useDocumentTitle('Presupuestos');       return <Presupuestos /> }
const FormacionInternaPage  = () => { useDocumentTitle('Formación Interna');  return <FormacionInterna /> }
const SonexPage             = () => { useDocumentTitle('Sonex');              return <Sonex /> }

/* App — ruta pública /login + resto protegido con un solo ProtectedRoute */
export default function App() {
  return (
    <Routes>
      {/* Ruta pública de login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas: un solo ProtectedRoute envuelve todo el AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/fichas" replace />} />
        <Route path="fichas"       element={<FichasTecnicasPage />} />
        <Route path="almacen"      element={<SimuladorAlmacenPage />} />
        <Route path="incidencias"  element={<DashboardIncidenciasPage />} />
        <Route path="kpi"          element={<KpiLogisticoPage />} />
        <Route path="presupuestos" element={<PresupuestosPage />} />
        <Route path="formacion"    element={<FormacionInternaPage />} />
        <Route path="sonex"        element={<SonexPage />} />
      </Route>
    </Routes>
  )
}
