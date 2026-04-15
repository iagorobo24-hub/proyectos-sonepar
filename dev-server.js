import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

console.log('API Key cargada:', process.env.ANTHROPIC_API_KEY ? '✓ (presente)' : '✗ (ausente)')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.post('/api/anthropic', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Anthropic API Error:', error)
    res.status(500).json({ error: 'Error connecting to Anthropic API' })
  }
})

app.listen(PORT, () => {
  console.log(`API Proxy running on http://localhost:${PORT}`)
})
