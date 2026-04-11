/**
 * SERVICIO DE CATÁLOGO (FIRESTORE) - OPTIMIZADO
 * Sustituye a catalogoSonepar.js cargando datos bajo demanda desde Firestore.
 * 
 * Implementa caché de metadatos y caché de búsquedas recientes para rendimiento Vercel.
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Cachés en memoria (Volátiles por sesión)
let hierarchyCache = null;
const searchCache = new Map();
const productCache = new Map();

/**
 * Carga los metadatos de navegación (Categorías -> Marcas -> Gamas)
 */
async function getHierarchy() {
  if (hierarchyCache) return hierarchyCache;
  
  try {
    const docRef = doc(db, 'catalog_metadata', 'hierarchy');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      hierarchyCache = docSnap.data().tree || {};
      return hierarchyCache;
    }
  } catch (error) {
    console.error('Error loading catalog hierarchy:', error);
  }
  return {};
}

/**
 * Obtiene las marcas disponibles para una categoría específica.
 */
export async function getMarcasPorCategoria(categoria) {
  const tree = await getHierarchy();
  const normCat = categoria.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const catKey = Object.keys(tree).find(k => 
    k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normCat)
  );
  
  if (!catKey) return [];
  
  return Object.keys(tree[catKey]).sort().map(m => ({
    nombre: m,
    color: "#666", 
    url: ""
  }));
}

/**
 * Obtiene las gamas de una marca dentro de una categoría.
 */
export async function getGamasPorMarcaYCategoria(marca, categoria) {
  const tree = await getHierarchy();
  const normCat = categoria.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const catKey = Object.keys(tree).find(k => 
    k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normCat)
  );
  
  if (!catKey || !tree[catKey][marca]) return [];
  
  return tree[catKey][marca].sort().map(g => ({
    nombre: g,
    count: 0 
  }));
}

/**
 * Carga los productos de una gama.
 */
export async function getProductosPorGama(categoria, marca, gama) {
  const cacheKey = `${categoria}-${marca}-${gama}`;
  if (productCache.has(cacheKey)) return productCache.get(cacheKey);

  try {
    const q = query(
      collection(db, 'catalog_products'),
      where('familia', '==', categoria),
      where('marca', '==', marca),
      where('gama', '==', gama),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => doc.data());
    productCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error fetching products by gama:', error);
    return [];
  }
}

/**
 * Busca un producto por referencia (Con caché).
 */
export async function getProductoPorRef(ref) {
  if (!ref) return null;
  const upperRef = ref.toUpperCase();
  if (productCache.has(upperRef)) return productCache.get(upperRef);

  try {
    const docRef = doc(db, 'catalog_products', upperRef);
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    if (data) productCache.set(upperRef, data);
    return data;
  } catch (error) {
    console.error(`Error fetching product ${ref}:`, error);
    return null;
  }
}

/**
 * Buscador Global con caché inteligente.
 */
export async function searchProducts(searchTerm, limitCount = 20) {
  const term = searchTerm?.toLowerCase().trim();
  if (!term || term.length < 3) return [];
  
  if (searchCache.has(term)) return searchCache.get(term);
  
  try {
    const q = query(
      collection(db, 'catalog_products'),
      where('searchKeywords', 'array-contains', term),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => doc.data());
    
    // Guardar en caché (máximo 50 búsquedas para no saturar memoria)
    if (searchCache.size > 50) searchCache.delete(searchCache.keys().next().value);
    searchCache.set(term, results);
    
    return results;
  } catch (error) {
    console.error('Error in global search:', error);
    return [];
  }
}

export default {
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getProductosPorGama,
  getProductoPorRef,
  searchProducts
};
