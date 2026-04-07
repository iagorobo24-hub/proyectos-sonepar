/**
 * Hook para DashboardIncidencias - sincronización con Firestore
 */
import { useState, useEffect } from 'react'
import useFirestoreSync from './useFirestoreSync'

const DEMOS = () => [
  { id: 1, equipo: "Variador ATV320 — Línea 3", zona: "Zona C — Picking", operario: "M. Fernández", sintoma: "El variador se dispara por sobrecalentamiento a los 20 minutos de arranque. Alarma F0028.", severidad: "Crítica", estado: "Abierta", fechaCreacion: Date.now() - 1800000, fechaResolucion: null, observaciones: "", diagnostico: null },
  { id: 2, equipo: "Contactor LC1D40 — Cuadro 7", zona: "Zona B — Almacén alto", operario: "A. López", sintoma: "La bobina no atrae al energizar. Se escucha un zumbido pero el contactor no cierra.", severidad: "Alta", estado: "En diagnóstico", fechaCreacion: Date.now() - 5400000, fechaResolucion: null, observaciones: "Medida tensión en bornes bobina: 218V AC. Parece correcta.", diagnostico: null },
]

export default function useDashboardIncidencias() {
  const [incidencias, setIncidencias] = useState([])
  const [filtroEstado, setFiltroEstado] = useState("Todas")
  const [filtroSev, setFiltroSev] = useState("Todas")
  const [seleccionada, setSeleccionada] = useState(null)
  const [modo, setModo] = useState("lista")
  const [form, setForm] = useState({ equipo: "", zona: "", operario: "", sintoma: "", severidad: "Media" })
  const [cargandoIA, setCargandoIA] = useState(false)
  const [ahora, setAhora] = useState(Date.now())

  /* Hook de Firestore para incidencias */
  const { 
    data: storedIncidencias, 
    loading, 
    saveData: saveIncidencias,
    syncStatus 
  } = useFirestoreSync('incidents', 'default', [], 'sonepar_incidencias')

  /* Cargar datos iniciales o usar demo */
  useEffect(() => {
    if (storedIncidencias !== undefined && storedIncidencias !== null) {
      setIncidencias(storedIncidencias.length > 0 ? storedIncidencias : DEMOS())
    } else if (!loading) {
      setIncidencias(DEMOS())
    }
  }, [storedIncidencias, loading])

  /* Actualizar timestamp cada 30s */
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const guardar = (data) => {
    setIncidencias(data)
    saveIncidencias(data)
  }

  const cambiarEstado = (id, nuevoEstado) => {
    const data = incidencias.map(i => 
      i.id === id 
        ? { ...i, estado: nuevoEstado, fechaResolucion: nuevoEstado === "Resuelta" ? Date.now() : i.fechaResolucion } 
        : i
    )
    guardar(data)
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id))
  }

  const guardarObservacion = (id, texto) => {
    const data = incidencias.map(i => i.id === id ? { ...i, observaciones: texto } : i)
    guardar(data)
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id))
  }

  const crearIncidencia = () => {
    const nueva = { 
      ...form, 
      id: Date.now(), 
      estado: "Abierta", 
      fechaCreacion: Date.now(),
      fechaResolucion: null, 
      observaciones: "", 
      diagnostico: null 
    }
    guardar([nueva, ...incidencias])
    setForm({ equipo: "", zona: "", operario: "", sintoma: "", severidad: "Media" })
    setModo("lista")
  }

  const generarDiagnostico = async (inc, apiCall) => {
    setCargandoIA(true)
    try {
      const diag = await apiCall(inc)
      const updated = incidencias.map(i => i.id === inc.id
        ? { ...i, diagnostico: diag, estado: i.estado === "Abierta" ? "En diagnóstico" : i.estado } 
        : i)
      guardar(updated)
      setSeleccionada(updated.find(i => i.id === inc.id))
    } catch (error) {
      console.error('Error generating diagnosis:', error)
    }
    setCargandoIA(false)
  }

  const formatTiempo = (ts) => {
    const min = Math.floor((ahora - ts) / 60000)
    if (min < 60) return `Hace ${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `Hace ${h}h`
    return `Hace ${Math.floor(h / 24)}d`
  }

  const kpis = {
    criticas: incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta").length,
    abiertas: incidencias.filter(i => i.estado === "Abierta").length,
    enDiag: incidencias.filter(i => i.estado === "En diagnóstico").length,
    resueltas: incidencias.filter(i => i.estado === "Resuelta").length,
  }

  const criticas = incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta" && (ahora - i.fechaCreacion) > 7200000)
  
  const filtradas = incidencias.filter(i => 
    (filtroEstado === "Todas" || i.estado === filtroEstado) &&
    (filtroSev === "Todas" || i.severidad === filtroSev)
  )

  return {
    /* Estado */
    incidencias,
    filtroEstado, setFiltroEstado,
    filtroSev, setFiltroSev,
    seleccionada, setSeleccionada,
    modo, setModo,
    form, setForm,
    cargandoIA,
    ahora,
    kpis,
    criticas,
    filtradas,
    loading,
    syncStatus,
    /* Acciones */
    guardar,
    cambiarEstado,
    guardarObservacion,
    crearIncidencia,
    generarDiagnostico,
    formatTiempo,
  }
}
