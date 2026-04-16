import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom'
import catalogService from '../services/catalogService'
import { FULL_CATEGORY_INFO } from '../data/categoryMapping'
import { useToast } from '../contexts/ToastContext'
import { useSonex } from '../hooks/useSonex'
import styles from './Sonex.module.css'

const CATEGORIAS = Object.keys(FULL_CATEGORY_INFO).map(key => ({
  id: key,
  label: key,
  icon: FULL_CATEGORY_INFO[key].icon
}));

const MODO_OBJETOS = [
  { id: "busqueda", label: "🔍 Búsqueda", desc: "Buscar referencias y especificaciones" },
  { id: "comparativa", label: "⚖️ Comparativa", desc: "Comparar productos" },
  { id: "asistencia", label: "🤝 Asistencia", desc: "Selección y recomendaciones" },
  { id: "formacion", label: "📚 Formación", desc: "Instalación y uso" },
];

export default function Sonex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    messages, input, setInput, isLoading, setIsLoading,
    categoriaActiva, setCategoriaActiva, modoActivo, setModoActivo,
    contextoActivo, setContextoActivo, refsTurno, setRefsTurno,
    messagesEndRef, sugerenciasPopulares, loadingSugerencias,
    guardarMensaje,
  } = useSonex();

  const procesarMarkdown = (texto) => {
    if (!texto) return [];
    const lineas = texto.split('\n');
    const elementos = [];
    let keyCounter = 0;
    const procesarNegritas = (txt) => {
      if (!txt?.includes('**')) return txt;
      const partes = txt.split('**');
      return partes.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ fontWeight: '600' }}>{p}</strong> : p);
    };
    lineas.forEach((linea) => {
      const key = keyCounter++;
      if (!linea.trim()) { elementos.push(<div key={key} style={{ height: '6px' }} />); return; }
      if (linea.startsWith('### ')) { elementos.push(<div key={key} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-800)', marginTop: '10px', marginBottom: '4px' }}>{linea.replace('### ', '')}</div>); return; }
      if (linea.startsWith('## ')) { elementos.push(<div key={key} style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gray-800)', marginTop: '12px', marginBottom: '4px' }}>{linea.replace('## ', '')}</div>); return; }
      if (linea.trim() === '---') { elementos.push(<hr key={key} style={{ border: 'none', borderTop: '1px solid var(--gray-100)', margin: '8px 0' }} />); return; }
      if (linea.match(/^[-*] /)) { elementos.push(<div key={key} style={{ display: 'flex', gap: '6px', marginBottom: '2px', alignItems: 'flex-start' }}><span style={{ color: 'var(--blue-800)', flexShrink: 0, marginTop: '2px' }}>—</span><span style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: '1.5' }}>{procesarNegritas(linea.replace(/^[-*] /, ''))}</span></div>); return; }
      if (linea.match(/^\d+\. /)) { elementos.push(<div key={key} style={{ display: 'flex', gap: '6px', marginBottom: '2px', alignItems: 'flex-start' }}><span style={{ color: 'var(--blue-800)', flexShrink: 0, fontSize: '11px', fontWeight: '700', minWidth: '16px', marginTop: '2px' }}>{linea.match(/^(\d+)\./)[1]}.</span><span style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: '1.5' }}>{procesarNegritas(linea.replace(/^\d+\. /, ''))}</span></div>); return; }
      elementos.push(<div key={key} style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: '1.6', marginBottom: '2px' }}>{procesarNegritas(linea)}</div>);
    });
    return elementos;
  };

  const extraerReferencias = async (texto) => {
    if (!texto) return [];
    
    // Detectar patrones que parecen referencias (Alfanuméricos, mayúsculas, min 5 caracteres)
    const patron = /\b([A-Z]{2,}[\d]{1,}[A-Z0-9]{1,}[A-Z0-9\-]*)\b/g;
    const matches = [...new Set(texto.match(patron) || [])].filter(ref => ref.length >= 5 && ref.length <= 30 && /\d/.test(ref));
    
    if (matches.length === 0) return [];

    // Buscar los datos reales en Firestore para verificar existencia
    try {
      const resultados = await Promise.all(
        matches.slice(0, 5).map(ref => catalogService.getProductoPorRef(ref))
      );
      return resultados.filter(Boolean).slice(0, 3);
    } catch (error) {
      console.error("Error al extraer referencias de Firestore:", error);
      return [];
    }
  };

  const irAFicha = (referencia) => { navigate(`/fichas?ref=${encodeURIComponent(referencia)}`); toast.show(`Abriendo ficha de ${referencia}`, 'success'); };
  const irAPresupuesto = (item) => { navigate(`/presupuestos?${new URLSearchParams({ producto: item.desc, referencia: item.ref })}`); toast.show(`${item.ref} añadido al presupuesto`, 'success'); };

  const generarRespuestaIA = async (userMessage) => {
    try {
      const { callAnthropicAI } = await import('../services/anthropicService');
      const systemPrompt = `Eres SONEX, el asistente técnico experto de Sonepar España. Responde de forma concisa, enfocándote en soluciones técnicas de Sonepar, referencias de producto y recomendaciones de aplicación.`;
      
      const { text } = await callAnthropicAI({ 
        provider: 'openrouter',
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 1000, 
        system: systemPrompt, 
        messages: [{ role: "user", content: userMessage }] 
      });
      
      return text || "Lo siento, no pude procesar tu consulta.";
    } catch (error) {
      console.error("Sonex AI Error:", error);
      return `Error: ${error.message || "No se pudo conectar con SONEX. Por favor, revisa la consola para más detalles."}`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    guardarMensaje({ id: Date.now(), role: "user", content: userMessage, timestamp: new Date() });
    setIsLoading(true);
    try {
      const aiResponse = await generarRespuestaIA(userMessage);
      const refs = await extraerReferencias(aiResponse);
      const aiMsg = { id: Date.now() + 1, role: "assistant", content: aiResponse, timestamp: new Date(), referencias: refs };
      guardarMensaje(aiMsg);
      if (aiMsg.referencias.length > 0) setRefsTurno(prev => [...prev, ...aiMsg.referencias]);
    } catch (error) { toast.show("Error al procesar la consulta"); }
    setIsLoading(false);
  };

  const handleCategoriaClick = (categoriaId) => {
    setCategoriaActiva(categoriaActiva === categoriaId ? "" : categoriaId);
    const cat = CATEGORIAS.find(c => c.id === categoriaId);
    if (cat) setInput(`Estoy interesado en productos de ${cat.label}. ¿Qué opciones recomiendas?`);
  };

  const handleModoClick = (modoId) => {
    setModoActivo(modoId);
    const modo = MODO_OBJETOS.find(m => m.id === modoId);
    if (modo) setInput(`Necesito ayuda con: ${modo.desc}`);
  };

  const handleContextoSet = () => { if (contextoActivo.trim()) toast.show("Contexto guardado para esta sesión"); };
  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const sugerenciasMostrar = (sugerenciasPopulares || []).length > 0 ? sugerenciasPopulares : ["Buscar variadores 3kW", "Comparar contactores", "Recomendar iluminación LED", "Ayuda con instalación VE", "Especificaciones cuadro"];

  return (
    <div className={styles.layout}>
      {/* Panel izquierdo */}
      <div className={styles.panelBusqueda}>
        {/* Header SONEX */}
        <div className={styles.sonexHeader}>
          <div className={styles.sonexIcon}>
            <span className={styles.sonexIconLetter}>S</span>
          </div>
          <div className={styles.sonexInfo}>
            <div className={styles.sonexName}>SONEX <span className={styles.sonexVersion}>v7</span></div>
            <div className={styles.sonexStatus}>
              <span className={styles.statusDot} />
              Asistente técnico IA · Sonepar
            </div>
          </div>
        </div>

        {/* Modos */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>MODO DE OPERACIÓN</div>
          {MODO_OBJETOS.map(modo => (
            <button key={modo.id} onClick={() => handleModoClick(modo.id)} className={`${styles.modoBtn} ${modoActivo === modo.id ? styles['modoBtn--active'] : ''}`}>
              <span className={styles.modoBtnLabel}>{modo.label}</span>
              <span className={styles.modoBtnDesc}>{modo.desc}</span>
            </button>
          ))}
        </div>

        {/* Categorías */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>CATEGORÍAS</div>
          <div className={styles.categoriasGrid}>
            {CATEGORIAS.map(cat => (
              <button key={cat.id} onClick={() => handleCategoriaClick(cat.id)} className={`${styles.catBtn} ${categoriaActiva === cat.id ? styles['catBtn--active'] : ''}`}>
                <span className={styles.catBtnIcon}>{cat.icon}</span>
                <span className={styles.catBtnLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contexto */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>CONTEXTO DEL TURNO</div>
          <textarea className={styles.contextoTextarea} value={contextoActivo} onChange={e => setContextoActivo(e.target.value)} placeholder="Ej: Instalación en nave industrial, 400V trifásica..." rows={3} />
          <button className={styles.contextoSaveBtn} onClick={handleContextoSet}>Guardar contexto</button>
        </div>

        {/* Referencias */}
        {refsTurno.length > 0 && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>REFERENCIAS EN TURNO ({refsTurno.length})</div>
            {refsTurno.slice(0, 5).map((ref, i) => (
              <button key={i} className={styles.refCard} onClick={() => irAFicha(ref.ref)}>
                <span className={styles.refCard__ref}>{ref.ref}</span>
                <span className={styles.refCard__desc}>{ref.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Panel derecho — Chat */}
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messages.length === 0 ? (
            <div className={styles.emptyChat}>
              <div className={styles.emptyChatAvatar}>S</div>
              <h2 className={styles.emptyChatTitle}>¿En qué puedo ayudarte?</h2>
              <p className={styles.emptyChatText}>
                Soy SONEX, tu asistente técnico especializado en material eléctrico e industrial.
                Pregúntame por referencias, comparativas o recomendaciones.
              </p>
              {sugerenciasMostrar.length > 0 && (
                <div className={styles.emptyChatSuggestions}>
                  {sugerenciasMostrar.slice(0, 4).map((sug, i) => (
                    <button key={i} onClick={() => setInput(sug)} className={styles.sugerenciaBtn}>{sug}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`${styles.message} ${message.role === 'user' ? styles['message--user'] : ''}`}>
                <div className={styles.message__avatar}>{message.role === 'user' ? 'T' : 'S'}</div>
                <div className={styles.message__content}>
                  <div className={`${styles.message__bubble} ${message.role}`}>
                    {message.role === 'user' ? message.content : procesarMarkdown(message.content)}
                  </div>
                  {message.role === 'assistant' && message.referencias && message.referencias.length > 0 && (
                    <div className={styles.messageRefs}>
                      {message.referencias.map(item => (
                        <div key={item.ref} className={styles.messageRef}>
                          <button onClick={() => irAFicha(item.ref)} className={styles.messageRefBtn}>
                            📄 Ficha: {item.ref}
                          </button>
                          <button onClick={() => irAPresupuesto(item)} className={`${styles.messageRefBtn} ${styles.messageRefBtnSecondary}`}>
                            💶 Añadir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.message__time}>{message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className={styles.message}>
              <div className={styles.message__avatar} style={{ background: 'var(--blue-800)', color: 'var(--white)' }}>S</div>
              <div className={styles.message__content}>
                <div className={styles.message__bubble} style={{ background: 'var(--white)', border: '1px solid var(--gray-100)' }}>
                  <div className={styles.loadingDots}>
                    {[0, 1, 2].map(i => <div key={i} className={styles.loadingDots__dot} />)}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontStyle: 'italic', marginLeft: '8px' }}>SONEX está pensando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className={styles.chatInput}>
          <div className={styles.chatInputContainer}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
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
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
