/**
 * Hook para Formación Interna - sincronización con Firestore
 */
import { useState, useEffect } from 'react'
import useFirestoreSync from './useFirestoreSync'

const MODULOS_INIT = [
  { id: "m1", nombre: "Recepción de mercancía", area: "Almacén", horas: 4, obligatorio: true },
  { id: "m2", nombre: "Gestión de ubicaciones WMS", area: "Almacén", horas: 6, obligatorio: true },
  { id: "m3", nombre: "Proceso de picking", area: "Almacén", horas: 5, obligatorio: true },
  { id: "m4", nombre: "Expedición y embalaje", area: "Almacén", horas: 3, obligatorio: true },
  { id: "m5", nombre: "Atención al cliente B2B", area: "Comercial", horas: 8, obligatorio: false },
  { id: "m6", nombre: "Catálogo eléctrico industrial", area: "Técnico", horas: 12, obligatorio: false },
  { id: "m7", nombre: "PRL — Almacén logístico", area: "Seguridad", horas: 8, obligatorio: true },
]

export default function useFormacionInterna() {
  const [empleados, setEmpleados] = useState([])
  const [modulos, setModulos] = useState([])
  const [progresos, setProgresos] = useState({})
  const [fechasCompletado, setFechasCompletado] = useState({})
  const [seleccionado, setSeleccionado] = useState(null)
  const [vista, setVista] = useState("dashboard")
  const [planIA, setPlanIA] = useState("")
  const [cargandoIA, setCargandoIA] = useState(false)

  /* Hooks de Firestore para formación */
  const { data: storedEmpleados, saveData: saveEmpleados } = useFirestoreSync('training', 'employees', [], 'sonepar_formacion_empleados')
  const { data: storedModulos, saveData: saveModulos } = useFirestoreSync('training', 'modules', [], 'sonepar_formacion_modulos')
  const { data: storedProgresos, saveData: saveProgresos } = useFirestoreSync('training', 'progress', {}, 'sonepar_formacion_progresos')
  const { data: storedFechas, saveData: saveFechas } = useFirestoreSync('training', 'dates', {}, 'sonepar_formacion_fechas')

  useEffect(() => {
    if (storedEmpleados?.length > 0) setEmpleados(storedEmpleados)
    if (storedModulos?.length > 0) setModulos(storedModulos)
    else setModulos(MODULOS_INIT)
    if (storedProgresos) setProgresos(storedProgresos)
    if (storedFechas) setFechasCompletado(storedFechas)
  }, [storedEmpleados, storedModulos, storedProgresos, storedFechas])

  const guardar = (emps, mods, prgs, fecs) => {
    saveEmpleados(emps)
    saveModulos(mods)
    saveProgresos(prgs)
    saveFechas(fecs)
  }

  const cambiarProgreso = (empId, modId, nuevoEstado) => {
    const nuevosProgresos = { ...progresos, [empId]: { ...progresos[empId], [modId]: nuevoEstado } }
    const nuevasFechas = { ...fechasCompletado }
    if (nuevoEstado === "completado") {
      if (!nuevasFechas[empId]) nuevasFechas[empId] = {}
      nuevasFechas[empId][modId] = Date.now()
    } else {
      if (nuevasFechas[empId]) delete nuevasFechas[empId][modId]
    }
    setProgresos(nuevosProgresos)
    setFechasCompletado(nuevasFechas)
    guardar(empleados, modulos, nuevosProgresos, nuevasFechas)
  }

  return {
    empleados, setEmpleados,
    modulos, setModulos,
    progresos, setProgresos,
    fechasCompletado, setFechasCompletado,
    seleccionado, setSeleccionado,
    vista, setVista,
    planIA, setPlanIA,
    cargandoIA, setCargandoIA,
    cambiarProgreso,
    guardar,
  }
}
