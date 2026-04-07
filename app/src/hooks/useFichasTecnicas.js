import { useState, useEffect } from 'react'
import useFirestoreSync from './useFirestoreSync'

/* Prompts para la API de Anthropic */
const PROMPT_FICHA = (consulta) => `Eres un técnico especialista en material eléctrico e industrial de Sonepar España con 15 años de experiencia. El técnico de mostrador te consulta sobre: "${consulta}"\n\nSi la consulta es demasiado vaga para identificar un producto concreto (una sola palabra genérica, síntoma sin contexto, o descripción que aplica a decenas de productos), responde ÚNICAMENTE con este JSON:\n{"error": true, "mensaje": "descripción breve del problema con la consulta", "sugerencias": ["consulta más específica 1", "consulta más específica 2", "consulta más específica 3"]}\n\nSi la consulta identifica un producto concreto, responde ÚNICAMENTE con este JSON (sin backticks ni markdown):\n{\n  "nombre": "nombre comercial completo",\n  "referencia": "referencia fabricante",\n  "fabricante": "fabricante",\n  "categoria": "categoría",\n  "precio_orientativo": "rango orientativo en € sin IVA (ej: 45–65€)",\n  "descripcion": "descripción técnica de 2-3 frases",\n  "caracteristicas": ["característica técnica 1", "característica técnica 2", "característica técnica 3", "característica técnica 4"],\n  "aplicaciones": ["aplicación 1", "aplicación 2", "aplicación 3"],\n  "compatibilidades": ["compatible con 1", "compatible con 2"],\n  "normas": ["norma 1", "norma 2"],\n  "consejo_tecnico": "consejo práctico de instalación o selección en 1-2 frases",\n  "nivel_stock": "Alto / Medio / Bajo",\n  "tiempo_entrega": "plazo orientativo"\n}` 

const PROMPT_COMPARATIVA = (fichaA, fichaB) => `Eres un técnico especialista en material eléctrico de Sonepar España. Compara estos dos productos para ayudar al técnico de mostrador a recomendar uno al cliente.\n\nProducto A: ${fichaA.nombre} (${fichaA.referencia})\nProducto B: ${fichaB.nombre} (${fichaB.referencia})\n\nResponde ÚNICAMENTE con este JSON (sin backticks ni markdown):\n{\n  "resumen": "frase de resumen de la comparativa",\n  "criterios": [\n    {"criterio": "nombre del criterio", "producto_a": "valor o descripción para A", "producto_b": "valor o descripción para B", "ventaja": "A o B o empate"},\n    {"criterio": "Precio", "producto_a": "${fichaA.precio_orientativo || 'N/D'}", "producto_b": "${fichaB.precio_orientativo || 'N/D'}", "ventaja": "A o B o empate"},\n    {"criterio": "Disponibilidad stock", "producto_a": "${fichaA.nivel_stock}", "producto_b": "${fichaB.nivel_stock}", "ventaja": "A o B o empate"}\n  ],\n  "recomendacion_general": "recomendación clara de cuál elegir y en qué contexto",\n  "casos_uso_a": "cuándo elegir el producto A",\n  "casos_uso_b": "cuándo elegir el producto B"\n}\nIncluye entre 5 y 7 criterios relevantes para estos productos específicos.` 

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
    loading: historialLoading, 
    saveData: saveHistorial,
    syncStatus 
  } = useFirestoreSync('fichas/history', 'default', [], 'sonepar_fichas_historial')

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

  /* Buscar producto en la API */
  const buscar = async (q = consulta) => {
    if (!q.trim()) return
    setCargando(true)
    setResultado(null)
    setError(null)
    try {
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: PROMPT_FICHA(q) }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map(i => i.text || '').join('') || ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      if (parsed.error) {
        setError(parsed)
      } else {
        setResultado(parsed)
        guardarHistorial(q, parsed)
      }
    } catch {
      setError({ error: true, mensaje: 'Error al procesar la respuesta.', sugerencias: [] })
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
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: PROMPT_COMPARATIVA(comparativa.a, comparativa.b) }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map(i => i.text || '').join('') || ''
      setResultadoComp(JSON.parse(text.replace(/```json|```/g, '').trim()))
    } catch {}
    setCargandoComp(false)
  }

  /* Resetear comparativa completa */
  const resetComparativa = () => {
    setComparativa({ a: null, b: null })
    setResultadoComp(null)
  }

  return {
    /* Estado */
    consulta, setConsulta,
    categoria, setCategoria,
    resultado, setResultado,
    error,
    cargando,
    historial,
    modo, setModo,
    comparativa,
    resultadoComp,
    cargandoComp,
    /* Acciones */
    buscar,
    copiarFicha,
    añadirAComparativa,
    quitarDeComparativa,
    generarComparativa,
    resetComparativa,
    limpiarHistorial,
  }
}
