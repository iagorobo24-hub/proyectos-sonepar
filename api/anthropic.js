/**
 * Vercel Edge Function — Proxy Anthropic API
 * Seguridad: autenticación Firebase, rate limiting, validación de origen
 */

import { initializeApp } from 'firebase/app'
import { getAuth, verifyIdToken } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/* ── Configuración Firebase Admin (solo servidor) ── */
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'proyectos-sonepar',
}

/* ── Rate limiting simple en memoria (por IP) ── */
const RATE_LIMIT_WINDOW_MS = 60 * 1000       // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10            // máx peticiones por ventana
const rateLimitStore = new Map()              // IP -> { count, resetAt }

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count }
}

/* ── Limpieza periódica del store ── */
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip)
  }
}, RATE_LIMIT_WINDOW_MS * 2)

/* ── Handler principal ── */
export default async function handler(req, res) {
  /* Solo permite POST */
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  /* ── 1. Verificar Origin (CORS) ── */
  const allowedOrigins = [
    'https://proyectos-sonepar.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ]
  const origin = req.headers.get('origin')
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden: origin not allowed' })
  }

  /* ── 2. Rate limiting por IP ── */
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const rateCheck = checkRateLimit(ip)

  res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
  res.headers.set('X-RateLimit-Remaining', String(rateCheck.remaining))

  if (!rateCheck.allowed) {
    res.headers.set('Retry-After', String(rateCheck.retryAfter))
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: rateCheck.retryAfter,
    })
  }

  /* ── 3. Verificar autenticación Firebase ── */
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing Firebase token' })
  }

  try {
    const token = authHeader.split('Bearer ')[1]
    /* Verificar token con Firebase Admin SDK */
    const decodedToken = await verifyIdToken(token)
    if (!decodedToken) {
      return res.status(403).json({ error: 'Forbidden: invalid token' })
    }
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: token verification failed' })
  }

  /* ── 4. Validar body ── */
  const body = req.body
  if (!body || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Bad request: missing messages array' })
  }

  /* Limitar max_tokens para evitar abuso */
  const maxTokens = Math.min(body.max_tokens || 800, 2000)

  /* ── 5. Forward a Anthropic ── */
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...body,
        max_tokens: maxTokens,
      }),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Error connecting to Anthropic API' })
  }
}
