/**
 * Hook para KPI Logístico - sincronización con Firestore
 */
import { useState, useEffect } from 'react'
import useFirestoreSync from './useFirestoreSync'

export default function useKpiLogistico() {
  const [datos, setDatos] = useState({ delegacion: "", turno: "Mañana", pedidos: "", horas: "", errores: "", tiempo_ciclo: "", ubicaciones_ocupadas: "", ubicaciones_total: "", devoluciones: "", lineas_expedidas: "", operarios: "" })
  const [kpis, setKpis] = useState(null)
  const [informe, setInforme] = useState("")
  const [cargando, setCargando] = useState(false)
  const [tab, setTab] = useState("calculo")
  const [comparativa, setComparativa] = useState({ a: null, b: null })

  /* Hook de Firestore para historial de KPIs */
  const { 
    data: storedHistorial, 
    loading, 
    saveData: saveHistorial,
    syncStatus 
  } = useFirestoreSync('kpi/entries', 'default', [], 'sonepar_kpi_historial')

  const [historial, setHistorial] = useState([])

  useEffect(() => {
    if (storedHistorial !== undefined && storedHistorial !== null) {
      setHistorial(storedHistorial)
    }
  }, [storedHistorial])

  const guardarHistorial = (entrada) => {
    const nuevo = [entrada, ...historial].slice(0, 30)
    setHistorial(nuevo)
    saveHistorial(nuevo)
  }

  const calcularKPIs = () => {
    const d = datos
    if (!d.pedidos || !d.horas || !d.lineas_expedidas) return null
    return {
      pedidos_hora: parseFloat(d.pedidos) / parseFloat(d.horas),
      error_picking: (parseFloat(d.errores) / parseFloat(d.lineas_expedidas)) * 100,
      tiempo_ciclo: parseFloat(d.tiempo_ciclo),
      ocupacion: (parseFloat(d.ubicaciones_ocupadas) / parseFloat(d.ubicaciones_total)) * 100,
      devolucion: (parseFloat(d.devoluciones) / parseFloat(d.lineas_expedidas)) * 100,
      productividad: Math.min(100, (parseFloat(d.pedidos) / (parseFloat(d.operarios) * parseFloat(d.horas) * 2.5)) * 100),
    }
  }

  const calcular = async (apiCall) => {
    const k = calcularKPIs()
    if (!k) return null
    setKpis(k)
    setCargando(true)
    setInforme("")
    try {
      const inf = await apiCall(k, datos)
      setInforme(inf)
      guardarHistorial({ delegacion: datos.delegacion || "Delegación", turno: datos.turno, fecha: new Date().toISOString(), kpis: k, informe: inf })
    } catch (error) {
      console.error('Error generating report:', error)
    }
    setCargando(false)
    return k
  }

  return {
    /* Estado */
    datos, setDatos,
    kpis, setKpis,
    informe, setInforme,
    historial,
    cargando,
    tab, setTab,
    comparativa, setComparativa,
    loading,
    syncStatus,
    /* Acciones */
    calcularKPIs,
    calcular,
    guardarHistorial,
  }
}
