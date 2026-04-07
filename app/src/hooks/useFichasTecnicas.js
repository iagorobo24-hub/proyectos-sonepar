import { useState } from 'react'
import useFirestoreSync from './useFirestoreSync'
import { callAnthropicAI, parseAIJsonResponse } from '../services/anthropicService'

/* Prompts para la API de Anthropic — system prompt separado del input */
const SYSTEM_FICHA = `Eres un técnico especialista en material eléctrico e industrial de Sonepar España con 15 años de experiencia. El técnico de mostrador te consulta sobre un producto.

Si la consulta es demasiado vaga para identificar un producto concreto (una sola palabra genérica, síntoma sin contexto, o descripción que aplica a decenas de productos), responde ÚNICAMENTE con este JSON:
{"error": true, "mensaje": "descripción breve del problema con la consulta", "sugerencias": ["consulta más específica 1", "consulta más específica 2", "consulta más específica 3"]}

Si la consulta identifica un producto concreto, responde ÚNICAMENTE con este JSON (sin backticks ni markdown):
{
  "nombre": "nombre comercial completo",
  "referencia": "referencia fabricante",
  "fabricante": "fabricante",
  "categoria": "categoría",
  "precio_orientativo": "rango orientativo en € sin IVA (ej: 45–65€)",
  "descripcion": "descripción técnica de 2-3 frases",
  "caracteristicas": ["característica técnica 1", "característica técnica 2", "característica técnica 3", "característica técnica 4"],
  "aplicaciones": ["aplicación 1", "aplicación 2", "aplicación 3"],
  "compatibilidades": ["compatible con 1", "compatible con 2"],
  "normas": ["norma 1", "norma 2"],
  "consejo_tecnico": "consejo práctico de instalación o selección en 1-2 frases",
  "nivel_stock": "Alto / Medio / Bajo",
  "tiempo_entrega": "plazo orientativo"
}`

/* Hook principal — búsqueda IA para FichasTecnicas */
export default function useFichasTecnicas() {
  const [consulta, setConsulta] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  /* Historial para accesos rápidos dinámicos */
  const {
    data: historial,
    saveData: saveHistorial,
  } = useFirestoreSync('fichas/history', 'default', [], 'sonepar_fichas_historial')

  /* Calcular accesos rápidos dinámicos basados en frecuencia de búsqueda */
  const accesosRapidos = historial && historial.length > 0
    ? (() => {
        const freq = {}
        historial.forEach(h => {
          const q = h.query?.trim().toLowerCase()
          if (q) freq[q] = (freq[q] || 0) + 1
        })
        return Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([query]) => query.charAt(0).toUpperCase() + query.slice(1))
      })()
    : []

  /* Guardar búsqueda en historial */
  const guardarHistorial = (query, ficha) => {
    if (!historial) return
    const yaExiste = historial.some(h => h.resultado?.referencia === ficha.referencia)
    if (yaExiste) return
    const nueva = {
      query,
      resultado: ficha,
      ts: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }
    const nuevo = [nueva, ...historial].slice(0, 10)
    saveHistorial(nuevo)
  }

  /* Limpiar historial */
  const limpiarHistorial = () => {
    saveHistorial([])
  }

  /* Buscar producto en la API */
  const buscar = async (q = consulta) => {
    if (!q.trim()) return
    setCargando(true)
    setResultado(null)
    setError(null)

    try {
      const { text } = await callAnthropicAI({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_FICHA,
        messages: [{ role: 'user', content: q }],
      })

      const parsed = parseAIJsonResponse(text, (p) => p.error || (p.nombre && p.referencia))
      if (parsed.error) {
        setError(parsed)
      } else {
        setResultado(parsed)
        guardarHistorial(q, parsed)
      }
    } catch (err) {
      setError({ error: true, mensaje: err.message || 'Error al procesar la respuesta.', sugerencias: [] })
    }
    setCargando(false)
  }

  return {
    consulta, setConsulta,
    resultado, setResultado,
    error,
    cargando,
    historial,
    accesosRapidos,
    buscar,
    limpiarHistorial,
  }
}
