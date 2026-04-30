/**
 * SUPABASE CLIENT — Conexión al catálogo de productos
 *
 * Variables de entorno requeridas:
 *   VITE_SUPABASE_URL       — URL del proyecto Supabase
 *   VITE_SUPABASE_ANON_KEY  — clave anon (pública, solo lectura)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '⚠️ Supabase no configurado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
  );
}

export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

export default supabase;
