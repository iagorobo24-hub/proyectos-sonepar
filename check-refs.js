const fs = require('fs');
const content = fs.readFileSync('./app/src/data/catalogoSonepar.js', 'utf8');

// Extraer todas las entradas con regex
const entries = [];
const regex = /\{"ref":"([^"]+)","desc":"([^"]*)","marca":"([^"]*)","familia":"([^"]*)","gama":"([^"]*)","tipo":"([^"]*)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  entries.push({ ref: match[1], desc: match[2], marca: match[3], familia: match[4], gama: match[5], tipo: match[6] });
}

console.log('Total entries:', entries.length);

// Mapeo igual que en el código
const CATEGORIA_A_FAMILIAS = {
  "Variadores": ["CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "Contactores": ["CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "Guardamotores": ["CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "PLCs": ["CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "Sensores": ["CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "Protección": ["DISTRIBUCION DE POTENCIA", "CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "Iluminación": ["ILUMINACION"],
  "VE": ["ENERGIAS RENOVABLES", "DISTRIBUCION DE POTENCIA"],
  "Solar": ["ENERGIAS RENOVABLES"],
  "Reles": ["CONTROL Y AUTOMATIZACION INDUSTRIAL"],
  "Cables": ["CABLES"],
};

const CATEGORIA_FILTROS = {
  "Variadores": { tipo: /VARIADOR|FRECUENCIA/i },
  "Contactores": { tipo: /CONTACTOR/i },
  "Guardamotores": { tipo: /GUARDAMOTOR|MOTOR/i },
  "PLCs": { tipo: /PLC|AUT[OÓ]MATA|PROGRAMABLE/i },
  "Sensores": { tipo: /SENSOR|DETECCI[ÓO]N|PRESENCIA/i },
  "Protección": { tipo: /DIFERENCIAL|MAGNETOT[EÉ]RMICO|PROTECCI/i },
  "Iluminación": {},
  "VE": { tipo: /VEH[ÍI]CULO|CARGADOR|ELECTRIC/i },
  "Solar": { tipo: /SOLAR|FOTOVOLTAIC|INVERSOR|PANEL/i },
  "Reles": { tipo: /REL[ÉE]/i },
  "Cables": {},
};

function productosDeCategoria(catId) {
  const familias = CATEGORIA_A_FAMILIAS[catId] || [];
  const filtro = CATEGORIA_FILTROS[catId];
  return entries.filter(p => {
    if (!familias.includes(p.familia)) return false;
    if (filtro && filtro.tipo && !filtro.tipo.test(p.tipo)) return false;
    return true;
  });
}

// Count by category AND by marca
console.log('\n=== REFS POR CATEGÍA Y MARCA ===');
const categorias = ['Variadores', 'Contactores', 'Guardamotores', 'PLCs', 'Sensores', 'Protección', 'Iluminación', 'VE', 'Solar', 'Reles', 'Cables'];

let totalReal = 0;
for (const cat of categorias) {
  const prods = productosDeCategoria(cat);
  const byMarca = {};
  prods.forEach(p => {
    byMarca[p.marca] = (byMarca[p.marca] || 0) + 1;
  });
  
  const marcaSummary = Object.entries(byMarca)
    .sort((a,b) => b[1] - a[1])
    .map(([m, c]) => `${m}: ${c}`)
    .join(', ');
  
  console.log(`${cat}: ${prods.length} refs (${marcaSummary || 'VACIO'})`);
  totalReal += prods.length;
}

console.log(`\nTotal refs con mapeo: ${totalReal} de ${entries.length} total en catálogo`);

// Show what families have the most products
console.log('\n=== TOP FAMILIAS EN CATÁLOGO ===');
const famCount = {};
entries.forEach(p => { famCount[p.familia] = (famCount[p.familia] || 0) + 1; });
Object.entries(famCount).sort((a,b) => b[1] - a[1]).forEach(([f, c]) => {
  console.log(`  ${f}: ${c} refs`);
});

// Show marcas distribution in CONTROL Y AUTOMATIZACION INDUSTRIAL
console.log('\n=== MARCAS en CONTROL Y AUTOMATIZACION INDUSTRIAL ===');
const autoProds = entries.filter(p => p.familia === 'CONTROL Y AUTOMATIZACION INDUSTRIAL');
const autoMarcas = {};
autoProds.forEach(p => { autoMarcas[p.marca] = (autoMarcas[p.marca] || 0) + 1; });
Object.entries(autoMarcas).sort((a,b) => b[1] - a[1]).forEach(([m, c]) => {
  console.log(`  ${m}: ${c} refs`);
});

// Show TIPOS in CONTROL Y AUTOMATIZACION INDUSTRIAL
console.log('\n=== TIPOS en CONTROL Y AUTOMATIZACION INDUSTRIAL ===');
const autoTipos = {};
autoProds.forEach(p => { autoTipos[p.tipo] = (autoTipos[p.tipo] || 0) + 1; });
Object.entries(autoTipos).sort((a,b) => b[1] - a[1]).forEach(([t, c]) => {
  console.log(`  ${t}: ${c} refs`);
});

// Show sample refs per category
console.log('\n=== SAMPLE REFS per category (first 2 each) ===');
for (const cat of categorias) {
  const prods = productosDeCategoria(cat);
  if (prods.length > 0) {
    console.log(`\n${cat}:`);
    prods.slice(0, 3).forEach(p => {
      console.log(`  ${p.ref} | ${p.marca} | ${p.tipo.substring(0, 60)}`);
    });
  }
}
