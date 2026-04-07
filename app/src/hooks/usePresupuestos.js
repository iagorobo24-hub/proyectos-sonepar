/**
 * Hook para Presupuestos - sincronización con Firestore
 */
import { useState, useEffect, useReducer } from 'react'
import useFirestoreSync from './useFirestoreSync'

const genNum = () => {
  const d = new Date()
  return `SNP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100)}`
}

function partidasReducer(state, action) {
  switch (action.type) {
    case "SET":
      return action.payload.map((p, i) => ({ ...p, _id: i }))
    case "UPDATE":
      return state.map(p => p._id === action.id ? { ...p, [action.field]: action.value, precio_total: action.field === "precio_unitario" ? action.value * p.cantidad : action.field === "cantidad" ? p.precio_unitario * action.value : p.precio_total } : p)
    case "ADD_ITEM":
      return [...state, { _id: state.length, ...action.payload }]
    case "ADD":
      return [...state, { _id: state.length, ref: "", desc: "", cantidad: 1, precio_unitario: 0, precio_total: 0, descuento: 0 }]
    case "DELETE":
      return state.filter(p => p._id !== action.id)
    case "RECALC":
      return state.map(p => ({ ...p, precio_total: p.cantidad * p.precio_unitario * (1 - p.descuento/100) }))
    default:
      return state
  }
}

export default function usePresupuestos() {
  const [categoria, setCategoria] = useState("")
  const [respuestas, setRespuestas] = useState({})
  const [recomendaciones, setRecomendaciones] = useState([])
  const [partidas, dispatchPartidas] = useReducer(partidasReducer, [])
  const [datosCliente, setDatosCliente] = useState({ nombre: "", cif: "", contacto: "", email: "", telefono: "", direccion: "", poblacion: "", cp: "", provincia: "", pais: "España", iva: 21, forma_pago: "Transferencia", plazo_entrega: "15 días", validez: "30 días" })
  const [vista, setVista] = useState("wizard")
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  /* Hook de Firestore para historial de presupuestos */
  const { 
    data: storedHistorial, 
    loading, 
    saveData: saveHistorial,
    syncStatus 
  } = useFirestoreSync('budgets', 'default', [], 'sonepar_presupuestos_historial')

  const [historial, setHistorial] = useState([])

  useEffect(() => {
    if (storedHistorial !== undefined && storedHistorial !== null) {
      setHistorial(storedHistorial)
    }
  }, [storedHistorial])

  const guardarHistorial = (presup) => {
    const nuevo = [presup, ...historial].slice(0, 20)
    setHistorial(nuevo)
    saveHistorial(nuevo)
  }

  const calcularTotales = () => {
    const base = partidas.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario * (1 - p.descuento/100)), 0)
    const iva = base * (datosCliente.iva / 100)
    const total = base + iva
    return { base, iva, total }
  }

  const guardarPresupuesto = () => {
    if (!datosCliente.nombre || partidas.length === 0) return null
    setGuardando(true)
    const presupuesto = {
      id: genNum(),
      fecha: new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric" }),
      cliente: datosCliente.nombre,
      categoria: categoria,
      partidas: partidas,
      totales: calcularTotales(),
      datos: datosCliente
    }
    guardarHistorial(presupuesto)
    setGuardando(false)
    return presupuesto
  }

  return {
    /* Estado */
    categoria, setCategoria,
    respuestas, setRespuestas,
    recomendaciones, setRecomendaciones,
    partidas, dispatchPartidas,
    datosCliente, setDatosCliente,
    vista, setVista,
    generando, setGenerando,
    guardando, setGuardando,
    historial,
    loading,
    syncStatus,
    /* Acciones */
    guardarHistorial,
    calcularTotales,
    guardarPresupuesto,
  }
}
