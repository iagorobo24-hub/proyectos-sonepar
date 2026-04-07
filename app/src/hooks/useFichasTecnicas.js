import { useState, useMemo } from 'react'
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

const SYSTEM_COMPARATIVA = `Eres un técnico especialista en material eléctrico de Sonepar España. Compara estos dos productos para ayudar al técnico de mostrador a recomendar uno al cliente.

Responde ÚNICAMENTE con este JSON (sin backticks ni markdown):
{
  "resumen": "frase de resumen de la comparativa",
  "criterios": [
    {"criterio": "nombre del criterio", "producto_a": "valor o descripción para A", "producto_b": "valor o descripción para B", "ventaja": "A o B o empate"}
  ],
  "recomendacion_general": "recomendación clara de cuál elegir y en qué contexto",
  "casos_uso_a": "cuándo elegir el producto A",
  "casos_uso_b": "cuándo elegir el producto B"
}
Incluye entre 5 y 7 criterios relevantes para estos productos específicos.`

/* Hook principal — contiene toda la lógica de FichasTecnicas */
export default function useFichasTecnicas() {
  const [consulta, setConsulta]           = useState('')
  const [categoria, setCategoria]         = useState('Todas')
  const [resultado, setResultado]         = useState(null)
  const [error, setError]                 = useState(null)
  const [cargando, setCargando]           = useState(false)
  const [modo, setModo]                   = useState('busqueda')
  const [comparativa, setComparativa]     = useState({ a: null, b: null })
  const [resultadoComp, setResultadoComp] = useState(null)
  const [cargandoComp, setCargandoComp]   = useState(false)

  /* Usar hook de Firestore para historial */
  const {
    data: historial,
    saveData: saveHistorial,
  } = useFirestoreSync('fichas/history', 'default', [], 'sonepar_fichas_historial')

  /* Calcular accesos rápidos dinámicos basados en frecuencia de búsqueda */
  const accesosRapidos = useMemo(() => {
    if (!historial || historial.length === 0) return []
    const freq = {}
    historial.forEach(h => {
      const q = h.query?.trim().toLowerCase()
      if (q) freq[q] = (freq[q] || 0) + 1
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([query]) => query.charAt(0).toUpperCase() + query.slice(1))
  }, [historial])

  /* Guardar búsqueda en historial — evita duplicados por referencia */
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

  /* Registrar búsqueda popular globalmente (anónimo, sin datos de usuario) */
  const registrarBusquedaPopular = async (query) => {
    try {
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('../firebase/firebaseConfig')
      const docRef = doc(db, 'global', 'popularSearches')
      const snap = await getDoc(docRef)
      const searches = snap.exists() ? (snap.data().searches || {}) : {}
      const lowerQuery = query.toLowerCase()
      searches[lowerQuery] = (searches[lowerQuery] || 0) + 1
      await setDoc(docRef, { searches, updatedAt: serverTimestamp() }, { merge: true })
    } catch (e) {
      // No crítico — silenciar
    }
  }

  /* Buscar producto en la API */
  const buscar = async (q = consulta) => {
    if (!q.trim()) return
    setCargando(true)
    setResultado(null)
    setError(null)

    // Registrar búsqueda popular (asíncrono, no bloqueante)
    registrarBusquedaPopular(q.trim())

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

  /* Copiar ficha al portapapeles */
  const copiarFicha = (resultado) => {
    if (!resultado) return
    const txt = [
      `FICHA TÉCNICA — ${resultado.nombre}`,
      `Referencia: ${resultado.referencia}`,
      `Fabricante: ${resultado.fabricante}`,
      `Categoría: ${resultado.categoria}`,
      resultado.precio_orientativo ? `Precio orientativo: ${resultado.precio_orientativo} (sin IVA)` : '',
      '', resultado.descripcion, '',
      'CARACTERÍSTICAS:', ...(resultado.caracteristicas || []).map(c => `· ${c}`),
      '', 'APLICACIONES:', ...(resultado.aplicaciones || []).map(a => `· ${a}`),
      '', 'NORMATIVAS:', ...(resultado.normas || []).map(n => `· ${n}`),
      '', `CONSEJO TÉCNICO: ${resultado.consejo_tecnico}`,
      '', '⚠ Precios y stock orientativos. Verificar disponibilidad y precios reales con Sonepar antes de presupuestar.',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(txt)
  }

  /* Añadir producto al slot de comparativa */
  const añadirAComparativa = (ficha) => {
    if (!comparativa.a) {
      setComparativa({ a: ficha, b: null })
      setModo('comparativa')
    } else if (!comparativa.b && ficha.referencia !== comparativa.a.referencia) {
      setComparativa(p => ({ ...p, b: ficha }))
      setModo('comparativa')
    }
  }

  /* Quitar producto de un slot de comparativa */
  const quitarDeComparativa = (slot) => {
    setComparativa(p => ({ ...p, [slot]: null }))
    setResultadoComp(null)
  }

  /* Generar comparativa IA entre los dos productos seleccionados */
  const generarComparativa = async () => {
    if (!comparativa.a || !comparativa.b) return
    setCargandoComp(true)
    setResultadoComp(null)
    try {
      const systemPrompt = SYSTEM_COMPARATIVA
        .replace('${fichaA.nombre}', comparativa.a.nombre)
        .replace('${fichaA.referencia}', comparativa.a.referencia)
        .replace('${fichaB.nombre}', comparativa.b.nombre)
        .replace('${fichaB.referencia}', comparativa.b.referencia)
        .replace('${fichaA.precio_orientativo}', comparativa.a.precio_orientativo || 'N/D')
        .replace('${fichaB.precio_orientativo}', comparativa.b.precio_orientativo || 'N/D')
        .replace('${fichaA.nivel_stock}', comparativa.a.nivel_stock || 'N/D')
        .replace('${fichaB.nivel_stock}', comparativa.b.nivel_stock || 'N/D')

      const { text } = await callAnthropicAI({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Compara ${comparativa.a.nombre} vs ${comparativa.b.nombre}` }],
      })

      const parsed = parseAIJsonResponse(text, (p) => p.criterios && Array.isArray(p.criterios))
      if (parsed && !parsed.error) {
        setResultadoComp(parsed)
      }
    } catch (err) {
      console.warn('Error generando comparativa:', err)
    }
    setCargandoComp(false)
  }

  /* Resetear comparativa completa */
  const resetComparativa = () => {
    setComparativa({ a: null, b: null })
    setResultadoComp(null)
  }

  return {
    consulta, setConsulta,
    categoria, setCategoria,
    resultado, setResultado,
    error,
    cargando,
    historial,
    accesosRapidos,
    modo, setModo,
    comparativa,
    resultadoComp,
    cargandoComp,
    buscar,
    copiarFicha,
    añadirAComparativa,
    quitarDeComparativa,
    generarComparativa,
    resetComparativa,
    limpiarHistorial,
  }
}
