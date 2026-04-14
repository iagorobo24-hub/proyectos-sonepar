/**
 * Servicio para llamadas a la API de Anthropic
 * Incluye: soporte para sesion opcional de Firebase, validacion JSON y rate limiting cliente
 */

import { auth } from '../firebase/firebaseConfig'

const CLIENT_RATE_LIMIT = {
  maxCalls: 10,
  windowMs: 60 * 1000,
}

const clientRateLimitStore = { calls: [] }

function checkClientRateLimit() {
  const now = Date.now()
  clientRateLimitStore.calls = clientRateLimitStore.calls.filter((t) => now - t < CLIENT_RATE_LIMIT.windowMs)

  if (clientRateLimitStore.calls.length >= CLIENT_RATE_LIMIT.maxCalls) {
    return { allowed: false, remaining: 0 }
  }

  clientRateLimitStore.calls.push(now)
  return { allowed: true, remaining: CLIENT_RATE_LIMIT.maxCalls - clientRateLimitStore.calls.length }
}

function parseAIResponse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.warn('AI response parse error:', error.message)
    return null
  }
}

export function sanitizeUrl(url) {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    const allowed = ['http:', 'https:', 'mailto:', 'tel:']
    return allowed.includes(parsed.protocol) ? url : '#'
  } catch {
    return '#'
  }
}

export async function callAnthropicAI(body) {
  const rateCheck = checkClientRateLimit()
  if (!rateCheck.allowed) {
    throw new Error('Demasiadas peticiones. Espera un momento.')
  }

  let token = null
  const user = auth.currentUser

  if (user) {
    try {
      token = await user.getIdToken()
    } catch (error) {
      console.warn('No se pudo obtener el token Firebase:', error)
    }
  }

  try {
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get('content-type')
    let data = null
    
    if (contentType?.includes('application/json')) {
      data = await response.json().catch(() => null)
    } else {
      const textError = await response.text().catch(() => '')
      console.error('La API no devolvió JSON:', textError)
      throw new Error(`Error del servidor (${response.status}): Respuesta no válida.`)
    }

    if (response.status === 429) {
      throw new Error(`Límite excedido. Reintenta en ${data?.retryAfter || '?'}s`)
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(data?.error || 'No tienes permisos para usar la IA ahora mismo.')
    }

    if (!response.ok) {
      throw new Error(data?.error || `Error del servidor: ${response.status}`)
    }

    if (!data) {
      throw new Error('La IA devolvió una respuesta vacía.')
    }

    const text = Array.isArray(data.content)
      ? data.content.map((item) => item?.text || '').join('')
      : ''

    if (!text && !data.error) {
      console.warn('Respuesta de Anthropic sin contenido de texto:', data)
    }

    return { text, raw: data }
  } catch (error) {
    console.error('Error en callAnthropicAI:', error)
    throw error
  }
}

export function parseAIJsonResponse(text, validator) {
  const parsed = parseAIResponse(text)

  if (!parsed) {
    return { error: true, message: 'La IA devolvio una respuesta invalida. Intenta de nuevo.' }
  }

  if (validator && typeof validator === 'function') {
    const valid = validator(parsed)
    if (!valid) {
      return { error: true, message: 'Respuesta incompleta. Intenta de nuevo.' }
    }
  }

  return parsed
}

export function useAIRateLimit() {
  return { checkRateLimit: checkClientRateLimit }
}

export default { callAnthropicAI, parseAIJsonResponse, sanitizeUrl, useAIRateLimit }
