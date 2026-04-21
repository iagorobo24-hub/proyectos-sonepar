import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan las variables de entorno de Supabase:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - VITE_SUPABASE_ANON_KEY')
  console.error('   Por favor, configúralas en tu archivo .env o en Vercel')
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Recomendado para aplicaciones web
  }
})

// Helper para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('catalog_products').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('✅ Conexión a Supabase establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error.message)
    return false
  }
}

export default supabase
