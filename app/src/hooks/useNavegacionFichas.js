/**
 * Hook para navegación jerárquica PROFUNDA conectado a Firestore
 * Flujo: Categoría (N1) → MARCA → Subfamilia (N2) → Tipo (N3) → Referencia
 */
import { useState, useCallback, useMemo, useEffect } from 'react'
import catalogService from '../services/catalogService'
import { FULL_CATEGORY_INFO } from '../data/categoryMapping'

const CATEGORIAS = Object.keys(FULL_CATEGORY_INFO).map(key => ({
  id: key,
  label: key,
  icon: FULL_CATEGORY_INFO[key].icon,
  color: '#3b82f6'
}))

export default function useNavegacionFichas() {
  const [paso, setPaso] = useState('categorias') // categorias | marcas | gamas | tipos | referencias | ficha
  const [categoria, setCategoria] = useState(null)
  const [marca, setMarca] = useState(null)
  const [gama, setGama] = useState(null)
  const [tipo, setTipo] = useState(null)
  const [referencia, setReferencia] = useState(null)

  const [marcasDisponibles, setMarcasDisponibles] = useState([])
  const [gamasDisponibles, setGamasDisponibles] = useState([])
  const [tiposDisponibles, setTiposDisponibles] = useState([])
  const [referenciasDisponibles, setReferenciasDisponibles] = useState([])
  const [cargando, setCargando] = useState(false)
  const [historial, setHistorial] = useState([])

  // 1. Cargar Marcas al seleccionar Categoría (N1)
  useEffect(() => {
    if (!categoria) return;
    async function load() {
      setCargando(true)
      const data = await catalogService.getMarcasPorCategoria(categoria)
      setMarcasDisponibles(data)
      setCargando(false)
    }
    load()
  }, [categoria])

  // 2. Cargar Subfamilias (N2) al seleccionar Marca
  useEffect(() => {
    if (!categoria || !marca) return;
    async function load() {
      setCargando(true)
      const data = await catalogService.getGamasPorMarcaYCategoria(marca, categoria)
      setGamasDisponibles(data.map(g => g.nombre))
      setCargando(false)
    }
    load()
  }, [categoria, marca])

  // 3. Cargar Tipos (N3) al seleccionar Subfamilia (N2)
  useEffect(() => {
    if (!categoria || !marca || !gama) return;
    async function load() {
      setCargando(true)
      const data = await catalogService.getTiposPorGamaMarcaYFamilia(gama, marca, categoria)
      setTiposDisponibles(data)
      setCargando(false)
    }
    load()
  }, [categoria, marca, gama])

  // 4. Cargar Productos al seleccionar Tipo (N3)
  useEffect(() => {
    if (!categoria || !marca || !gama || !tipo) return;
    async function load() {
      setCargando(true)
      const products = await catalogService.getProductosPorFiltro(categoria, marca, gama, tipo)
      setReferenciasDisponibles(products)
      setCargando(false)
    }
    load()
  }, [categoria, marca, gama, tipo])

  const seleccionarCategoria = useCallback((catId) => {
    setCategoria(catId); setMarca(null); setGama(null); setTipo(null); setReferencia(null);
    setPaso('marcas'); setHistorial(prev => [...prev, { paso: 'categorias' }])
  }, [])

  const seleccionarMarca = useCallback((marcaNombre) => {
    setMarca(marcaNombre); setGama(null); setTipo(null); setReferencia(null);
    setPaso('gamas'); setHistorial(prev => [...prev, { paso: 'marcas' }])
  }, [])

  const seleccionarGama = useCallback((gamaNombre) => {
    setGama(gamaNombre); setTipo(null); setReferencia(null);
    setPaso('tipos'); setHistorial(prev => [...prev, { paso: 'gamas' }])
  }, [])

  const seleccionarTipo = useCallback((tipoNombre) => {
    setTipo(tipoNombre); setReferencia(null);
    setPaso('referencias'); setHistorial(prev => [...prev, { paso: 'tipos' }])
  }, [])

  const seleccionarReferencia = useCallback(async (refId) => {
    setCargando(true)
    const ficha = await catalogService.getProductoPorRef(refId)
    setReferencia(ficha)
    setPaso('ficha')
    setHistorial(prev => [...prev, { paso: 'referencias' }])
    setCargando(false)
  }, [])

  const volver = useCallback(() => {
    const nuevoHistorial = [...historial]
    const anterior = nuevoHistorial.pop()
    if (!anterior) { reiniciar(); return; }
    setPaso(anterior.paso); setHistorial(nuevoHistorial)
  }, [historial])

  const reiniciar = useCallback(() => {
    setPaso('categorias'); setCategoria(null); setMarca(null); setGama(null); setTipo(null); setReferencia(null); setHistorial([]);
  }, [])

  const buscarReferenciaDirecta = useCallback(async (refId) => {
    if (!refId) return false
    setCargando(true)
    try {
      const ficha = await catalogService.getProductoPorRef(refId)
      if (ficha) {
        setCategoria(ficha.familia)
        setMarca(ficha.marca)
        setGama(ficha.gama)
        setTipo(ficha.tipo)
        setReferencia(ficha)
        setPaso('ficha')
        setHistorial(prev => [...prev, { paso: 'categorias' }])
        setCargando(false)
        return true
      }
    } catch (e) {
      console.error("Error en búsqueda directa:", e)
    }
    setCargando(false)
    return false
  }, [])

  const breadcrumb = useMemo(() => {
    const b = []; if (categoria) b.push(categoria); if (marca) b.push(marca); if (gama) b.push(gama); if (tipo) b.push(tipo); return b;
  }, [categoria, marca, gama, tipo])

  return {
    paso, categoria, marca, gama, tipo, referencia, historial, cargando,
    categorias: CATEGORIAS, marcasDisponibles, gamasDisponibles, tiposDisponibles, referenciasDisponibles,
    breadcrumb, seleccionarCategoria, seleccionarMarca, seleccionarGama, seleccionarTipo, seleccionarReferencia, volver, reiniciar,
    buscarReferenciaDirecta
  }
}
