/**
 * SERVICIO DE CATÁLOGO — JERARQUÍA PROFUNDA
 * N1 (Familia) -> MARCA -> N2 (Subfamilia) -> N3 (Categoría)
 *
 * Backend automático:
 *   - Si VITE_SUPABASE_URL está definido → Supabase (nuevo)
 *   - Si no → Firestore (legacy) con fallback local hierarchy.json
 */
import { supabase } from '../supabase/supabaseClient';
import supabaseCatalog from './supabaseCatalogService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import localHierarchy from '../data/hierarchy.json';

const USE_SUPABASE = !!supabase;

let hierarchyCache = null;
const productCache = new Map();

async function getHierarchy() {
  if (hierarchyCache) return hierarchyCache;
  try {
    const docRef = doc(db, 'catalog_metadata', 'hierarchy');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Si existe el árbol en Firestore, usarlo
      if (data.tree && Object.keys(data.tree).length > 0) {
        hierarchyCache = data.tree;
        return hierarchyCache;
      }
    }
  } catch (error) {
    console.warn('Firestore hierarchy no disponible, usando fallback local:', error.message);
  }
  // Fallback: usar jerarquía local
  console.log('📂 Usando jerarquía local (hierarchy.json)');
  hierarchyCache = localHierarchy;
  return hierarchyCache;
}

/** Obtiene marcas de una Familia (N1) */
export async function getMarcasPorCategoria(categoria) {
  const tree = await getHierarchy();
  const fam = Object.keys(tree).find(k => k.toUpperCase().includes(categoria.toUpperCase()));
  if (!fam) return [];
  return Object.keys(tree[fam]).sort().map(m => ({ nombre: m, color: "#666" }));
}

/** Obtiene subfamilias (N2) de una Marca en una Familia */
export async function getGamasPorMarcaYCategoria(marca, categoria) {
  const tree = await getHierarchy();
  const fam = Object.keys(tree).find(k => k.toUpperCase().includes(categoria.toUpperCase()));
  if (!fam || !tree[fam][marca]) return [];
  return Object.keys(tree[fam][marca]).sort().map(g => ({ nombre: g }));
}

/** Obtiene categorías (N3) de una Subfamilia/Marca/Familia */
export async function getTiposPorGamaMarcaYFamilia(gama, marca, categoria) {
  const tree = await getHierarchy();
  const fam = Object.keys(tree).find(k => k.toUpperCase().includes(categoria.toUpperCase()));
  if (!fam || !tree[fam][marca] || !tree[fam][marca][gama]) return [];
  return tree[fam][marca][gama].sort();
}

/** Obtiene el total de productos desde los metadatos */
export async function getCatalogStats() {
  try {
    const docRef = doc(db, 'catalog_metadata', 'hierarchy');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        totalProducts: docSnap.data().totalProducts || 0,
        updatedAt: docSnap.data().updatedAt
      };
    }
  } catch (error) {
    console.error('Error fetching catalog stats:', error);
  }
  return { totalProducts: 0 };
}

/** Carga productos filtrados */
export async function getProductosPorFiltro(categoria, marca, gama, tipo) {
  console.log('📡 Consultando Firestore:', { familia: categoria, marca, gama, tipo });
  try {
    const q = query(
      collection(db, 'catalog_products'),
      where('familia', '==', categoria),
      where('marca', '==', marca),
      where('gama', '==', gama),
      where('tipo', '==', tipo),
      limit(100)
    );
    const snap = await getDocs(q);
    console.log(`✅ Firestore devolvió ${snap.size} productos`);
    return snap.docs.map(doc => doc.data());
  } catch (error) { console.error('❌ Error fetching products:', error); return []; }
}

export async function getProductoPorRef(ref) {
  if (!ref) return null;
  const cacheKey = ref.toUpperCase();
  
  // Usar caché si existe
  if (productCache.has(cacheKey)) {
    console.log(`📦 Usando caché para ref: ${cacheKey}`);
    return productCache.get(cacheKey);
  }

  try {
    const docSnap = await getDoc(doc(db, 'catalog_products', cacheKey));
    if (docSnap.exists()) {
      const data = docSnap.data();
      productCache.set(cacheKey, data);
      return data;
    }
    
    // Fallback: buscar por el campo ref si el ID del documento no coincide
    const q = query(
      collection(db, 'catalog_products'),
      where('ref', '==', ref),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      productCache.set(cacheKey, data);
      return data;
    }
    return null;
  } catch (error) { return null; }
}

/** Búsqueda por palabra clave en el catálogo */
export async function buscarProductos(termino) {
  if (!termino || termino.length < 3) return [];
  const qStr = termino.toLowerCase().trim();
  
  try {
    const q = query(
      collection(db, 'catalog_products'),
      where('searchKeywords', 'array-contains', qStr),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}

// ── Wrapper: delegar a Supabase si está configurado ────────
const resolvedService = USE_SUPABASE ? {
  getMarcasPorCategoria:          supabaseCatalog.getMarcasPorCategoria,
  getGamasPorMarcaYCategoria:     supabaseCatalog.getGamasPorMarcaYCategoria,
  getTiposPorGamaMarcaYFamilia:   supabaseCatalog.getTiposPorGamaMarcaYFamilia,
  getProductosPorFiltro:          supabaseCatalog.getProductosPorFiltro,
  getProductoPorRef:              supabaseCatalog.getProductoPorRef,
  buscarProductos:                supabaseCatalog.buscarProductos,
  getCatalogStats:                supabaseCatalog.getCatalogStats,
  getHierarchy:                   supabaseCatalog.getHierarchy,
} : {
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getTiposPorGamaMarcaYFamilia,
  getProductosPorFiltro,
  getProductoPorRef,
  buscarProductos,
  getCatalogStats,
  getHierarchy,
};

if (USE_SUPABASE) {
  console.log('📦 Catálogo usando Supabase');
} else {
  console.log('📦 Catálogo usando Firestore (legacy)');
}

export default resolvedService;
