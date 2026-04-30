/**
 * SERVICIO DE CATÁLOGO (SUPABASE)
 * Drop-in replacement para catalogService.js (Firestore)
 *
 * Misma API pública:
 *   getMarcasPorCategoria(categoria)
 *   getGamasPorMarcaYCategoria(marca, categoria)
 *   getTiposPorGamaMarcaYFamilia(gama, marca, categoria)
 *   getProductosPorFiltro(categoria, marca, gama, tipo)
 *   getProductoPorRef(ref)
 *   buscarProductos(termino)
 *   getCatalogStats()
 */
import { supabase } from '../supabase/supabaseClient';

let hierarchyCache = null;
const productCache = new Map();

// ── Jerarquía ──────────────────────────────────────────────

async function getHierarchy() {
  if (hierarchyCache) return hierarchyCache;
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.rpc('get_catalog_hierarchy');
    if (error) throw error;
    if (data && Object.keys(data).length > 0) {
      hierarchyCache = data;
      return hierarchyCache;
    }
  } catch (err) {
    console.warn('Supabase hierarchy no disponible, usando fallback:', err.message);
  }

  // Fallback: construir desde tablas directas
  try {
    const { data: products } = await supabase
      .from('products')
      .select('familia, brand_id, subfamilia, tipo, brands(name)')
      .eq('is_active', true);

    if (products && products.length > 0) {
      const tree = {};
      for (const p of products) {
        const fam = p.familia || 'OTRAS';
        const marca = p.brands?.name || 'GENÉRICO';
        const sub = p.subfamilia || 'GENERAL';
        const tipo = p.tipo || 'GENERAL';
        if (!tree[fam]) tree[fam] = {};
        if (!tree[fam][marca]) tree[fam][marca] = {};
        if (!tree[fam][marca][sub]) tree[fam][marca][sub] = [];
        if (!tree[fam][marca][sub].includes(tipo)) {
          tree[fam][marca][sub].push(tipo);
        }
      }
      hierarchyCache = tree;
      return hierarchyCache;
    }
  } catch (err) {
    console.warn('Error construyendo jerarquía desde productos:', err.message);
  }

  return {};
}

// ── API Pública ────────────────────────────────────────────

export async function getMarcasPorCategoria(categoria) {
  const tree = await getHierarchy();
  const fam = Object.keys(tree).find(
    k => k.toUpperCase().includes(categoria.toUpperCase())
  );
  if (!fam) return [];
  return Object.keys(tree[fam]).sort().map(m => ({ nombre: m, color: '#666' }));
}

export async function getGamasPorMarcaYCategoria(marca, categoria) {
  const tree = await getHierarchy();
  const fam = Object.keys(tree).find(
    k => k.toUpperCase().includes(categoria.toUpperCase())
  );
  if (!fam || !tree[fam][marca]) return [];
  return Object.keys(tree[fam][marca]).sort().map(g => ({ nombre: g }));
}

export async function getTiposPorGamaMarcaYFamilia(gama, marca, categoria) {
  const tree = await getHierarchy();
  const fam = Object.keys(tree).find(
    k => k.toUpperCase().includes(categoria.toUpperCase())
  );
  if (!fam || !tree[fam][marca] || !tree[fam][marca][gama]) return [];
  return tree[fam][marca][gama].sort();
}

export async function getProductosPorFiltro(categoria, marca, gama, tipo) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('v_products_with_prices')
      .select('*')
      .ilike('familia', `%${categoria}%`)
      .eq('brand_name', marca)
      .eq('subfamilia', gama)
      .eq('tipo', tipo)
      .eq('is_active', true)
      .limit(100);

    if (error) throw error;
    return (data || []).map(mapProductToLegacy);
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function getProductoPorRef(ref) {
  if (!ref || !supabase) return null;
  const cacheKey = ref.toUpperCase();
  if (productCache.has(cacheKey)) return productCache.get(cacheKey);

  try {
    // Intentar con RPC para ficha completa
    const { data, error } = await supabase.rpc('get_product_detail', {
      product_ref: ref,
    });

    if (!error && data) {
      const mapped = mapDetailToLegacy(data);
      productCache.set(cacheKey, mapped);
      return mapped;
    }

    // Fallback: query directa
    const { data: rows } = await supabase
      .from('v_products_with_prices')
      .select('*')
      .or(`ref_fabricante.ilike.${ref},ref_sonepar.ilike.${ref}`)
      .limit(1);

    if (rows && rows.length > 0) {
      const mapped = mapProductToLegacy(rows[0]);
      productCache.set(cacheKey, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Error getProductoPorRef:', err);
  }
  return null;
}

export async function buscarProductos(termino) {
  if (!termino || termino.length < 2 || !supabase) return [];

  try {
    const { data, error } = await supabase.rpc('search_products', {
      search_query: termino,
      max_results: 20,
    });
    if (error) throw error;
    return (data || []).map(r => ({
      ref: r.ref_fabricante,
      refSonepar: r.ref_sonepar,
      nombre: r.name,
      marca: r.brand_name,
      familia: r.familia,
      precio: r.precio_neto || r.precio_tarifa || 0,
    }));
  } catch (err) {
    console.error('Error buscando productos:', err);
    return [];
  }
}

export async function getCatalogStats() {
  if (!supabase) return { totalProducts: 0 };

  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;
    return { totalProducts: count || 0 };
  } catch (err) {
    console.error('Error fetching catalog stats:', err);
    return { totalProducts: 0 };
  }
}

// ── Mappers (Supabase → formato legacy Firestore) ─────────

function mapProductToLegacy(row) {
  return {
    ref: row.ref_fabricante,
    refSonepar: row.ref_sonepar || '',
    nombre: row.name,
    marca: row.brand_name || '',
    familia: row.familia || '',
    gama: row.subfamilia || '',
    tipo: row.tipo || '',
    precio: row.precio_neto || row.precio_tarifa || 0,
    pvp: row.precio_tarifa || 0,
    pdf: '',
    descripcion: row.description || '',
    imagen: row.image_url || '',
    url_sonepar: row.sonepar_url || '',
    documentos: [],
    brand_logo: row.brand_logo || '',
    brand_color: row.brand_color || '',
  };
}

function mapDetailToLegacy(detail) {
  const p = detail.product || {};
  const brand = detail.brand || {};
  const price = detail.price || {};
  const docs = detail.documents || [];
  const specs = detail.specifications || [];

  return {
    ref: p.ref_fabricante,
    refSonepar: p.ref_sonepar || '',
    nombre: p.name,
    marca: brand.name || '',
    familia: p.familia || '',
    gama: p.subfamilia || '',
    tipo: p.tipo || '',
    precio: price.precio_neto || price.precio_tarifa || 0,
    pvp: price.precio_tarifa || 0,
    descripcion: p.description || '',
    imagen: p.image_url || '',
    url_sonepar: p.sonepar_url || '',
    url_fabricante: p.manufacturer_url || brand.website_url || '',
    ean: p.ean || '',
    unidad: p.unit || 'ud',
    peso: p.weight_kg || null,
    documentos: docs.map(d => ({
      nombre: d.name,
      url: d.url,
      tipo: d.doc_type,
      formato: d.file_format,
    })),
    especificaciones: specs.map(s => ({
      grupo: s.group,
      clave: s.key,
      valor: s.value,
      unidad: s.unit,
    })),
    stock: (detail.stock || []).map(s => ({
      almacen: s.almacen,
      cantidad: s.cantidad,
      disponible: s.disponible,
    })),
    relacionados: (detail.related || []).map(r => ({
      ref: r.ref,
      nombre: r.name,
      tipo: r.relation_type,
    })),
    brand_logo: brand.logo_url || '',
    brand_color: brand.color || '',
  };
}

export default {
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getTiposPorGamaMarcaYFamilia,
  getProductosPorFiltro,
  getProductoPorRef,
  buscarProductos,
  getCatalogStats,
  getHierarchy,
};
