import { chromium } from 'playwright';
import fs from 'fs';

async function extractViaState() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('🚀 Intentando extraer mapa jerárquico vía metadatos internos...');

  try {
    // Vamos a la home, que suele tener el menú cargado en el HTML
    await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded' });
    
    // Extraer el árbol de categorías del menú de navegación (está oculto en el DOM)
    const tree = await page.evaluate(() => {
      const results = {};
      const n1Items = document.querySelectorAll('.category-menu-item--level-1');
      
      n1Items.forEach(n1 => {
        const n1Name = n1.querySelector('.category-menu-item-link')?.innerText.trim();
        if (n1Name) {
          results[n1Name] = {};
          const n2Items = n1.querySelectorAll('.category-menu-item--level-2');
          n2Items.forEach(n2 => {
            const n2Name = n2.querySelector('.category-menu-item-link')?.innerText.trim();
            if (n2Name) {
              const n3Items = Array.from(n2.querySelectorAll('.category-menu-item--level-3'))
                .map(n3 => n3.innerText.trim());
              results[n1Name][n2Name] = n3Items;
            }
          });
        }
      });
      return results;
    });

    if (Object.keys(tree).length > 0) {
      fs.writeFileSync('./sonepar-catalog-scraper/mapa-total.json', JSON.stringify(tree, null, 2));
      console.log('✅ MAPA TOTAL EXTRAÍDO DEL DOM');
      console.log('Categorías encontradas:', Object.keys(tree).join(', '));
    } else {
      console.log('⚠️ No se pudo extraer del DOM. Probando vía inspección de script tags...');
      // Buscar objetos JSON en los scripts (Sonepar usa Bloomreach/Solr que suele dejar rastros)
      const scripts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script'))
          .map(s => s.innerHTML)
          .filter(s => s.includes('categories') || s.includes('menuTree'))
          .slice(0, 5);
      });
      fs.writeFileSync('./sonepar-catalog-scraper/raw-scripts.txt', scripts.join('\n---\n'));
    }

  } catch (e) {
    console.error('❌ Error fatal:', e.message);
  } finally {
    await browser.close();
  }
}

extractViaState().catch(console.error);
