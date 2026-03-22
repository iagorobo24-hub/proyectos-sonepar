import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom'
import { CATALOGO_PLANO } from '../data/catalogoSonepar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './Sonex.module.css'

const CATEGORIAS = [
  { id: "automatizacion", label: "Automatización", icon: "⚙" },
  { id: "iluminacion",    label: "Iluminación",     icon: "💡" },
  { id: "vehiculo",       label: "Vehículo Eléctrico", icon: "⚡" },
  { id: "cuadro",         label: "Cuadro Eléctrico",   icon: "🔌" },
  { id: "solar",          label: "Energía Solar",     icon: "☀" },
];

const MODO_OBJETOS = [
  { id: "busqueda",       label: "🔍 Búsqueda",        desc: "Buscar referencias y especificaciones técnicas" },
  { id: "comparativa",    label: "⚖️ Comparativa",      desc: "Comparar productos y características" },
  { id: "asistencia",     label: "🤝 Asistencia",      desc: "Ayuda con selección y recomendaciones" },
  { id: "formacion",      label: "📚 Formación",       desc: "Consultas sobre instalación y uso" },
];

export default function Sonex() {
  const navigate = useNavigate()
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [modoActivo, setModoActivo] = useState("busqueda");
  const [contextoActivo, setContextoActivo] = useState("");
  const [refsTurno, setRefsTurno] = useState([]);
  const messagesEndRef = useRef(null);

  /* Convierte markdown básico a JSX limpio para mostrar en el chat */
const procesarMarkdown = (texto) => {
  if (!texto) return []

  const lineas = texto.split('\n')
  const elementos = []
  let keyCounter = 0

  lineas.forEach((linea) => {
    const key = keyCounter++

    /* Saltar líneas vacías — añadir espacio */
    if (!linea.trim()) {
      elementos.push(<div key={key} style={{ height: '6px' }} />)
      return
    }

    /* Títulos H3 ### */
    if (linea.startsWith('### ')) {
      elementos.push(
        <div key={key} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)', marginTop: '10px', marginBottom: '4px' }}>
          {linea.replace('### ', '')}
        </div>
      )
      return
    }

    /* Títulos H2 ## */
    if (linea.startsWith('## ')) {
      elementos.push(
        <div key={key} style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', marginTop: '12px', marginBottom: '4px' }}>
          {linea.replace('## ', '')}
        </div>
      )
      return
    }

    /* Líneas de separación --- */
    if (linea.trim() === '---' || linea.trim() === '***') {
      elementos.push(
        <hr key={key} style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
      )
      return
    }

    /* Listas con - o * */
    if (linea.match(/^[-*] /)) {
      const contenido = linea.replace(/^[-*] /, '')
      elementos.push(
        <div key={key} style={{ display: 'flex', gap: '6px', marginBottom: '2px', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--color-brand-vivid)', flexShrink: 0, marginTop: '2px' }}>—</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5' }}>
            {procesarNegritas(contenido)}
          </span>
        </div>
      )
      return
    }

    /* Listas numeradas 1. 2. */
    if (linea.match(/^\d+\. /)) {
      const contenido = linea.replace(/^\d+\. /, '')
      const num = linea.match(/^(\d+)\./)[1]
      elementos.push(
        <div key={key} style={{ display: 'flex', gap: '6px', marginBottom: '2px', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--color-brand)', flexShrink: 0, fontSize: '11px', fontWeight: '700', minWidth: '16px', marginTop: '2px' }}>{num}.</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5' }}>
            {procesarNegritas(contenido)}
          </span>
        </div>
      )
      return
    }

    /* Texto normal */
    elementos.push(
      <div key={key} style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.6', marginBottom: '2px' }}>
        {procesarNegritas(linea)}
      </div>
    )
  })

  return elementos
}

/* Procesa negritas **texto** dentro de una línea */
const procesarNegritas = (texto) => {
  if (!texto.includes('**')) return texto
  const partes = texto.split('**')
  return partes.map((parte, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: '600', color: 'var(--color-text)' }}>{parte}</strong>
      : parte
  )
}

  /* Extrae referencias técnicas del texto de la respuesta IA */
  /* Primero busca en el catálogo, luego detecta patrones de referencia técnica */
  const extraerReferencias = (texto) => {
  if (!texto) return []

  /* Fase 1: buscar coincidencias exactas en el catálogo */
  const delCatalogo = CATALOGO_PLANO.filter(item =>
    texto.includes(item.ref)
  )
  if (delCatalogo.length > 0) return delCatalogo.slice(0, 3)

  /* Fase 2: detectar cualquier referencia técnica con patrón industrial */
  /* Busca combinaciones como ATV320U22M2, LC1D09M7, TM221CE24R, ACS355-03E */
  const patronReferencia = /\b([A-Z]{2,}[\d]{1,}[A-Z0-9]{1,}[A-Z0-9\-]*)\b/g
  const matches = [...new Set(texto.match(patronReferencia) || [])]
    .filter(ref => ref.length >= 5 && ref.length <= 30)
    .filter(ref => /\d/.test(ref))
    .slice(0, 3)

  return matches.map(ref => ({
    ref,
    desc: ref,
    marca: 'Ver catálogo',
    precio: 'Consultar precio'
  }))
}

  /* Navega a FichasTecnicas con la referencia precargada */
  const irAFicha = (referencia) => {
    navigate(`/fichas?ref=${encodeURIComponent(referencia)}`)
    toast.show(`Abriendo ficha de ${referencia}`, 'success')
  }

  /* Navega a Presupuestos con el producto precargado */
  const irAPresupuesto = (item) => {
  /* Extraer precio numérico del catálogo — eliminar € y texto */
  const precioLimpio = typeof item.precio === 'string'
    ? parseFloat(item.precio.replace(/[€\s]/g, '')) || 0
    : (item.precio || 0)

  const params = new URLSearchParams({
    producto: item.desc,
    referencia: item.ref,
    precio: precioLimpio.toString()
  })
  navigate(`/presupuestos?${params.toString()}`)
  toast.show(`${item.ref} añadido al presupuesto`, 'success')
}

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generarRespuestaIA = async (userMessage) => {
    try {
      const prompt = `Eres SONEX, el asistente técnico experto de Sonepar España. Responde a esta consulta de forma profesional y técnica.

Contexto: ${contextoActivo || "Sin contexto específico"}
Modo: ${MODO_OBJETOS.find(m => m.id === modoActivo)?.desc}
Categoría activa: ${categoriaActiva || "Todas"}

Consulta: ${userMessage}

Responde de forma concisa pero completa, enfocándote en:
1. Soluciones técnicas de Sonepar
2. Referencias de producto específicas cuando aplique
3. Especificaciones técnicas relevantes
4. Recomendaciones de aplicación

Mantén un tono profesional y técnico.`;

      const res = await fetch("/api/anthropic", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY 
        }, 
        body: JSON.stringify({ 
          model: "claude-sonnet-4-20250514", 
          max_tokens: 800, 
          messages: [{ role: "user", content: prompt }] 
        }) 
      });
      
      const data = await res.json();
      return data.content?.map(b => b.text || "").join("") || "Lo siento, no pude procesar tu consulta en este momento.";
    } catch (error) {
      console.error("Error calling AI:", error);
      return "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, inténtalo de nuevo.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Añadir mensaje del usuario
    const userMsg = { id: Date.now(), role: "user", content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    setIsLoading(true);

    try {
      // Generar respuesta de IA
      const aiResponse = await generarRespuestaIA(userMessage);
      
      // Añadir respuesta de IA
      const aiMsg = { 
        id: Date.now() + 1, 
        role: "assistant", 
        content: aiResponse, 
        timestamp: new Date(),
        referencias: extraerReferencias(aiResponse)
      };
      setMessages(prev => [...prev, aiMsg]);

      // Actualizar refs del turno si hay referencias
      if (aiMsg.referencias.length > 0) {
        setRefsTurno(prev => [...prev, ...aiMsg.referencias]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.show("Error al procesar la consulta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoriaClick = (categoriaId) => {
    setCategoriaActiva(categoriaActiva === categoriaId ? "" : categoriaId);
    const categoria = CATEGORIAS.find(c => c.id === categoriaId);
    if (categoria) {
      const mensaje = `Estoy interesado en productos de ${categoria.label}. ¿Qué opciones recomiendas?`;
      setInput(mensaje);
    }
  };

  const handleModoClick = (modoId) => {
    setModoActivo(modoId);
    const modo = MODO_OBJETOS.find(m => m.id === modoId);
    if (modo) {
      const mensaje = `Necesito ayuda con: ${modo.desc}`;
      setInput(mensaje);
    }
  };

  const handleContextoSet = () => {
    if (contextoActivo.trim()) {
      toast.show("Contexto guardado para esta sesión");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sugerenciasIniciales = [
    "Buscar variadores para motor 3kW",
    "Comparar contactores Schneider vs ABB",
    "Recomendar iluminación LED para almacén",
    "Ayuda con instalación de cargador vehículo",
    "Especificaciones para cuadro industrial",
  ];

const sonexStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }
`;

  return (
    <div className={styles.layout}>
      <style>{sonexStyles}</style>
      {/* ── Panel izquierdo ── */}
      <div className={styles.panelBusqueda}>
        {/* Header SONEX */}
        <div className={styles.seccion}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 10, 
              background: "var(--color-brand)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              flexShrink: 0 
            }}>
              <span style={{ fontSize: 20, color: "#ffffff", fontWeight: 700 }}>S</span>
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--color-text)" }}>
                SONEX <span style={{ fontSize: 11, color: "var(--color-text-2)", fontWeight: 400 }}>v7</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-2)" }}>
                Asistente técnico · Sonepar España
              </div>
            </div>
          </div>
        </div>

        {/* Modos de operación */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>MODO DE OPERACIÓN</div>
          {MODO_OBJETOS.map(modo => (
            <button
              key={modo.id}
              onClick={() => handleModoClick(modo.id)}
              className={`${styles.btn} ${modoActivo === modo.id ? styles.btnPrimary : styles.btnSecondary}`}
              style={{ 
                width: "100%", 
                marginBottom: 6,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>{modo.label}</span>
            </button>
          ))}
        </div>

        {/* Categorías */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>CATEGORÍAS</div>
          {CATEGORIAS.map(categoria => (
            <button
              key={categoria.id}
              onClick={() => handleCategoriaClick(categoria.id)}
              className={`${styles.btn} ${categoriaActiva === categoria.id ? styles.btnPrimary : styles.btnSecondary}`}
              style={{ 
                width: "100%", 
                marginBottom: 6,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>{categoria.icon}</span>
              <span>{categoria.label}</span>
            </button>
          ))}
        </div>

        {/* Contexto del turno */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>CONTEXTO DEL TURNO</div>
          <textarea
            value={contextoActivo}
            onChange={e => setContextoActivo(e.target.value)}
            placeholder="Ej: Instalación en nave industrial, sector químico, tensión 400V trifásica..."
            className={styles.textarea}
            rows={3}
          />
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleContextoSet}
            style={{ width: "100%", marginTop: 8 }}
          >
            Guardar contexto
          </Button>
        </div>

        {/* Referencias del turno */}
        {refsTurno.length > 0 && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>
              REFERENCIAS ({refsTurno.length})
            </div>
            {refsTurno.slice(0, 5).map((ref, i) => (
              <div key={i} className={styles.refCard}>
                <div className={styles.refCheck}>✓</div>
                <div>
                  <div className={styles.refContent}>{ref.ref}</div>
                  <div className={styles.refMeta}>{ref.desc}</div>
                </div>
              </div>
            ))}
            {refsTurno.length > 5 && (
              <div style={{ fontSize: 10, color: "var(--color-text-2)", textAlign: "center" }}>
                +{refsTurno.length - 5} más...
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Panel derecho ── */}
      <div className={styles.panelResultado}>
        <div className={styles.chatContainer}>
          {/* Mensajes */}
          <div className={styles.chatMessages}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '24px',
                padding: '32px',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--color-brand-light, #eff6ff)',
                  border: '1px solid #bfdbfe',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand)',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    margin: '0 0 8px',
                    fontFamily: 'var(--font-sans)',
                  }}>SONEX</h2>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text-2)',
                    maxWidth: '300px',
                    lineHeight: '1.6',
                    margin: '0 auto',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    Asistente técnico especializado en material eléctrico e industrial.
                    Escribe tu consulta o elige una sugerencia.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`${styles.message} ${message.role === 'user' ? styles.messageUser : ''}`}
                >
                  <div className={`${styles.messageAvatar} ${message.role === 'assistant' ? styles.assistant : ''}`}>
                    {message.role === 'user' ? 'Tú' : 'S'}
                  </div>
                  <div className={styles.messageContent}>
                    <div className={`${styles.messageBubble} ${message.role}`}>
                      {procesarMarkdown(message.content)}
                    </div>
                    <div className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {message.role === 'assistant' && (() => {
                      const refs = message.referencias || extraerReferencias(message.content)
                      if (refs.length === 0) return null
                      return (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--color-border)'
                        }}>
                          {refs.map(item => (
                            <div key={item.ref} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => irAFicha(item.ref)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  background: 'var(--color-brand)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)'
                                }}
                              >
                                📄 Ficha: {item.ref}
                              </button>
                              <button
                                onClick={() => irAPresupuesto(item)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  background: 'transparent',
                                  color: 'var(--color-brand)',
                                  border: '1px solid var(--color-brand)',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)'
                                }}
                              >
                                💶 Presupuesto
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--color-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  flexShrink: 0,
                }}>
                  S
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--color-brand)',
                          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--color-text-2)',
                    fontStyle: 'italic',
                  }}>
                    SONEX está pensando...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de input */}
          <div className={styles.chatInput}>
            {messages.length === 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className={styles.seccionLabel}>SUGERENCIAS INICIALES</div>
                <div className={styles.suggestions}>
                  {sugerenciasIniciales.map((sugerencia, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(sugerencia)}
                      className={styles.suggestionBtn}
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.chatInputContainer}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta técnica..."
                className={styles.chatInputField}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className={styles.chatSendBtn}
              >
                {isLoading ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
