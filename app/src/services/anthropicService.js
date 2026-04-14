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

  try {
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('[Service] Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response (${response.status})`);
    }

    if (!response.ok) {
      const errorMsg = data.error?.message || data.error || `Error ${response.status}`;
      throw new Error(errorMsg);
    }

    // Anthropic returns messages in 'content' array
    const text = data.content?.map(c => c.text || '').join('') || '';
    
    if (!text && !data.error) {
      console.warn('Respuesta de Anthropic sin contenido de texto:', data)
    }

    return { text, raw: data };
  } catch (error) {
    console.error('[Service] AI Call failed:', error);
    throw error;
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
