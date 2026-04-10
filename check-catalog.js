const fs = require('fs');
const content = fs.readFileSync('app/src/data/catalogoSonepar.js', 'utf8');
const refs = content.match(/ref:\s*"[^"]+"/g);
console.log('Total refs encontradas:', refs ? refs.length : 0);
if (refs) {
  console.log('\nPrimeras 3:');
  refs.slice(0, 3).forEach(r => console.log(' ', r));
  console.log('\nÚltimas 3:');
  refs.slice(-3).forEach(r => console.log(' ', r));
}

// Buscar comillas sueltas o mal formadas
const malFormadas = content.match(/ref:\s*''/g) || content.match(/ref:\s*""/g) || content.match(/ref:\s*'/g);
console.log('\nEntradas mal formadas:', malFormadas ? malFormadas.length : 0);
