# AI Connection Reboot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reliable, simple connection between Sonex and the Anthropic Claude API using Vercel Functions as a proxy.

**Architecture:** A lightweight Node.js 22 proxy function that forwards requests to Anthropic. We isolate the issue by removing Firebase Admin verification temporarily and ensuring the runtime and routing are correct.

**Tech Stack:** React 19, Vercel Functions (Node.js 22), Anthropic API.

---

### Task 1: Minimalist Proxy Function

**Files:**
- Modify: `api/anthropic.mjs`

- [ ] **Step 1: Simplify proxy logic to the bare minimum**

```javascript
export default async function handler(req, res) {
  // 1. Basic CORS for local development and Vercel
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('[API] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const body = req.body;
    
    // Log payload for debugging (remove in production)
    console.log('[API] Received payload:', JSON.stringify(body));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-3-5-sonnet-20240620',
        max_tokens: Math.floor(body.max_tokens || 1000),
        system: body.system || '',
        messages: body.messages || [],
        stream: false
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API] Anthropic error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[API] Proxy error:', error);
    return res.status(500).json({ error: 'Failed to connect to Anthropic API', details: error.message });
  }
}
```

- [ ] **Step 2: Commit changes**

```bash
git add api/anthropic.mjs
git commit -m "chore(ai): simplify proxy to isolate connection issues"
```

---

### Task 2: Vercel Configuration Alignment

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Simplify vercel.json rewrites and headers**

```json
{
  "buildCommand": "cd app && npm install && npm run build",
  "outputDirectory": "app/dist",
  "functions": {
    "api/*.mjs": {
      "runtime": "nodejs22.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/anthropic",
      "destination": "/api/anthropic.mjs"
    },
    {
      "source": "/api/extract-pdf",
      "destination": "/api/extract-pdf.mjs"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- [ ] **Step 2: Commit changes**

```bash
git add vercel.json
git commit -m "config(vercel): align function routing and runtime"
```

---

### Task 3: Robust Client Service

**Files:**
- Modify: `app/src/services/anthropicService.js`

- [ ] **Step 1: Update callAnthropicAI to use simple POST and improved error reporting**

```javascript
export async function callAnthropicAI(body) {
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
    
    return { text, raw: data };
  } catch (error) {
    console.error('[Service] AI Call failed:', error);
    throw error;
  }
}
```

- [ ] **Step 2: Commit changes**

```bash
git add app/src/services/anthropicService.js
git commit -m "refactor(service): simplify client-side AI call logic"
```

---

### Task 4: Sonex Connection Test

**Files:**
- Modify: `app/src/tools/Sonex.jsx`

- [ ] **Step 1: Ensure Sonex uses the corrected model and handles errors visibly**

```javascript
// Inside Sonex.jsx, ensure generatingRespuestaIA is robust
const generarRespuestaIA = async (userMessage) => {
  try {
    const { callAnthropicAI } = await import('../services/anthropicService');
    const systemPrompt = `Eres SONEX, el asistente técnico experto de Sonepar España. Responde de forma concisa.`;
    
    const { text } = await callAnthropicAI({ 
      model: "claude-3-5-sonnet-20240620", 
      max_tokens: 1000, 
      system: systemPrompt, 
      messages: [{ role: "user", content: userMessage }] 
    });
    
    return text || "La IA no devolvió contenido.";
  } catch (error) {
    console.error("Sonex AI Error:", error);
    return `Error: ${error.message || "No se pudo conectar con SONEX."}`;
  }
};
```

- [ ] **Step 2: Commit and final push**

```bash
git add app/src/tools/Sonex.jsx
git commit -m "fix(sonex): improve error visibility and use simple connection"
git push origin main
```
