import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom'
import { CATALOGO_PLANO } from '../data/catalogoSonepar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import { useSonex } from '../hooks/useSonex'
import styles from './Sonex.module.css'

const CATEGORIAS = [
  { id: "automatizacion", label: "Automatización", icon: "⚙" },
  { id: "iluminacion", label: "Iluminación", icon: "💡" },
  { id: "vehiculo", label: "Vehículo Eléctrico", icon: "⚡" },
  { id: "cuadro", label: "Cuadro Eléctrico", icon: "🔌" },
  { id: "solar", label: "Energía Solar", icon: "☀" },
];

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
    messages, setMessages, input, setInput, isLoading, setIsLoading,
    categoriaActiva, setCategoriaActiva, modoActivo, setModoActivo,
    contextoActivo, setContextoActivo, refsTurno, setRefsTurno,
    messagesEndRef, sugerenciasPopulares, loadingSugerencias,
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

  const extraerReferencias = (texto) => {
    if (!texto) return [];
    const delCatalogo = CATALOGO_PLANO.filter(item => texto.includes(item.ref));
    if (delCatalogo.length > 0) return delCatalogo.slice(0, 3);
    const patron = /\b([A-Z]{2,}[\d]{1,}[A-Z0-9]{1,}[A-Z0-9\-]*)\b/g;
    const matches = [...new Set(texto.match(patron) || [])].filter(ref => ref.length >= 5 && ref.length <= 30 && /\d/.test(ref)).slice(0, 3);
    return matches.map(ref => ({ ref, desc: ref, marca: 'Ver catálogo', precio: 'Consultar' }));
  };

  const irAFicha = (referencia) => { navigate(`/fichas?ref=${encodeURIComponent(referencia)}`); toast.show(`Abriendo ficha de ${referencia}`, 'success'); };
  const irAPresupuesto = (item) => { navigate(`/presupuestos?${new URLSearchParams({ producto: item.desc, referencia: item.ref })}`); toast.show(`${item.ref} añadido al presupuesto`, 'success'); };

  const generarRespuestaIA = async (userMessage) => {
    try {
      const { callAnthropicAI } = await import('../services/anthropicService');
      const systemPrompt = `Eres SONEX, el asistente técnico experto de Sonepar España.\nContexto: ${contextoActivo || "Sin contexto"}\nModo: ${MODO_OBJETOS.find(m => m.id === modoActivo)?.desc}\nCategoría: ${categoriaActiva || "Todas"}\nResponde de forma concisa, enfocándote en soluciones técnicas de Sonepar, referencias de producto y recomendaciones de aplicación.`;
      const { text } = await callAnthropicAI({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: systemPrompt, messages: [{ role: "user", content: userMessage }] });
      return text || "Lo siento, no pude procesar tu consulta.";
    } catch (error) {
      const devLog = typeof import.meta !== 'undefined' && import.meta.env?.DEV ? console.error : () => {};
      devLog("Error calling AI:", error);
      return "Lo siento, ha ocurrido un error al procesar tu consulta.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);
    try {
      const aiResponse = await generarRespuestaIA(userMessage);
      const aiMsg = { id: Date.now() + 1, role: "assistant", content: aiResponse, timestamp: new Date(), referencias: extraerReferencias(aiResponse) };
      setMessages(prev => [...prev, aiMsg]);
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

  const sugerenciasMostrar = sugerenciasPopulares.length > 0 ? sugerenciasPopulares : ["Buscar variadores 3kW", "Comparar contactores", "Recomendar iluminación LED", "Ayuda con instalación VE", "Especificaciones cuadro"];

  return (
    <div className={styles.layout}>
      {/* Panel izquierdo */}
      <div className={styles.panelBusqueda}>
        {/* Header SONEX */}
        <div className={styles.seccion}>
          <div className={styles.sonexHeader}>
            <div className={styles.sonexAvatar}>S</div>
            <div>
              <div className={styles.sonexTitle}>SONEX <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', fontWeight: 400 }}>v7</span></div>
              <div className={styles.sonexSubtitle}>Asistente técnico · Sonepar</div>
            </div>
          </div>
        </div>

        {/* Modos */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>MODO DE OPERACIÓN</div>
          {MODO_OBJETOS.map(modo => (
            <button key={modo.id} onClick={() => handleModoClick(modo.id)} className={`${styles.modoBtn} ${modoActivo === modo.id ? styles['modoBtn--active'] : ''}`}>{modo.label}</button>
          ))}
        </div>

        {/* Categorías */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>CATEGORÍAS</div>
          {CATEGORIAS.map(cat => (
            <button key={cat.id} onClick={() => handleCategoriaClick(cat.id)} className={`${styles.catBtn} ${categoriaActiva === cat.id ? styles['catBtn--active'] : ''}`}><span>{cat.icon}</span><span>{cat.label}</span></button>
          ))}
        </div>

        {/* Contexto */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>CONTEXTO DEL TURNO</div>
          <textarea className={styles.contextoTextarea} value={contextoActivo} onChange={e => setContextoActivo(e.target.value)} placeholder="Ej: Instalación en nave industrial, 400V trifásica..." rows={3} />
          <Button variant="secondary" size="sm" onClick={handleContextoSet} style={{ width: '100%', marginTop: '8px' }}>Guardar contexto</Button>
        </div>

        {/* Referencias */}
        {refsTurno.length > 0 && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>REFERENCIAS ({refsTurno.length})</div>
            {refsTurno.slice(0, 5).map((ref, i) => (
              <div key={i} className={styles.refCard}>
                <span className={styles.refCard__check}>✓</span>
                <div><div className={styles.refCard__ref}>{ref.ref}</div><div className={styles.refCard__desc}>{ref.desc}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel derecho — Chat */}
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messages.length === 0 ? (
            <div className={styles.emptyChat}>
              <div className={styles.emptyChat__icon}>💬</div>
              <h2 className={styles.emptyChat__title}>SONEX</h2>
              <p className={styles.emptyChat__text}>Asistente técnico especializado en material eléctrico e industrial. Escribe tu consulta o elige una sugerencia.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`${styles.message} ${message.role === 'user' ? styles['message--user'] : ''}`}>
                <div className={styles.message__avatar}>{message.role === 'user' ? 'Tú' : 'S'}</div>
                <div>
                  <div className={`${styles.message__bubble} ${message.role}`}>
                    {message.role === 'user' ? message.content : procesarMarkdown(message.content)}
                  </div>
                  <div className={styles.message__time}>{message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                  {message.role === 'assistant' && (() => {
                    const refs = message.referencias || extraerReferencias(message.content);
                    if (refs.length === 0) return null;
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {refs.map(item => (
                          <div key={item.ref} style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => irAFicha(item.ref)} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', background: 'var(--blue-800)', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>📄 Ficha: {item.ref}</button>
                            <button onClick={() => irAPresupuesto(item)} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', background: 'transparent', color: 'var(--blue-800)', border: '1px solid var(--blue-800)', borderRadius: '5px', cursor: 'pointer' }}>💶 Presupuesto</button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div style={{ display: 'flex', gap: '10px', padding: '12px 16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>S</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--white)', border: '1px solid var(--gray-100)', borderRadius: '12px', padding: '10px 14px' }}>
                <div className={styles.loadingDots}>
                  {[0, 1, 2].map(i => <div key={i} className={styles.loadingDots__dot} />)}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontStyle: 'italic' }}>SONEX está pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className={styles.chatInput}>
          {messages.length === 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className={styles.seccionLabel}>{loadingSugerencias ? 'CARGANDO...' : 'SUGERENCIAS'}</div>
              <div className={styles.sugerenciasWrap}>
                {sugerenciasMostrar.map((sug, i) => (
                  <button key={i} onClick={() => setInput(sug)} className={styles.sugerenciaBtn}>{sug}</button>
                ))}
              </div>
            </div>
          )}
          <div className={styles.chatInputContainer}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Escribe tu consulta técnica..." className={styles.chatInputField} rows={1} disabled={isLoading} />
            <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className={styles.chatSendBtn}>{isLoading ? '...' : '→'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
