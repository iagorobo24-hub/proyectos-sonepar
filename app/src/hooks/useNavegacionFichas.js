/**
 * Hook para navegación jerárquica de Fichas Técnicas
 * Flujo: Categoría → Marca → Gama → Tipo → Referencia → Ficha
 */

import { useState, useCallback, useMemo } from 'react'
import {
  CATALOGO_PLANO,
  getMarcas,
  getGamasPorMarcaYCategoria,
  getProductosPorGama,
  getProductoPorRef,
} from '../data/catalogoSonepar'
import { FULL_CATEGORY_INFO, CATEGORY_IDS } from '../data/categoryMapping'

// Generamos las categorías dinámicamente desde el mapping
const CATEGORIAS = Object.keys(FULL_CATEGORY_INFO).map(key => ({
  id: key,
  label: key,
  icon: FULL_CATEGORY_INFO[key].icon,
  color: '#3b82f6' // Color por defecto o mapeado si fuera necesario
}))

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
    // Adaptamos el array de nombres a objetos para el componente
    return getMarcas(categoria).map(nombre => ({ nombre }))
  }, [categoria])

  const gamasDisponibles = useMemo(() => {
    if (!categoria || !marca) return []
    // getGamasPorMarcaYCategoria espera (marca, categoria)
    return getGamasPorMarcaYCategoria(marca, categoria)
  }, [categoria, marca])

  const tiposDisponibles = useMemo(() => {
    if (!categoria || !marca || !gama) return []
    return [...new Set(
      getProductosPorGama(categoria, gama)
        .filter(p => p.marca === marca)
        .map(p => p.tipo)
    )]
  }, [categoria, marca, gama])

  const referenciasDisponibles = useMemo(() => {
    if (!categoria || !marca || !gama) return []
    const refs = getProductosPorGama(categoria, gama).filter(p => p.marca === marca)
    if (tipo) {
      return refs.filter(p => p.tipo === tipo)
    }
    return refs
  }, [categoria, marca, gama, tipo])

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
    const ficha = getProductoPorRef(refId)
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
    if (categoria) parts.push(categoria)
    if (marca) parts.push(marca)
    if (gama) parts.push(gama)
    if (tipo) parts.push(tipo)
    return parts
  }, [categoria, marca, gama, tipo])

  /* ── Total de referencias por categoría (para badge) ── */
  const conteoPorCategoria = useMemo(() => {
    const conteo = {}
    Object.keys(FULL_CATEGORY_INFO).forEach(catId => {
      // Calculamos el total de productos en esa familia
      const familia = catId
      const subfamilias = getGamasPorMarcaYCategoria('', familia)
      let total = 0
      subfamilias.forEach(g => {
        total += getProductosPorGama(familia, g).length
      })
      conteo[catId] = total
    })
    return conteo
  }, [])

  /* ── Búsqueda directa por referencia ── */
  const buscarReferenciaDirecta = useCallback((texto) => {
    const p = getProductoPorRef(texto.toUpperCase())
    if (p) {
      setReferencia(p)
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
