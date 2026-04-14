import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 10
const rateLimitStore = new Map()

const ALLOWED_ORIGINS = new Set([
  'https://proyectos-sonepar.vercel.app',
  'https://proyectos-sonepar-iagorobo24-hubs-projects.vercel.app',
  'https://proyectos-sonepar-iagorobo24-hub-iagorobo24-hubs-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
])

function getHeader(req, name) {
  const value = req.headers?.[name]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function setCorsHeaders(req, res) {
  const origin = getHeader(req, 'origin')

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function getClientIp(req) {
  const forwardedFor = getHeader(req, 'x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown'
}

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count += 1
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count }
}

function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || ''
}

function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'proyectos-sonepar'
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    return null
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    })
  }

  return getAuth()
}

async function verifyFirebaseTokenIfPresent(req) {
  const authHeader = getHeader(req, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: true, authenticated: false }
  }

  const adminAuth = getFirebaseAdminAuth()

  if (!adminAuth) {
    console.warn('[api/anthropic] Firebase Admin credentials missing; skipping token verification.')
    return { ok: true, authenticated: false }
  }

  try {
    const token = authHeader.slice('Bearer '.length)
    const decodedToken = await adminAuth.verifyIdToken(token)
    return { ok: true, authenticated: true, uid: decodedToken.uid }
  } catch (error) {
    console.error('[api/anthropic] Firebase token verification failed:', error)
    return { ok: false }
  }
}

function getBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }

  return req.body
}

export default async function handler(req, res) {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const origin = getHeader(req, 'origin')
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: 'Forbidden: origin not allowed' })
  }

  const ip = getClientIp(req)
  const rateCheck = checkRateLimit(ip)
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
  res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining))

  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.retryAfter))
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: rateCheck.retryAfter,
    })
  }

  const tokenCheck = await verifyFirebaseTokenIfPresent(req)
  if (!tokenCheck.ok) {
    return res.status(403).json({ error: 'Forbidden: invalid Firebase token' })
  }

  const body = getBody(req)
  if (!body?.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Bad request: missing messages array' })
  }

  const apiKey = getAnthropicApiKey()
  if (!apiKey) {
    console.error('[api/anthropic] Missing Anthropic API key in Vercel environment variables.')
    return res.status(500).json({
      error: 'Anthropic API key is not configured on the server.',
    })
  }

  const maxTokens = Math.min(Number(body.max_tokens) || 800, 2000)
  const payload = {
    ...body,
    max_tokens: maxTokens,
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })

    const data = await anthropicResponse.json().catch(() => null)

    if (!anthropicResponse.ok) {
      console.error('[api/anthropic] Anthropic request failed:', {
        status: anthropicResponse.status,
        body: data,
      })

      return res.status(anthropicResponse.status).json({
        error: data?.error?.message || data?.error || 'Anthropic request failed',
        details: data,
      })
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('[api/anthropic] Unexpected proxy error:', error)
    return res.status(500).json({ error: 'Error connecting to Anthropic API' })
  }
}
