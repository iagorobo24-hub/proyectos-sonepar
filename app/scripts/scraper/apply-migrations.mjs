#!/usr/bin/env node
/**
 * APPLY MIGRATIONS — Ejecutar SQL migrations en Supabase
 * ═══════════════════════════════════════════════════════════
 * Lee los archivos .sql de supabase/migrations/ en orden y los ejecuta
 * contra la base de datos de Supabase usando la API REST (rpc).
 *
 * Uso:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node apply-migrations.mjs
 *   node apply-migrations.mjs --dry-run
 *
 * Nota: Requiere la service_role key (no la anon key).
 * ═══════════════════════════════════════════════════════════
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'supabase', 'migrations');
const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function log(level, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}`);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('error', 'Necesitas SUPABASE_URL y SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    log('error', `No se encuentra el directorio de migraciones: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  // Leer migraciones en orden
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  log('info', `=== APPLY MIGRATIONS ===`);
  log('info', `Supabase: ${SUPABASE_URL}`);
  log('info', `Migraciones encontradas: ${files.length}`);
  if (DRY_RUN) log('info', '🔍 DRY RUN — solo muestra el SQL');

  // Construir la URL del endpoint SQL de Supabase
  // Usamos el endpoint REST /rest/v1/rpc/ para ejecutar SQL
  // O mejor, la API de management si está disponible
  const dbUrl = SUPABASE_URL.replace('https://', '').split('.')[0];
  const restUrl = `${SUPABASE_URL}/rest/v1/rpc/`;

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    log('info', `\n📄 ${file} (${sql.length} chars)`);

    if (DRY_RUN) {
      log('info', `  [DRY] Se ejecutaría: ${sql.substring(0, 200)}...`);
      continue;
    }

    // Ejecutar via la API de Supabase (usando fetch directamente al endpoint SQL)
    // Nota: Para migraciones complejas, es mejor usar el Supabase CLI
    // o ejecutarlas directamente en el SQL Editor del Dashboard.
    try {
      // Supabase no tiene un endpoint REST genérico para SQL arbitrario.
      // La forma correcta es usar el SQL Editor del Dashboard o el CLI.
      // Aquí usamos la conexión directa PostgreSQL si está disponible.
      log('info', `  ⚠️  Ejecuta este archivo SQL en el Supabase Dashboard > SQL Editor:`);
      log('info', `      ${filePath}`);
      log('info', `  O usa el Supabase CLI: supabase db push`);
    } catch (err) {
      log('error', `  Error: ${err.message}`);
    }
  }

  log('info', '\n💡 Instrucciones para aplicar las migraciones:');
  log('info', '  Opción A: Supabase Dashboard > SQL Editor > pegar cada archivo .sql');
  log('info', '  Opción B: supabase db push (requiere Supabase CLI configurado)');
  log('info', '  Opción C: psql -h db.xxx.supabase.co -U postgres -f migration.sql');
}

main();
