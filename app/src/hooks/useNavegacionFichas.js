/**
 * Hook para navegación jerárquica de Fichas Técnicas
 * Flujo: Categoría → Marca → Gama → Tipo → Referencia → Ficha
 */

import { useState, useCallback, useMemo } from 'react'
import {
  CATALOGO_PLANO,
  MARCAS,
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getReferenciasPorGama,
  getReferencia,
} from '../data/catalogoSonepar'

const CATEGORIAS = [
  { id: 'Variadores', label: 'Variadores', icon: '⚡', color: '#f59e0b' },
  { id: 'Contactores', label: 'Contactores', icon: '🔌', color: '#3b82f6' },
  { id: 'Guardamotores', label: 'Guardamotores', icon: '🛡️', color: '#10b981' },
  { id: 'PLCs', label: 'PLCs', icon: '📊', color: '#8b5cf6' },
  { id: 'Sensores', label: 'Sensores', icon: '📡', color: '#06b6d4' },
  { id: 'Protección', label: 'Protección', icon: '⚙️', color: '#ef4444' },
  { id: 'Iluminación', label: 'Iluminación', icon: '💡', color: '#f97316' },
  { id: 'VE', label: 'Vehículo Eléctrico', icon: '🚗', color: '#22c55e' },
  { id: 'Solar', label: 'Energía Solar', icon: '☀️', color: '#eab308' },
  { id: 'Reles', label: 'Relés', icon: '🔄', color: '#ec4899' },
]

export default function useNavegacionFichas() {
  /* Estado de navegación */
  const [paso, setPaso] = useState('categorias') // categorias | marcas | gamas | tipos | referencias | ficha
  const [categoria, setCategoria] = useState(null)
  const [marca, setMarca] = useState(null)
  const [gama, setGama] = useState(null)
  const [tipo, setTipo] = useState(null)
  const [referencia, setReferencia] = useState(null)

  /* Historial de navegación para botón "Volver" */
  const [historial, setHistorial] = useState([])

  /* ── Datos para cada paso ── */
  const marcasDisponibles = useMemo(() => {
    if (!categoria) return []
    return getMarcasPorCategoria(categoria)
  }, [categoria])

  const gamasDisponibles = useMemo(() => {
    if (!categoria || !marca) return []
    return getGamasPorMarcaYCategoria(categoria, marca)
  }, [categoria, marca])

  const tiposDisponibles = useMemo(() => {
    if (!categoria || !marca || !gama) return []
    return [...new Set(
      getReferenciasPorGama(categoria, marca, gama).map(p => p.tipo)
    )]
  }, [categoria, marca, gama])

  const referenciasDisponibles = useMemo(() => {
    if (!categoria || !marca || !gama) return []
    const refs = getReferenciasPorGama(categoria, marca, gama)
    if (tipo) {
      return refs.filter(p => p.tipo === tipo)
    }
    return refs
  }, [categoria, marca, gama, tipo])

  /* ── Navegación hacia adelante ── */
  const seleccionarCategoria = useCallback((catId) => {
    setCategoria(catId)
    setPaso('marcas')
    setHistorial(prev => [...prev, { paso: 'categorias' }])
  }, [])

  const seleccionarMarca = useCallback((marcaNombre) => {
    setMarca(marcaNombre)
    setPaso('gamas')
    setHistorial(prev => [...prev, { paso: 'marcas' }])
  }, [])

  const seleccionarGama = useCallback((gamaNombre) => {
    setGama(gamaNombre)
    setPaso('tipos')
    setHistorial(prev => [...prev, { paso: 'gamas' }])
  }, [])

  const seleccionarTipo = useCallback((tipoNombre) => {
    setTipo(tipoNombre)
    setPaso('referencias')
    setHistorial(prev => [...prev, { paso: 'tipos' }])
  }, [])

  const seleccionarReferencia = useCallback((ref) => {
    const ficha = getReferencia(ref)
    setReferencia(ficha)
    setPaso('ficha')
    setHistorial(prev => [...prev, { paso: 'referencias' }])
  }, [])

  /* ── Navegación hacia atrás ── */
  const volver = useCallback(() => {
    const nuevoHistorial = [...historial]
    const anterior = nuevoHistorial.pop()

    if (!anterior) {
      // No hay historial, volver a categorías
      setPaso('categorias')
      setCategoria(null)
      setMarca(null)
      setGama(null)
      setTipo(null)
      setReferencia(null)
      return
    }

    switch (anterior.paso) {
      case 'categorias':
        setPaso('categorias')
        setCategoria(null)
        setMarca(null)
        setGama(null)
        setTipo(null)
        setReferencia(null)
        break
      case 'marcas':
        setPaso('categorias')
        setMarca(null)
        setGama(null)
        setTipo(null)
        setReferencia(null)
        break
      case 'gamas':
        setPaso('marcas')
        setGama(null)
        setTipo(null)
        setReferencia(null)
        break
      case 'tipos':
        setPaso('gamas')
        setTipo(null)
        setReferencia(null)
        break
      case 'referencias':
        setPaso('tipos')
        setReferencia(null)
        break
      default:
        setPaso('categorias')
        setCategoria(null)
        setMarca(null)
        setGama(null)
        setTipo(null)
        setReferencia(null)
    }

    setHistorial(nuevoHistorial)
  }, [historial])

  /* ── Volver al inicio completo ── */
  const reiniciar = useCallback(() => {
    setPaso('categorias')
    setCategoria(null)
    setMarca(null)
    setGama(null)
    setTipo(null)
    setReferencia(null)
    setHistorial([])
  }, [])

  /* ── Breadcrumb visual ── */
  const breadcrumb = useMemo(() => {
    const parts = []
    if (categoria) parts.push(CATEGORIAS.find(c => c.id === categoria)?.label || categoria)
    if (marca) parts.push(marca)
    if (gama) parts.push(gama)
    if (tipo) parts.push(tipo)
    return parts
  }, [categoria, marca, gama, tipo])

  /* ── Total de referencias por categoría (para badge) ── */
  const conteoPorCategoria = useMemo(() => {
    const conteo = {}
    CATEGORIAS.forEach(cat => {
      conteo[cat.id] = CATALOGO_PLANO.filter(p => p.familia === cat.id).length
    })
    return conteo
  }, [])

  /* ── Búsqueda directa por referencia ── */
  const buscarReferenciaDirecta = useCallback((texto) => {
    const ref = CATALOGO_PLANO.find(p =>
      p.ref.toLowerCase() === texto.toLowerCase() ||
      p.keywords.some(k => k.includes(texto.toLowerCase()))
    )
    if (ref) {
      setReferencia(ref)
      setPaso('ficha')
      setHistorial([{ paso: 'categorias' }])
      return true
    }
    return false
  }, [])

  return {
    /* Estado */
    paso,
    categoria,
    marca,
    gama,
    tipo,
    referencia,
    historial,

    /* Datos para cada paso */
    categorias: CATEGORIAS,
    marcasDisponibles,
    gamasDisponibles,
    tiposDisponibles,
    referenciasDisponibles,
    conteoPorCategoria,

    /* Breadcrumb */
    breadcrumb,

    /* Navegación */
    seleccionarCategoria,
    seleccionarMarca,
    seleccionarGama,
    seleccionarTipo,
    seleccionarReferencia,
    volver,
    reiniciar,

    /* Búsqueda */
    buscarReferenciaDirecta,
  }
}
