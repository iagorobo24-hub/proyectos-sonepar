/**
 * Hook para navegación jerárquica de Fichas Técnicas conectado a Firestore
 * Flujo: Categoría → Marca → Gama → Tipo → Referencia → Ficha
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import catalogService from '../services/catalogService'
import { FULL_CATEGORY_INFO } from '../data/categoryMapping'

// Generamos las categorías dinámicamente desde el mapping
const CATEGORIAS = Object.keys(FULL_CATEGORY_INFO).map(key => ({
  id: key,
  label: key,
  icon: FULL_CATEGORY_INFO[key].icon,
  color: '#3b82f6'
}))

export default function useNavegacionFichas() {
  /* Estado de navegación */
  const [paso, setPaso] = useState('categorias') // categorias | marcas | gamas | tipos | referencias | ficha
  const [categoria, setCategoria] = useState(null)
  const [marca, setMarca] = useState(null)
  const [gama, setGama] = useState(null)
  const [tipo, setTipo] = useState(null)
  const [referencia, setReferencia] = useState(null)

  /* Datos cargados desde Firestore */
  const [marcasDisponibles, setMarcasDisponibles] = useState([])
  const [gamasDisponibles, setGamasDisponibles] = useState([])
  const [tiposDisponibles, setTiposDisponibles] = useState([])
  const [referenciasDisponibles, setReferenciasDisponibles] = useState([])
  const [cargando, setCargando] = useState(false)

  /* Historial de navegación para botón "Volver" */
  const [historial, setHistorial] = useState([])

  /* ── Efectos para cargar datos según el paso ── */

  // Cargar Marcas al seleccionar Categoría
  useEffect(() => {
    if (!categoria) {
      setMarcasDisponibles([])
      return
    }
    
    async function load() {
      setCargando(true)
      const data = await catalogService.getMarcasPorCategoria(categoria)
      setMarcasDisponibles(data)
      setCargando(false)
    }
    load()
  }, [categoria])

  // Cargar Gamas al seleccionar Marca
  useEffect(() => {
    if (!categoria || !marca) {
      setGamasDisponibles([])
      return
    }

    async function load() {
      setCargando(true)
      const data = await catalogService.getGamasPorMarcaYCategoria(marca, categoria)
      setGamasDisponibles(data.map(g => g.nombre))
      setCargando(false)
    }
    load()
  }, [categoria, marca])

  // Cargar Productos (Tipos y Refs) al seleccionar Gama
  useEffect(() => {
    if (!categoria || !marca || !gama) {
      setTiposDisponibles([])
      setReferenciasDisponibles([])
      return
    }

    async function load() {
      setCargando(true)
      const products = await catalogService.getProductosPorGama(categoria, marca, gama)
      
      // Extraer tipos únicos
      const uniqueTypes = [...new Set(products.map(p => p.tipo))].filter(Boolean)
      setTiposDisponibles(uniqueTypes.sort())
      
      // Guardar productos para el paso de referencias
      setReferenciasDisponibles(products)
      setCargando(false)
    }
    load()
  }, [categoria, marca, gama])

  /* ── Navegación hacia adelante ── */
  const seleccionarCategoria = useCallback((catId) => {
    setCategoria(catId)
    setMarca(null)
    setGama(null)
    setTipo(null)
    setReferencia(null)
    setPaso('marcas')
    setHistorial(prev => [...prev, { paso: 'categorias' }])
  }, [])

  const seleccionarMarca = useCallback((marcaNombre) => {
    setMarca(marcaNombre)
    setGama(null)
    setTipo(null)
    setReferencia(null)
    setPaso('gamas')
    setHistorial(prev => [...prev, { paso: 'marcas' }])
  }, [])

  const seleccionarGama = useCallback((gamaNombre) => {
    setGama(gamaNombre)
    setTipo(null)
    setReferencia(null)
    setPaso('tipos')
    setHistorial(prev => [...prev, { paso: 'gamas' }])
  }, [])

  const seleccionarTipo = useCallback((tipoNombre) => {
    setTipo(tipoNombre)
    setReferencia(null)
    setPaso('referencias')
    setHistorial(prev => [...prev, { paso: 'tipos' }])
  }, [])

  const seleccionarReferencia = useCallback((refId) => {
    // Si ya lo tenemos en el array de referenciasDisponibles, no hace falta pedirlo
    const found = referenciasDisponibles.find(p => p.ref === refId)
    if (found) {
      setReferencia(found)
      setPaso('ficha')
      setHistorial(prev => [...prev, { paso: 'referencias' }])
    } else {
      // Si no, lo pedimos a Firestore (pasa en búsquedas directas)
      setCargando(true)
      catalogService.getProductoPorRef(refId).then(ficha => {
        setReferencia(ficha)
        setPaso('ficha')
        setHistorial(prev => [...prev, { paso: 'referencias' }])
        setCargando(false)
      })
    }
  }, [referenciasDisponibles])

  /* ── Navegación hacia atrás ── */
  const volver = useCallback(() => {
    const nuevoHistorial = [...historial]
    const anterior = nuevoHistorial.pop()

    if (!anterior) {
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
        setPaso('marcas')
        setMarca(null)
        setGama(null)
        setTipo(null)
        setReferencia(null)
        break
      case 'gamas':
        setPaso('gamas')
        setGama(null)
        setTipo(null)
        setReferencia(null)
        break
      case 'tipos':
        setPaso('tipos')
        setTipo(null)
        setReferencia(null)
        break
      case 'referencias':
        setPaso('referencias')
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
    if (categoria) parts.push(categoria)
    if (marca) parts.push(marca)
    if (gama) parts.push(gama)
    if (tipo) parts.push(tipo)
    return parts
  }, [categoria, marca, gama, tipo])

  /* ── Filtrado de referencias por Tipo ── */
  const referenciasFiltradas = useMemo(() => {
    if (!tipo) return referenciasDisponibles
    return referenciasDisponibles.filter(p => p.tipo === tipo)
  }, [referenciasDisponibles, tipo])

  /* ── Búsqueda directa por referencia ── */
  const buscarReferenciaDirecta = useCallback(async (texto) => {
    setCargando(true)
    const p = await catalogService.getProductoPorRef(texto.toUpperCase())
    setCargando(false)
    if (p) {
      setReferencia(p)
      setPaso('ficha')
      setHistorial([{ paso: 'categorias' }])
      return true
    }
    return false
  }, [])

  return {
    paso,
    categoria,
    marca,
    gama,
    tipo,
    referencia,
    historial,
    cargando,

    categorias: CATEGORIAS,
    marcasDisponibles,
    gamasDisponibles,
    tiposDisponibles,
    referenciasDisponibles: referenciasFiltradas,
    conteoPorCategoria: {}, // El conteo exacto ya no es viable calcularlo al vuelo para todos

    breadcrumb,

    seleccionarCategoria,
    seleccionarMarca,
    seleccionarGama,
    seleccionarTipo,
    seleccionarReferencia,
    volver,
    reiniciar,

    buscarReferenciaDirecta,
  }
}
