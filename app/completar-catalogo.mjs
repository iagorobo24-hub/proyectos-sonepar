/**
 * Añade funciones auxiliares y marcas al catálogo regenerado
 */
import fs from 'fs';
import path from 'path';

const APP_DIR = process.cwd();
const OUTPUT_JS = path.join(APP_DIR, 'src/data/catalogoSonepar.js');

let content = fs.readFileSync(OUTPUT_JS, 'utf8');

const footer = `

/* Catálogo por categoría */
export const CATALOGO_POR_CATEGORIA = {
  automatizacion: CATALOGO_PLANO.filter(p => ['Variadores', 'Contactores', 'Guardamotores', 'PLCs', 'Reles', 'Autómatas', 'AUTOMATIZACION', 'Automatizacion'].some(k => p.familia?.includes(k))).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  iluminacion: CATALOGO_PLANO.filter(p => p.familia?.includes('Iluminación') || p.familia?.includes('ILUMINACION')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  vehiculo_electrico: CATALOGO_PLANO.filter(p => p.familia?.includes('Vehículo') || p.familia?.includes('VEHICULO') || p.familia?.includes('Energías') || p.familia?.includes('RENOVABLES')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  cuadro_electrico: CATALOGO_PLANO.filter(p => p.familia?.includes('Distribución') || p.familia?.includes('DISTRIBUCION') || p.familia?.includes('Protección') || p.familia?.includes('POTENCIA')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  energia_solar: CATALOGO_PLANO.filter(p => p.familia?.includes('Solar') || p.familia?.includes('SOLAR') || p.familia?.includes('Renovables') || p.familia?.includes('RENOVABLES')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  clima: CATALOGO_PLANO.filter(p => p.familia?.includes('HVAC') || p.familia?.includes('Climatización') || p.familia?.includes('CLIMATIZACION')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  cables: CATALOGO_PLANO.filter(p => p.familia?.includes('CABLE') || p.familia?.includes('Cable')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
  herramientas: CATALOGO_PLANO.filter(p => p.familia?.includes('Herramienta') || p.familia?.includes('HERRAMIENTA') || p.familia?.includes('Seguridad') || p.familia?.includes('FONTANERIA')).map(p => ({ ref: p.ref, desc: p.desc, precio: p.precio })),
};

/* MARCAS detectadas */
export const MARCAS = {
  "Schneider Electric": { nombre: "Schneider Electric", color: "#3DCD58", familias: ["Variadores", "Contactores", "PLCs", "Protección"], url: "https://www.se.com/es/es/", logo: "/logos/schneider.png" },
  "ABB": { nombre: "ABB", color: "#FF000F", familias: ["Variadores", "Contactores", "PLCs"], url: "https://new.abb.com/es", logo: "/logos/abb.png" },
  "Siemens": { nombre: "Siemens", color: "#009999", familias: ["Contactores", "PLCs"], url: "https://www.siemens.com/global/es.html", logo: "/logos/siemens.jpg" },
  "Mitsubishi Electric": { nombre: "Mitsubishi Electric", color: "#E60012", familias: ["Variadores", "PLCs"], url: "https://www.mitsubishielectric.com/fa/es/", logo: "/logos/mitsubishi.png" },
  "IFM": { nombre: "IFM Electronic", color: "#0050AA", familias: ["Sensores"], url: "https://www.ifm.com/es/es/", logo: "/logos/ifm.jpg" },
  "Pepperl+Fuchs": { nombre: "Pepperl+Fuchs", color: "#0066CC", familias: ["Sensores"], url: "https://www.pepperl-fuchs.com/spain/es/", logo: "/logos/pepperl.png" },
  "Philips": { nombre: "Philips Lighting", color: "#0B5394", familias: ["Iluminación"], url: "https://www.lighting.philips.es/", logo: "/logos/philips.jpg" },
  "Ledvance": { nombre: "Ledvance", color: "#003366", familias: ["Iluminación"], url: "https://www.ledvance.es/", logo: "/logos/ledvance.jpg" },
  "Zemper": { nombre: "Zemper", color: "#006633", familias: ["Iluminación"], url: "https://www.zemper.es/", logo: "/logos/zemper.png" },
  "Wallbox": { nombre: "Wallbox", color: "#00BFFF", familias: ["VE"], url: "https://wallbox.com/es_es/", logo: "/logos/wallbox.png" },
  "Hager": { nombre: "Hager", color: "#0055A4", familias: ["Protección"], url: "https://hager.es/", logo: "/logos/hager.png" },
  "Fronius": { nombre: "Fronius", color: "#00A3E0", familias: ["Solar"], url: "https://www.fronius.com/es-es/", logo: "/logos/fronius.png" },
  "SMA": { nombre: "SMA Solar", color: "#009640", familias: ["Solar"], url: "https://www.sma.es/", logo: "/logos/sma.png" },
  "Pylontech": { nombre: "Pylontech", color: "#336699", familias: ["Solar"], url: "https://www.pylontech.com.cn/", logo: "/logos/pylontech.png" },
  "Victron": { nombre: "Victron Energy", color: "#0051A5", familias: ["Solar"], url: "https://www.victronenergy.es/", logo: "" },
  "Simon": { nombre: "Simon", color: "#004B87", familias: ["Automatización Edificios"], url: "https://www.simon.es/", logo: "" },
  "Niessen": { nombre: "Niessen", color: "#003366", familias: ["Automatización Edificios"], url: "https://www.niessen.es/", logo: "" },
  "Legrand": { nombre: "Legrand", color: "#0066B3", familias: ["Distribución", "Protección"], url: "https://www.legrand.es/", logo: "" },
  "Roca": { nombre: "Roca", color: "#003366", familias: ["Fontanería"], url: "https://www.roca.es/", logo: "" },
  "General Cable": { nombre: "General Cable", color: "#0066B3", familias: ["Cables"], url: "https://www.generalcable.com/", logo: "" },
};

/* Funciones de navegación */
export function getMarcasPorCategoria(categoria) {
  const mapa = {
    "Variadores": ["Schneider Electric", "ABB", "Mitsubishi Electric"],
    "Contactores": ["Schneider Electric", "ABB", "Siemens"],
    "Guardamotores": ["Schneider Electric", "ABB"],
    "PLCs": ["Schneider Electric", "Siemens", "ABB"],
    "Sensores": ["Schneider Electric", "IFM", "Pepperl+Fuchs"],
    "Protección": ["Schneider Electric", "ABB", "Hager", "Legrand"],
    "Iluminación": ["Philips", "Ledvance", "Zemper"],
    "VE": ["Schneider Electric", "Wallbox"],
    "Solar": ["Fronius", "SMA", "Pylontech", "Victron"],
    "Reles": ["Schneider Electric"],
    "Cables": ["General Cable", "Prysmian", "Nexans", "EXZHELLENT"],
  };
  return (mapa[categoria] || []).map(m => ({ nombre: MARCAS[m]?.nombre || m, color: MARCAS[m]?.color || "#666", familias: MARCAS[m]?.familias || [], url: MARCAS[m]?.url || "" }));
}

export function getGamasPorMarcaYCategoria(categoria, marca) {
  const productos = CATALOGO_PLANO.filter(p => p.familia === categoria && p.marca === marca);
  const gamas = [...new Set(productos.map(p => p.gama))].filter(Boolean);
  return gamas.map(g => ({ nombre: g, count: productos.filter(p => p.gama === g).length, tipos: [...new Set(productos.filter(p => p.gama === g).map(p => p.tipo))].filter(Boolean) }));
}

export function getReferenciasPorGama(categoria, marca, gama) {
  return CATALOGO_PLANO.filter(p => p.familia === categoria && p.marca === marca && p.gama === gama);
}

export function getReferencia(ref) {
  return CATALOGO_PLANO.find(p => p.ref === ref) || null;
}

export default { CATALOGO_PLANO, CATALOGO_POR_CATEGORIA, MARCAS, getMarcasPorCategoria, getGamasPorMarcaYCategoria, getReferenciasPorGama, getReferencia };
`;

fs.writeFileSync(OUTPUT_JS, content + footer);
console.log('✅ Funciones auxiliares y marcas añadidas al catálogo');
