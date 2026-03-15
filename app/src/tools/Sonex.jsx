import { useState, useEffect, useRef, useCallback } from "react";
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './Sonex.module.css'

// ── Catálogo de referencia SONEX v6 (selección) ────────────────────────────────
const CATALOGO_REF = [
  { ref: "ATV320U22M2",    desc: "Variador Schneider ATV320 2.2kW mono",      marca: "Schneider Electric", familia: "Automatización", precio: "310€" },
  { ref: "ATV320U40N4B",   desc: "Variador Schneider ATV320 4kW tri",          marca: "Schneider Electric", familia: "Automatización", precio: "415€" },
  { ref: "LC1D09M7",       desc: "Contactor Schneider TeSys D 9A",             marca: "Schneider Electric", familia: "Automatización", precio: "18€" },
  { ref: "TM221CE24R",     desc: "PLC Schneider M221 24E/S",                   marca: "Schneider Electric", familia: "Automatización", precio: "185€" },
  { ref: "CoreLine_WT",    desc: "Philips CoreLine WT 36W 4000lm LED",         marca: "Philips",           familia: "Iluminación",    precio: "42€" },
  { ref: "WT120C_LED",     desc: "Philips WT120C LED 58W highbay industrial",  marca: "Philips",           familia: "Iluminación",    precio: "95€" },
  { ref: "EVL2S7P2RS",     desc: "Schneider EVlink Smart 7.4kW mono",          marca: "Schneider Electric", familia: "Vehículo Eléctrico", precio: "420€" },
  { ref: "WBX-CMR2-M-T2A", desc: "Wallbox Commander 2 22kW pantalla",         marca: "Wallbox",           familia: "Vehículo Eléctrico", precio: "890€" },
  { ref: "A9F74216",       desc: "iC60N Schneider 2P 16A curva C 6kA",        marca: "Schneider Electric", familia: "Cuadro Eléctrico", precio: "14€" },
  { ref: "A9F74332",       desc: "iC60N Schneider 3P 32A curva C 6kA",        marca: "Schneider Electric", familia: "Cuadro Eléctrico", precio: "31€" },
  { ref: "FRO-SYMO-8",     desc: "Fronius Symo 8.2kW inversor tri",           marca: "Fronius",           familia: "Energía Solar",   precio: "1450€" },
  { ref: "PYL-US3000C",    desc: "Pylontech US3000C batería 3.5kWh",          marca: "Pylontech",         familia: "Energía Solar",   precio: "1100€" },
];

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
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [modoActivo, setModoActivo] = useState("busqueda");
  const [contextoActivo, setContextoActivo] = useState("");
  const [refsTurno, setRefsTurno] = useState([]);
  const messagesEndRef = useRef(null);

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

  const extraerReferencias = (text) => {
    const referencias = [];
    CATALOGO_REF.forEach(producto => {
      if (text.includes(producto.ref)) {
        referencias.push(producto);
      }
    });
    return referencias;
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

  return (
    <div className={styles.layout}>
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
              <div className={styles.vacio}>
                <div className={styles.vacioDiamond}>💬</div>
                <div className={styles.vacioTexto}>Inicia una conversación</div>
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
                      {message.content}
                    </div>
                    <div className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
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
