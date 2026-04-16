/**
 * Unified AI Service for Sonex
 * Supports multiple providers: OpenRouter (default), Groq, Gemini
 * Free models available via OpenRouter
 */

const CLIENT_RATE_LIMIT = {
  maxCalls: 20,
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

/**
 * Call the unified AI API
 * @param {Object} body - Request body
 * @param {string} body.provider - Provider: 'openrouter', 'groq', 'gemini' (default: openrouter)
 * @param {string} body.model - Model ID
 * @param {Array} body.messages - Chat messages
 * @param {string} body.system - System prompt
 * @param {number} body.max_tokens - Max tokens (default: 1000)
 * @param {number} body.temperature - Temperature (default: 0.7)
 */
export async function callAnthropicAI(body) {
  const rateCheck = checkClientRateLimit()
  if (!rateCheck.allowed) {
    throw new Error('Demasiadas peticiones. Espera un momento.')
  }

  try {
    // Use new unified /api/ai endpoint
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: body.provider || 'openrouter',
        model: body.model || 'google/gemini-2.0-flash-thinking-exp-01-21',
        messages: body.messages || [],
        system: body.system || '',
        max_tokens: body.max_tokens || 1000,
        temperature: body.temperature || 0.7
      }),
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('[AI Service] Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response (${response.status})`);
    }

    if (!response.ok) {
      const errorMsg = data.error?.message || data.error || data.hint || `Error ${response.status}`;
      throw new Error(errorMsg);
    }

    const text = data.text || '';

    if (!text && !data.error) {
      console.warn('AI response without text content:', data);
    }

    return { text, raw: data, provider: data.provider, model: data.model };
  } catch (error) {
    console.error('[AI Service] AI Call failed:', error);
    throw error;
  }
}

export function parseAIJsonResponse(text, validator) {
  const parsed = parseAIResponse(text)

  if (!parsed) {
    return { error: true, message: 'La IA devolvio una respuesta invalida. Intenta de nuevo.' }
  }

  if (validator) {
    const validation = validator(parsed)
    if (!validation.valid) {
      return { error: true, message: validation.message || 'Respuesta invalida. Intenta de nuevo.' }
    }
  }

  return { error: false, data: parsed }
}

export function formatAIResponse(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#f1f3f4;padding:2px 4px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/\n/g, '<br>')
}

export default {
  callAnthropicAI,
  parseAIJsonResponse,
  parseAIResponse,
  formatAIResponse,
  sanitizeUrl
}
