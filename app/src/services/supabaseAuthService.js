/**
 * SERVICIO DE AUTENTICACIÓN (SUPABASE)
 * Proporciona funciones de autenticación usando Supabase Auth
 * Compatible con Google Sign-In y otros proveedores OAuth
 */
import { supabase } from '../supabase/supabaseConfig'

/**
 * Iniciar sesión con Google
 * @returns {Object} Objeto con datos de usuario y error
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    return { user: null, session: null, error }
  }
}

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Object} Objeto con datos de usuario y error
 */
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing in with email:', error)
    return { user: null, session: null, error }
  }
}

/**
 * Registrarse con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Object} Objeto con datos de usuario y error
 */
export async function signUpWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { user: null, session: null, error }
  }
}

/**
 * Cerrar sesión
 * @returns {Object} Objeto con error si existe
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error }
  }
}

/**
 * Obtener el usuario actual
 * @returns {Object} Usuario actual o null
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Obtener la sesión actual
 * @returns {Object} Sesión actual o null
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

/**
 * Escuchar cambios en el estado de autenticación
 * @param {Function} callback - Función a ejecutar cuando cambie el auth
 * @returns {Function} Función para cancelar la suscripción
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session)
    }
  )

  return subscription
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} True si está autenticado
 */
export async function isAuthenticated() {
  const session = await getCurrentSession()
  return !!session
}

/**
 * Recuperar contraseña
 * @param {string} email - Email del usuario
 * @returns {Object} Objeto con error si existe
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { error }
  }
}

/**
 * Actualizar contraseña
 * @param {string} newPassword - Nueva contraseña
 * @returns {Object} Objeto con error si existe
 */
export async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error updating password:', error)
    return { error }
  }
}

/**
 * Obtener metadatos del usuario desde la tabla profiles
 * @param {string} userId - ID del usuario
 * @returns {Object} Metadatos del usuario
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * Actualizar metadatos del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} Objeto con error si existe
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { error }
  }
}

export default {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  getCurrentSession,
  onAuthStateChange,
  isAuthenticated,
  resetPassword,
  updatePassword,
  getUserProfile,
  updateUserProfile
}
