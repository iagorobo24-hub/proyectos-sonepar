/**
 * Fusiona datos scrapeados de Sonepar con catálogo existente
 * Genera catalogoSonepar.js enriquecido
 */

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const ROOT_DIR = path.join(process.cwd(), '..');
const APP_DIR = path.join(ROOT_DIR, 'app');

// Leer datos scrapeados
const scrapedData = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'catalogo-definitivo.json'), 'utf8'));
console.log(`📦 Datos scrapeados: ${scrapedData.length} referencias`);

// Leer catálogo existente
const catalogoPath = path.join(APP_DIR, 'src/data/catalogoSonepar.js');
const catalogoContent = fs.readFileSync(catalogoPath, 'utf8');

// Extraer CATALOGO_PLANO del archivo JS
const planoMatch = catalogoContent.match(/export const CATALOGO_PLANO = \[([\s\S]*?)\];/);
if (!planoMatch) {
  console.error('❌ No se pudo extraer CATALOGO_PLANO');
  process.exit(1);
}

// Parsear las referencias existentes
const existingRefs = [];
const refRegex = /\{ ref:\s*"([^"]+)"[\s\S]*?familia:\s*"([^"]+)"[\s\S]*?gama:\s*"([^"]+)"[\s\S]*?tipo:\s*"([^"]+)"[\s\S]*?precio:\s*(\d+)[\s\S]*?pdf_url:\s*"([^"]*)"/g;
let match;
while ((match = refRegex.exec(catalogoContent)) !== null) {
  existingRefs.push({
    ref: match[1],
    familia: match[2],
    gama: match[3],
    tipo: match[4],
    precio: match[5],
    pdf_url: match[6],
  });
}

console.log(`📚 Catálogo existente: ${existingRefs.length} referencias`);

// Crear mapa de referencias existentes
const existingMap = new Map();
for (const ref of existingRefs) {
  existingMap.set(ref.ref, ref);
}

// Fusionar: mantener existentes + añadir nuevos
const mergedRefs = [...existingRefs];
const newFromScraped = [];

for (const scraped of scrapedData) {
  if (!existingMap.has(scraped.ref)) {
    newFromScraped.push(scraped);
    mergedRefs.push({
      ref: scraped.ref,
      familia: scraped.familia || scraped.subfamilia || 'Varias',
      gama: scraped.subfamilia || scraped.familia || '',
      tipo: scraped.tipo || scraped.subfamilia || '',
      precio: scraped.precio || '',
      pdf_url: scraped.url || `https://tienda.sonepar.es/tienda/#/catalogo/articulo/${scraped.ref}`,
      desc: scraped.desc,
      marca: scraped.marca || 'Varias',
      keywords: [scraped.familia?.toLowerCase(), scraped.marca?.toLowerCase()].filter(Boolean),
    });
  }
}

console.log(`✨ Nuevas referencias desde Sonepar: ${newFromScraped.length}`);
console.log(`📊 Total fusionado: ${mergedRefs.length} referencias`);

// Mostrar marcas encontradas
const marcasScraped = [...new Set(scrapedData.map(p => p.marca).filter(Boolean))];
console.log(`\n🏷️ Marcas encontradas en Sonepar (${marcasScraped.length}):`);
for (const marca of marcasScraped.slice(0, 20)) {
  const count = scrapedData.filter(p => p.marca === marca).length;
  console.log(`  ${marca.padEnd(20)} ${count} refs`);
}

// Generar archivo JS
let jsContent = `/* Catálogo Sonepar Tools — Versión 3.0
 * Fusionado con datos reales de tienda.sonepar.es
 * ${new Date().toISOString()}
 * Total: ${mergedRefs.length} referencias (${existingRefs.length} existentes + ${newFromScraped.length} nuevas)
 */

export const CATALOGO_PLANO = [
`;

for (const ref of mergedRefs) {
  const safe = (str) => (str || '').replace(/[\n\r\t]/g, ' ').replace(/"/g, "'").substring(0, 120).trim();
  const safeKeyword = (str) => (str || '').replace(/[\n\r\t"]/g, ' ').trim();
  jsContent += `  {
    ref: "${ref.ref}",
    desc: "${safe(ref.desc)}",
    marca: "${safe(ref.marca) || 'Varias'}",
    familia: "${safe(ref.familia)}",
    gama: "${safe(ref.gama)}",
    tipo: "${safe(ref.tipo)}",
    precio: ${ref.precio || 0},
    pdf_url: "${safe(ref.pdf_url)}",
    imagen: "",
    keywords: [${(ref.keywords || []).map(k => `"${safeKeyword(k)}"`).filter(k => k !== '""').join(', ')}],
  },
`;
}

jsContent += `];

/* Catálogo por categoría — actualizado */
export const CATALOGO_POR_CATEGORIA = {
  automatizacion: CATALOGO_PLANO.filter(p =>
    ['Variadores', 'Contactores', 'Guardamotores', 'PLCs', 'Reles'].includes(p.familia)
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  iluminacion: CATALOGO_PLANO.filter(p => p.familia === 'Iluminación' || p.familia?.includes('ILUMINACION'))
    .map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  vehiculo_electrico: CATALOGO_PLANO.filter(p =>
    p.familia?.includes('VE') || p.familia?.includes('VEHICULO') || p.subfamilia?.includes('CARGADOR')
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  cuadro_electrico: CATALOGO_PLANO.filter(p =>
    p.familia === 'Protección' || p.familia?.includes('DISTRIBUCION')
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  energia_solar: CATALOGO_PLANO.filter(p =>
    p.familia?.includes('Solar') || p.familia?.includes('SOLAR') || p.subfamilia?.includes('FOTOVOLTAIC')
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  clima: CATALOGO_PLANO.filter(p =>
    p.familia?.includes('HVAC') || p.familia?.includes('Climatización')
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  cables: CATALOGO_PLANO.filter(p =>
    p.familia?.includes('CABLE') || p.familia?.includes('Cable')
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),

  herramientas: CATALOGO_PLANO.filter(p =>
    p.familia?.includes('Herramienta') || p.familia?.includes('HERRAMIENTA')
  ).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
};

/* MARCAS — Actualizado con logos */
export const MARCAS = {
  "Schneider Electric": {
    nombre: "Schneider Electric",
    color: "#3DCD58",
    familias: ["Variadores", "Contactores", "Guardamotores", "PLCs", "Sensores", "Protección", "VE", "Reles"],
    url: "https://www.se.com/es/es/",
    logo: "/logos/schneider.png",
  },
  "ABB": {
    nombre: "ABB",
    color: "#FF000F",
    familias: ["Variadores", "Contactores", "Guardamotores", "PLCs", "Protección"],
    url: "https://new.abb.com/es",
    logo: "/logos/abb.png",
  },
  "Siemens": {
    nombre: "Siemens",
    color: "#009999",
    familias: ["Contactores", "PLCs"],
    url: "https://www.siemens.com/global/es.html",
    logo: "/logos/siemens.jpg",
  },
  "Mitsubishi Electric": {
    nombre: "Mitsubishi Electric",
    color: "#E60012",
    familias: ["Variadores", "PLCs"],
    url: "https://www.mitsubishielectric.com/fa/es/",
    logo: "/logos/mitsubishi.png",
  },
  "IFM": {
    nombre: "IFM Electronic",
    color: "#0050AA",
    familias: ["Sensores"],
    url: "https://www.ifm.com/es/es/",
    logo: "/logos/ifm.jpg",
  },
  "Pepperl+Fuchs": {
    nombre: "Pepperl+Fuchs",
    color: "#0066CC",
    familias: ["Sensores"],
    url: "https://www.pepperl-fuchs.com/spain/es/",
    logo: "/logos/pepperl.png",
  },
  "Philips": {
    nombre: "Philips Lighting",
    color: "#0B5394",
    familias: ["Iluminación"],
    url: "https://www.lighting.philips.es/",
    logo: "/logos/philips.jpg",
  },
  "Ledvance": {
    nombre: "Ledvance",
    color: "#003366",
    familias: ["Iluminación"],
    url: "https://www.ledvance.es/",
    logo: "/logos/ledvance.jpg",
  },
  "Zemper": {
    nombre: "Zemper",
    color: "#006633",
    familias: ["Iluminación"],
    url: "https://www.zemper.es/",
    logo: "/logos/zemper.png",
  },
  "Wallbox": {
    nombre: "Wallbox",
    color: "#00BFFF",
    familias: ["VE"],
    url: "https://wallbox.com/es_es/",
    logo: "/logos/wallbox.png",
  },
  "Hager": {
    nombre: "Hager",
    color: "#0055A4",
    familias: ["Protección"],
    url: "https://hager.es/",
    logo: "/logos/hager.png",
  },
  "Fronius": {
    nombre: "Fronius",
    color: "#00A3E0",
    familias: ["Solar"],
    url: "https://www.fronius.com/es-es/",
    logo: "/logos/fronius.png",
  },
  "SMA": {
    nombre: "SMA Solar",
    color: "#009640",
    familias: ["Solar"],
    url: "https://www.sma.es/",
    logo: "/logos/sma.png",
  },
  "Pylontech": {
    nombre: "Pylontech",
    color: "#336699",
    familias: ["Solar"],
    url: "https://www.pylontech.com.cn/",
    logo: "/logos/pylontech.png",
  },
  "Victron": {
    nombre: "Victron Energy",
    color: "#0051A5",
    familias: ["Solar"],
    url: "https://www.victronenergy.es/",
    logo: "",
  },
};

/* Funciones de navegación */
export function getMarcasPorCategoria(categoria) {
  const mapaCategorias = {
    "Variadores": ["Schneider Electric", "ABB", "Mitsubishi Electric"],
    "Contactores": ["Schneider Electric", "ABB", "Siemens"],
    "Guardamotores": ["Schneider Electric", "ABB"],
    "PLCs": ["Schneider Electric", "Siemens", "ABB"],
    "Sensores": ["Schneider Electric", "IFM", "Pepperl+Fuchs"],
    "Protección": ["Schneider Electric", "ABB", "Hager"],
    "Iluminación": ["Philips", "Ledvance", "Zemper"],
    "VE": ["Schneider Electric", "Wallbox"],
    "Solar": ["Fronius", "SMA", "Pylontech", "Victron"],
    "Reles": ["Schneider Electric"],
    "Cables": ["General Cable", "Prysmian", "Nexans", "EXZHELLENT"],
  };
  return (mapaCategorias[categoria] || []).map(m => ({
    nombre: MARCAS[m]?.nombre || m,
    color: MARCAS[m]?.color || "#666",
    familias: MARCAS[m]?.familias || [],
    url: MARCAS[m]?.url || "",
  }));
}

export function getGamasPorMarcaYCategoria(categoria, marca) {
  const productos = CATALOGO_PLANO.filter(p => p.familia === categoria && p.marca === marca);
  const gamas = [...new Set(productos.map(p => p.gama))];
  return gamas.map(g => ({
    nombre: g,
    count: productos.filter(p => p.gama === g).length,
    tipos: [...new Set(productos.filter(p => p.gama === g).map(p => p.tipo))],
  }));
}

export function getReferenciasPorGama(categoria, marca, gama) {
  return CATALOGO_PLANO.filter(p =>
    p.familia === categoria && p.marca === marca && p.gama === gama
  );
}

export function getReferencia(ref) {
  return CATALOGO_PLANO.find(p => p.ref === ref) || null;
}

export default {
  CATALOGO_PLANO,
  CATALOGO_POR_CATEGORIA,
  MARCAS,
  getMarcasPorCategoria,
  getGamasPorMarcaYCategoria,
  getReferenciasPorGama,
  getReferencia,
};
`;

// Guardar archivo
const outputPath = path.join(APP_DIR, 'src/data/catalogoSonepar.js');
fs.writeFileSync(outputPath, jsContent);
console.log(`\n✅ Catálogo fusionado guardado en: ${outputPath}`);
console.log(`   ${mergedRefs.length} referencias totales`);
