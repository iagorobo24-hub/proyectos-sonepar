/**
 * SERVICIO DE CATÁLOGO (SUPABASE) - JERARQUÍA PROFUNDA
 * N1 (Familia) -> MARCA -> N2 (Subfamilia) -> N3 (Categoría)
 * Mantiene compatibilidad con la API de Firestore pero usa Supabase
 */
import { supabase } from '../supabase/supabaseConfig'
import localHierarchy from '../data/hierarchy.json'

let hierarchyCache = null
const productCache = new Map()

/**
 * Obtiene la jerarquía de productos desde Supabase
 * Tabla: catalog_metadata
 * Document ID: hierarchy
 */
async function getHierarchy() {
  if (hierarchyCache) return hierarchyCache

  try {
    const { data, error } = await supabase
      .from('catalog_metadata')
      .select('tree')
      .eq('id', 'hierarchy')
      .single()

    if (error) {
      console.warn('Supabase hierarchy no disponible, usando fallback local:', error.message)
    } else if (data && data.tree && Object.keys(data.tree).length > 0) {
      hierarchyCache = data.tree
      return hierarchyCache
    }
  } catch (error) {
    console.warn('Error fetching hierarchy from Supabase:', error.message)
  }

  // Fallback: usar jerarquía local
  console.log('📂 Usando jerarquía local (hierarchy.json)')
  hierarchyCache = localHierarchy
  return hierarchyCache
}

/**
 * Obtiene marcas de una Familia (N1)
 * @param {string} categoria - Nombre de la categoría/familia
 * @returns {Array} Lista de marcas con nombre y color
 */
export async function getMarcasPorCategoria(categoria) {
  const tree = await getHierarchy()
  const fam = Object.keys(tree).find(k =>
    k.toUpperCase().includes(categoria.toUpperCase())
  )

  if (!fam) return []

  return Object.keys(tree[fam])
    .sort()
    .map(m => ({ nombre: m, color: '#666' }))
}

/**
 * Obtiene subfamilias (N2) de una Marca en una Familia
 * @param {string} marca - Nombre de la marca
 * @param {string} categoria - Nombre de la categoría/familia
 * @returns {Array} Lista de gamas/subfamilias
 */
export async function getGamasPorMarcaYCategoria(marca, categoria) {
  const tree = await getHierarchy()
  const fam = Object.keys(tree).find(k =>
    k.toUpperCase().includes(categoria.toUpperCase())
  )

  if (!fam || !tree[fam][marca]) return []

  return Object.keys(tree[fam][marca])
    .sort()
    .map(g => ({ nombre: g }))
}

/**
 * Obtiene categorías (N3) de una Subfamilia/Marca/Familia
 * @param {string} gama - Nombre de la gama/subfamilia
 * @param {string} marca - Nombre de la marca
 * @param {string} categoria - Nombre de la categoría/familia
 * @returns {Array} Lista de tipos/categorías
 */
export async function getTiposPorGamaMarcaYFamilia(gama, marca, categoria) {
  const tree = await getHierarchy()
  const fam = Object.keys(tree).find(k =>
    k.toUpperCase().includes(categoria.toUpperCase())
  )

  if (!fam || !tree[fam][marca] || !tree[fam][marca][gama]) return []

  return tree[fam][marca][gama].sort()
}

/**
 * Obtiene estadísticas del catálogo desde Supabase
 * @returns {Object} Objeto con totalProducts y updatedAt
 */
export async function getCatalogStats() {
  try {
    const { data, error } = await supabase
      .from('catalog_metadata')
      .select('totalProducts, updatedAt')
      .eq('id', 'hierarchy')
      .single()

    if (error) throw error

    return {
      totalProducts: data?.totalProducts || 0,
      updatedAt: data?.updatedAt
    }
  } catch (error) {
    console.error('Error fetching catalog stats:', error)
    return { totalProducts: 0 }
  }
}

/**
 * Carga productos filtrados desde Supabase
 * @param {string} categoria - Familia
 * @param {string} marca - Marca
 * @param {string} gama - Gama/Subfamilia
 * @param {string} tipo - Tipo/Categoría
 * @returns {Array} Lista de productos
 */
export async function getProductosPorFiltro(categoria, marca, gama, tipo) {
  console.log('📡 Consultando Supabase:', { familia: categoria, marca, gama, tipo })

  try {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('familia', categoria)
      .eq('marca', marca)
      .eq('gama', gama)
      .eq('tipo', tipo)
      .limit(100)

    if (error) throw error

    console.log(`✅ Supabase devolvió ${data.length} productos`)
    return data
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    return []
  }
}

/**
 * Obtiene un producto por su referencia
 * @param {string} ref - Referencia del producto
 * @returns {Object|null} Producto encontrado o null
 */
export async function getProductoPorRef(ref) {
  if (!ref) return null

  const cacheKey = ref.toUpperCase()

  // Usar caché si existe
  if (productCache.has(cacheKey)) {
    console.log(`📦 Usando caché para ref: ${cacheKey}`)
    return productCache.get(cacheKey)
  }

  try {
    // Primero intentar buscar por ID (referencia como ID del documento)
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('ref', cacheKey)
      .single()

    if (error) {
      // Si no se encuentra por ID, intentar buscar por el campo ref
      const { data: products, error: searchError } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('ref', ref)
        .limit(1)

      if (searchError) throw searchError

      if (products && products.length > 0) {
        const product = products[0]
        productCache.set(cacheKey, product)
        return product
      }

      return null
    }

    if (data) {
      productCache.set(cacheKey, data)
      return data
    }

    return null
  } catch (error) {
    console.error('Error fetching product by ref:', error)
    return null
  }
}

/**
 * Búsqueda por palabra clave en el catálogo
 * @param {string} termino - Término de búsqueda
 * @returns {Array} Lista de productos encontrados
 */
export async function buscarProductos(termino) {
  if (!termino || termino.length < 3) return []

  const qStr = termino.toLowerCase().trim()

  try {
    // Búsqueda usando full-text search o array contains
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .or(`nombre.ilike.%${qStr}%,ref.ilike.%${qStr}%,descripcion.ilike.%${qStr}%`)
      .limit(10)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error buscando productos:', error)
    return []
  }
}

/**
 * Búsqueda avanzada con filtros múltiples
 * @param {Object} filters - Objeto con filtros de búsqueda
 * @returns {Array} Lista de productos encontrados
 */
export async function buscarProductosAvanzados(filters) {
  try {
    let query = supabase.from('catalog_products').select('*')

    if (filters.familia) {
      query = query.eq('familia', filters.familia)
    }
    if (filters.marca) {
      query = query.eq('marca', filters.marca)
    }
    if (filters.gama) {
      query = query.eq('gama', filters.gama)
    }
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    if (filters.termino) {
      const qStr = filters.termino.toLowerCase()
      query = query.or(`nombre.ilike.%${qStr}%,ref.ilike.%${qStr}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error)
    return []
  }
}

export default {
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getTiposPorGamaMarcaYFamilia,
  getProductosPorFiltro,
  getProductoPorRef,
  buscarProductos,
  buscarProductosAvanzados,
  getCatalogStats,
  getHierarchy
}
