/**
 * Servicio para llamadas a la API de Anthropic
 * Incluye: autenticación Firebase, validación JSON, rate limiting cliente
 */

import { auth } from '../firebase/firebaseConfig'

/* ── Rate limiting del lado del cliente ── */
const CLIENT_RATE_LIMIT = {
  maxCalls: 10,          // máx llamadas por minuto
  windowMs: 60 * 1000,   // ventana de 1 minuto
}

const clientRateLimitStore = { calls: [] }

function checkClientRateLimit() {
  const now = Date.now()
  clientRateLimitStore.calls = clientRateLimitStore.calls.filter(t => now - t < CLIENT_RATE_LIMIT.windowMs)
  if (clientRateLimitStore.calls.length >= CLIENT_RATE_LIMIT.maxCalls) {
    return { allowed: false, remaining: 0 }
  }
  clientRateLimitStore.calls.push(now)
  return { allowed: true, remaining: CLIENT_RATE_LIMIT.maxCalls - clientRateLimitStore.calls.length }
}

/* ── Validar respuesta JSON de IA ── */
function parseAIResponse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.warn('AI response parse error:', e.message)
    return null
  }
}

/* ── Sanitizar URLs ── */
export function sanitizeUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const allowed = ['http:', 'https:', 'mailto:', 'tel:']
    if (!allowed.includes(parsed.protocol)) return '#'
    return url
  } catch {
    return '#'
  }
}

/* ── Función principal para llamadas a la IA ── */
export async function callAnthropicAI(body) {
  /* 1. Rate limit cliente */
  const rateCheck = checkClientRateLimit()
  if (!rateCheck.allowed) {
    throw new Error('Demasiadas peticiones. Espera un momento.')
  }

  /* 2. Obtener token Firebase */
  const user = auth.currentUser
  if (!user) {
    throw new Error('No autenticado')
  }
  const token = await user.getIdToken()

  /* 3. Llamada al proxy */
  const response = await fetch('/api/anthropic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  /* 4. Manejar errores HTTP */
  if (response.status === 429) {
    const data = await response.json().catch(() => ({}))
    throw new Error(`Límite excedido. Reintenta en ${data.retryAfter || '?'}s`)
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error('Sesión expirada. Inicia sesión de nuevo.')
  }
  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`)
  }

  /* 5. Parsear y validar JSON */
  const data = await response.json()
  const text = data.content?.map(i => i.text || '').join('') || ''

  return { text, raw: data }
}

/* ── Función auxiliar para parsear JSON de IA con validación ── */
export function parseAIJsonResponse(text, validator) {
  const parsed = parseAIResponse(text)
  if (!parsed) {
    return { error: true, message: 'La IA devolvió una respuesta inválida. Intenta de nuevo.' }
  }
  if (validator && typeof validator === 'function') {
    const valid = validator(parsed)
    if (!valid) {
      return { error: true, message: 'Respuesta incompleta. Intenta de nuevo.' }
    }
  }
  return parsed
}

/* ── Hook de rate limiting para componentes React ── */
export function useAIRateLimit() {
  const check = () => checkClientRateLimit()
  return { checkRateLimit: check }
}

export default { callAnthropicAI, parseAIJsonResponse, sanitizeUrl, useAIRateLimit }
