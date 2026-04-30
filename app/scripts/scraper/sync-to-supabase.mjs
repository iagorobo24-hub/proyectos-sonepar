#!/usr/bin/env node
/**
 * SYNC: Scraper JSON → Supabase
 * ═══════════════════════════════════════════════════════════
 * Lee el JSON generado por sonepar-scraper.mjs y sincroniza
 * los datos con las tablas de Supabase.
 *
 * Estrategia:
 *   - Upsert de marcas (ON CONFLICT name)
 *   - Upsert de categorías (construye árbol desde hierarchy.json)
 *   - Upsert de productos (ON CONFLICT ref_fabricante)
 *   - Insert de precios, documentos, specs
 *   - Registra la scrape_run
 *
 * Uso:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node sync-to-supabase.mjs
 *   node sync-to-supabase.mjs --input ./output/catalogo-sonepar.json
 *   node sync-to-supabase.mjs --dry-run   # solo muestra lo que haría
 *
 * Requisitos:
 *   npm install @supabase/supabase-js
 * ═══════════════════════════════════════════════════════════
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ─────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role key (escritura)

const INPUT_FILE = getArgValue('--input')
  || path.join(__dirname, 'output', 'catalogo-sonepar.json');
const HIERARCHY_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'hierarchy.json');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

// ── Logger ─────────────────────────────────────────────────
function log(level, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}`);
}

// ── Slugify ────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('error', 'Necesitas SUPABASE_URL y SUPABASE_SERVICE_KEY como variables de entorno');
    log('info', 'La service_role key tiene permisos de escritura (bypass RLS)');
    log('info', 'Encuéntrala en: Supabase Dashboard > Settings > API > service_role');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_FILE)) {
    log('error', `No se encuentra el archivo de entrada: ${INPUT_FILE}`);
    log('info', 'Ejecuta primero el scraper: node sonepar-scraper.mjs');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const rawProducts = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  log('info', `=== SYNC TO SUPABASE ===`);
  log('info', `Productos en JSON: ${rawProducts.length.toLocaleString()}`);
  if (DRY_RUN) log('info', '🔍 DRY RUN — no se escribirán datos');

  // ── 1. Registrar scrape run ──
  let runId = null;
  if (!DRY_RUN) {
    const { data } = await supabase.from('scrape_runs').insert({
      status: 'running',
      config: { inputFile: INPUT_FILE, batchSize: BATCH_SIZE },
    }).select('id').single();
    runId = data?.id;
    log('info', `Scrape run: ${runId}`);
  }

  try {
    // ── 2. Sync marcas ──
    log('info', '\n📦 Sincronizando marcas...');
    const brandNames = [...new Set(rawProducts.map(p => (p.marca || '').toUpperCase()).filter(Boolean))];
    const brandMap = new Map(); // name → UUID

    if (DRY_RUN) {
      // Populate brandMap with placeholder IDs so product prep loop works
      for (const name of brandNames) {
        brandMap.set(name, `dry-run-brand-${slugify(name)}`);
      }
    } else {
      for (const name of brandNames) {
        const { data, error } = await supabase
          .from('brands')
          .upsert({ name, slug: slugify(name) }, { onConflict: 'name' })
          .select('id, name')
          .single();
        if (error) {
          log('warn', `  Error upsert marca "${name}": ${error.message}`);
        } else {
          brandMap.set(name, data.id);
        }
      }
    }
    log('info', `  ✅ ${brandNames.length} marcas procesadas`);

    // ── 3. Sync categorías desde hierarchy.json ──
    log('info', '\n📂 Sincronizando categorías...');
    const categoryMap = new Map(); // "FAMILIA|SUBFAMILIA|TIPO" → UUID
    let catCount = 0;

    if (fs.existsSync(HIERARCHY_FILE) && !DRY_RUN) {
      const hierarchy = JSON.parse(fs.readFileSync(HIERARCHY_FILE, 'utf8'));

      for (const [familiaName, marcas] of Object.entries(hierarchy)) {
        // Upsert Familia (level 1)
        const { data: fam } = await supabase
          .from('categories')
          .upsert(
            { name: familiaName, slug: slugify(familiaName), level: 1, parent_id: null },
            { onConflict: 'name,parent_id' }
          )
          .select('id')
          .single();
        const famId = fam?.id;
        if (famId) categoryMap.set(familiaName, famId);

        // Recoger subfamilias y tipos de todas las marcas
        const subfamilias = new Map(); // subfamilia → Set(tipos)
        for (const [, subs] of Object.entries(marcas)) {
          for (const [subName, tipos] of Object.entries(subs)) {
            if (!subfamilias.has(subName)) subfamilias.set(subName, new Set());
            for (const tipo of tipos) subfamilias.get(subName).add(tipo);
          }
        }

        // Upsert Subfamilias (level 2)
        for (const [subName, tipos] of subfamilias.entries()) {
          const { data: sub } = await supabase
            .from('categories')
            .upsert(
              { name: subName, slug: slugify(subName), level: 2, parent_id: famId },
              { onConflict: 'name,parent_id' }
            )
            .select('id')
            .single();
          const subId = sub?.id;
          if (subId) categoryMap.set(`${familiaName}|${subName}`, subId);

          // Upsert Tipos (level 3)
          for (const tipoName of tipos) {
            const { data: tip } = await supabase
              .from('categories')
              .upsert(
                { name: tipoName, slug: slugify(tipoName), level: 3, parent_id: subId },
                { onConflict: 'name,parent_id' }
              )
              .select('id')
              .single();
            if (tip?.id) {
              categoryMap.set(`${familiaName}|${subName}|${tipoName}`, tip.id);
              catCount++;
            }
          }
        }
      }
    }
    log('info', `  ✅ ${catCount} categorías (tipos) procesadas`);

    // ── 4. Sync productos en batches ──
    log('info', '\n📤 Sincronizando productos...');
    let uploaded = 0;
    let errors = 0;
    let newProducts = 0;
    const seenRefs = new Set();

    for (let i = 0; i < rawProducts.length; i += BATCH_SIZE) {
      const batch = rawProducts.slice(i, i + BATCH_SIZE);
      const productsToUpsert = [];
      const pricesToInsert = [];
      const docsToInsert = [];
      const specsToInsert = [];

      for (const p of batch) {
        const ref = (p.ref || '').toUpperCase().replace(/\s+/g, '');
        if (!ref || seenRefs.has(ref)) continue;
        seenRefs.add(ref);

        const brandId = brandMap.get((p.marca || '').toUpperCase());
        if (!brandId) continue;

        // Buscar category_id del tipo más específico
        const categoryKey = [p.familia, p.gama || p.subfamilia, p.tipo].filter(Boolean).join('|');
        const categoryId = categoryMap.get(categoryKey) || categoryMap.get(p.familia) || null;

        productsToUpsert.push({
          ref_fabricante: ref,
          ref_sonepar: p.refSonepar || null,
          ean: p.ean || null,
          name: p.nombre || ref,
          brand_id: brandId,
          category_id: categoryId,
          familia: p.familia || null,
          subfamilia: p.gama || p.subfamilia || null,
          tipo: p.tipo || null,
          unit: p.unit || 'ud',
          image_url: p.imageUrl || null,
          sonepar_url: p.productUrl || null,
          is_active: true,
          scraped_at: p.scrapedAt || new Date().toISOString(),
        });

        // Precio
        const precio = parseFloat(p.precio) || 0;
        const pvp = parseFloat(p.pvp) || precio;
        if (precio > 0 || pvp > 0) {
          pricesToInsert.push({
            _ref: ref,  // placeholder, reemplazado después del upsert
            precio_tarifa: pvp,
            precio_neto: precio,
            descuento_pct: pvp > 0 && precio > 0 ? Math.round((1 - precio / pvp) * 100 * 100) / 100 : null,
            source: 'scraper',
          });
        }

        // Documentos
        if (p.documents && Array.isArray(p.documents)) {
          for (const d of p.documents) {
            if (d.url) {
              docsToInsert.push({
                _ref: ref,
                doc_type: d.type || 'hoja_datos',
                name: d.name || 'Documento',
                url: d.url,
                file_format: d.format || 'pdf',
              });
            }
          }
        }
        if (p.pdf && typeof p.pdf === 'string') {
          docsToInsert.push({
            _ref: ref,
            doc_type: 'ficha_tecnica',
            name: 'Ficha técnica',
            url: p.pdf,
            file_format: 'pdf',
          });
        }

        // Especificaciones
        if (p.specifications && Array.isArray(p.specifications)) {
          for (const s of p.specifications) {
            if (s.key && s.value) {
              specsToInsert.push({
                _ref: ref,
                spec_group: s.group || 'General',
                spec_key: s.key,
                spec_value: s.value,
                spec_unit: s.unit || '',
              });
            }
          }
        }
      }

      if (DRY_RUN) {
        uploaded += productsToUpsert.length;
        const progress = ((i + batch.length) / rawProducts.length * 100).toFixed(1);
        log('info', `  [DRY] ${progress}% — ${productsToUpsert.length} productos en batch`);
        continue;
      }

      // Upsert productos
      if (productsToUpsert.length > 0) {
        // Check which refs already exist to track new vs updated
        const batchRefs = productsToUpsert.map(p => p.ref_fabricante);
        const { data: existing } = await supabase
          .from('products')
          .select('ref_fabricante')
          .in('ref_fabricante', batchRefs);
        const existingRefs = new Set((existing || []).map(e => e.ref_fabricante));

        const { data: upserted, error } = await supabase
          .from('products')
          .upsert(productsToUpsert, { onConflict: 'ref_fabricante' })
          .select('id, ref_fabricante');

        if (error) {
          errors += productsToUpsert.length;
          log('warn', `  Error batch productos: ${error.message}`);
        } else {
          uploaded += upserted.length;
          for (const row of upserted) {
            if (!existingRefs.has(row.ref_fabricante)) newProducts++;
          }
          const refToId = new Map(upserted.map(r => [r.ref_fabricante, r.id]));

          // Insert precios
          const prices = pricesToInsert
            .filter(p => refToId.has(p._ref))
            .map(p => ({
              product_id: refToId.get(p._ref),
              precio_tarifa: p.precio_tarifa,
              precio_neto: p.precio_neto,
              descuento_pct: p.descuento_pct,
              source: p.source,
            }));
          if (prices.length > 0) {
            await supabase.from('product_prices').insert(prices);
          }

          // Insert documentos
          const docs = docsToInsert
            .filter(d => refToId.has(d._ref))
            .map(d => ({
              product_id: refToId.get(d._ref),
              doc_type: d.doc_type,
              name: d.name,
              url: d.url,
              file_format: d.file_format,
            }));
          if (docs.length > 0) {
            await supabase.from('product_documents').upsert(docs, {
              onConflict: 'product_id,url',
            });
          }

          // Insert specs (upsert para no duplicar)
          const specs = specsToInsert
            .filter(s => refToId.has(s._ref))
            .map(s => ({
              product_id: refToId.get(s._ref),
              spec_group: s.spec_group,
              spec_key: s.spec_key,
              spec_value: s.spec_value,
              spec_unit: s.spec_unit,
            }));
          if (specs.length > 0) {
            await supabase.from('product_specifications').upsert(specs, {
              onConflict: 'product_id,spec_key',
            });
          }
        }
      }

      const progress = ((i + batch.length) / rawProducts.length * 100).toFixed(1);
      log('info', `  📊 ${progress}% — ${uploaded}/${seenRefs.size} productos (${errors} errores)`);
    }

    // ── 5. Actualizar scrape run ──
    if (runId && !DRY_RUN) {
      await supabase.from('scrape_runs').update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        total_products: uploaded,
        new_products: newProducts,
        updated_products: uploaded - newProducts,
        errors,
      }).eq('id', runId);
    }

    log('info', '\n🎉 SINCRONIZACIÓN COMPLETADA');
    log('info', `  ✅ Productos sincronizados: ${uploaded}`);
    log('info', `  ❌ Errores: ${errors}`);
    log('info', `  📂 Marcas: ${brandNames.length}`);
    log('info', `  📂 Categorías: ${catCount}`);

  } catch (err) {
    log('error', `Error fatal: ${err.message}`);
    log('error', err.stack);
    if (runId && !DRY_RUN) {
      await supabase.from('scrape_runs').update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_log: err.message,
      }).eq('id', runId);
    }
    process.exit(1);
  }
}

main();
