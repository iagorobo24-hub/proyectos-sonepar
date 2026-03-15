import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import FichasTecnicas from './tools/FichasTecnicas'
import SimuladorAlmacen from './tools/SimuladorAlmacen'
import DashboardIncidencias from './tools/DashboardIncidencias'
import KpiLogistico from './tools/KpiLogistico'
import Presupuestos from './tools/Presupuestos'
import FormacionInterna from './tools/FormacionInterna'
import Sonex from './tools/Sonex'
import UITest from './pages/UITest'

/* App — define las 7 rutas de la suite dentro del AppShell compartido */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* Redirige la raíz a /fichas por defecto */}
        <Route index element={<Navigate to="/fichas" replace />} />
        <Route path="fichas"       element={<FichasTecnicas />} />
        <Route path="almacen"      element={<SimuladorAlmacen />} />
        <Route path="incidencias"  element={<DashboardIncidencias />} />
        <Route path="kpi"          element={<KpiLogistico />} />
        <Route path="presupuestos" element={<Presupuestos />} />
        <Route path="formacion"    element={<FormacionInterna />} />
        <Route path="sonex"        element={<Sonex />} />
        <Route path="uitest"       element={<UITest />} />
      </Route>
    </Routes>
  )
}
