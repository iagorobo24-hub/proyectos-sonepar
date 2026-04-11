/**
 * SERVICIO DE CATÁLOGO (FIRESTORE) - JERARQUÍA PROFUNDA
 * N1 (Familia) -> MARCA -> N2 (Subfamilia) -> N3 (Categoría)
 */
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

let hierarchyCache = null;
const productCache = new Map();

async function getHierarchy() {
  if (hierarchyCache) return hierarchyCache;
  try {
    const docRef = doc(db, 'catalog_metadata', 'hierarchy');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      hierarchyCache = docSnap.data().tree || {};
      return hierarchyCache;
    }
  } catch (error) { console.error('Error loading hierarchy:', error); }
  return {};
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
    return snap.docs.map(doc => doc.data());
  } catch (error) { console.error('Error fetching products:', error); return []; }
}

export async function getProductoPorRef(ref) {
  if (!ref) return null;
  try {
    const docSnap = await getDoc(doc(db, 'catalog_products', ref.toUpperCase()));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) { return null; }
}

export default {
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getTiposPorGamaMarcaYFamilia,
  getProductosPorFiltro,
  getProductoPorRef,
  getCatalogStats
};
