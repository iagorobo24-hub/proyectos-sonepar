export default async function handler(req, res) {
  console.log('[API] Request received:', req.method, req.url);
  console.log('[API] Available env vars:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC')));
  
  // CORS headers
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[API] API Key found:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server configuration error: Missing API Key',
        debug: {
          envKeys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC')),
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    const body = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-5-20250929',
        max_tokens: Math.floor(body.max_tokens || 1000),
        system: body.system || '',
        messages: body.messages || [],
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
