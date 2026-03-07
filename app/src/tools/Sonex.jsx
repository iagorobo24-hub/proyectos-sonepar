import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `Eres SONEX, el asistente técnico especializado de Sonepar España. Actúas como un técnico de mostrador experto con 15 años de experiencia en material eléctrico e industrial.

Tu conocimiento abarca: variadores de frecuencia, contactores, relés, PLCs, sensores industriales, cables y canalizaciones, protecciones eléctricas, automatización, vehículo eléctrico y energías renovables.

Normas de respuesta:
- Respuestas concretas y directas. Sin rodeos ni frases de relleno.
- Si te preguntan por una referencia específica, da las características técnicas principales.
- Si te preguntan por una avería, da causa probable y pasos de diagnóstico ordenados.
- Si te preguntan por normativa, cita la norma concreta (IEC, UNE, RD).
- Si la pregunta es ambigua, pide el dato que falta antes de responder.
- Termina respuestas técnicas complejas con un "Consejo práctico:" de una frase.

Al final de cada respuesta incluye en la última línea ÚNICAMENTE este texto sin nada más:
[CONFIANZA:X] donde X es 1 (baja), 2 (media) o 3 (alta) según tu certeza en la respuesta.`;

const MODOS = [
  { id: "general",  label: "General",   desc: "Cualquier consulta técnica" },
  { id: "averia",   label: "Avería",    desc: "Diagnóstico de fallos" },
  { id: "seleccion",label: "Selección", desc: "Elegir el producto correcto" },
  { id: "normas",   label: "Normativa", desc: "IEC, UNE, reglamentos" },
];

const SUGERENCIAS = [
  "¿Cuál es la diferencia entre un contactor y un relé de maniobra?",
  "El variador ATV320 da fallo OHF, ¿qué significa?",
  "¿Qué sección de cable necesito para un motor de 11kW a 400V?",
  "¿Qué normativa aplica a instalaciones de carga de VE?",
  "¿Cómo selecciono el guardamotor correcto para un motor de 7.5kW?",
];

const CONV_NUEVA = (id) => ({ id, nombre: "Nueva conversación", mensajes: [], ts: Date.now() });

function parseConfianza(texto) {
  const match = texto.match(/\[CONFIANZA:(\d)\]/);
  return match ? parseInt(match[1]) : null;
}

function limpiarConfianza(texto) {
  return texto.replace(/\[CONFIANZA:\d\]\s*$/, "").trimEnd();
}

function BadgeConfianza({ nivel }) {
  if (!nivel) return null;
  const cfg = {
    3: { label: "Alta confianza",  color: "#2e7d32", bg: "#e8f5e9" },
    2: { label: "Confianza media", color: "#f9a825", bg: "#fffde7" },
    1: { label: "Verificar",       color: "#c62828", bg: "#ffebee" },
  }[nivel];
  return (
    <span style={{ padding: "2px 8px", background: cfg.bg, color: cfg.color, fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700", letterSpacing: "0.5px" }}>
      {cfg.label}
    </span>
  );
}

export default function Sonex() {
  const [conversaciones, setConversaciones] = useState([]);
  const [convActiva, setConvActiva] = useState(null);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modo, setModo] = useState("general");
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [toast, setToast] = useState("");
  const [modoRapido, setModoRapido] = useState(false);
  const [respuestaRapida, setRespuestaRapida] = useState("");
  const [cargandoRapido, setCargandoRapido] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_sonex_conversaciones");
      if (saved) {
        const convs = JSON.parse(saved);
        setConversaciones(convs);
        if (convs.length > 0) setConvActiva(convs[0].id);
      } else {
        const init = CONV_NUEVA("c0");
        setConversaciones([init]);
        setConvActiva("c0");
      }
    } catch {
      const init = CONV_NUEVA("c0");
      setConversaciones([init]);
      setConvActiva("c0");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversaciones, convActiva]);

  const guardar = (convs) => {
    try { localStorage.setItem("sonepar_sonex_conversaciones", JSON.stringify(convs)); } catch {}
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const conv = conversaciones.find(c => c.id === convActiva);
  const mensajes = conv?.mensajes || [];
  const LIMITE = 20;
  const limitAlcanzado = mensajes.filter(m => m.rol === "user").length >= LIMITE;

  const enviar = async (textoOverride) => {
    const texto = (textoOverride || input).trim();
    if (!texto || cargando || limitAlcanzado) return;
    setInput("");

    const mensajeUser = { rol: "user", texto, ts: Date.now() };
    const historialActualizado = [...mensajes, mensajeUser];

    // Nombre automático de la conversación con el primer mensaje
    let nombreConv = conv?.nombre || "Nueva conversación";
    if (mensajes.length === 0) {
      nombreConv = texto.slice(0, 40) + (texto.length > 40 ? "..." : "");
    }

    const nuevasConvs = conversaciones.map(c => c.id === convActiva ? { ...c, nombre: nombreConv, mensajes: historialActualizado } : c);
    setConversaciones(nuevasConvs);
    guardar(nuevasConvs);
    setCargando(true);

    const systemFinal = modo === "general" ? SYSTEM_PROMPT :
      SYSTEM_PROMPT + `\n\nModo activo: ${MODOS.find(m => m.id === modo)?.label}. Enfoca tu respuesta en este contexto.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemFinal,
          messages: historialActualizado.map(m => ({ role: m.rol === "user" ? "user" : "assistant", content: m.texto })),
        }),
      });
      const data = await res.json();
      const respuesta = data.content?.map(i => i.text || "").join("") || "";
      const confianza = parseConfianza(respuesta);
      const textoLimpio = limpiarConfianza(respuesta);

      const mensajeBot = { rol: "bot", texto: textoLimpio, confianza, ts: Date.now() };
      const conFinal = [...historialActualizado, mensajeBot];

      const convsFinales = conversaciones.map(c => c.id === convActiva ? { ...c, nombre: nombreConv, mensajes: conFinal } : c);
      setConversaciones(convsFinales);
      guardar(convsFinales);
    } catch {
      const err = { rol: "bot", texto: "Error de conexión. Inténtalo de nuevo.", confianza: null, ts: Date.now() };
      const convsErr = conversaciones.map(c => c.id === convActiva ? { ...c, mensajes: [...historialActualizado, err] } : c);
      setConversaciones(convsErr);
      guardar(convsErr);
    }
    setCargando(false);
  };

  const consultaRapida = async (texto) => {
    if (!texto.trim() || cargandoRapido) return;
    setCargandoRapido(true);
    setRespuestaRapida("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: SYSTEM_PROMPT + "\n\nResponde en máximo 3 frases. Ve directo al dato.",
          messages: [{ role: "user", content: texto }],
        }),
      });
      const data = await res.json();
      const respuesta = data.content?.map(i => i.text || "").join("") || "";
      setRespuestaRapida(limpiarConfianza(respuesta));
    } catch { setRespuestaRapida("Error de conexión."); }
    setCargandoRapido(false);
  };

  const nuevaConversacion = () => {
    const id = `c${Date.now()}`;
    const nueva = CONV_NUEVA(id);
    const nuevas = [nueva, ...conversaciones].slice(0, 10);
    setConversaciones(nuevas);
    setConvActiva(id);
    guardar(nuevas);
  };

  const borrarConversacion = (id) => {
    const nuevas = conversaciones.filter(c => c.id !== id);
    if (nuevas.length === 0) {
      const init = CONV_NUEVA("c_new");
      setConversaciones([init]);
      setConvActiva("c_new");
      guardar([init]);
    } else {
      setConversaciones(nuevas);
      if (convActiva === id) setConvActiva(nuevas[0].id);
      guardar(nuevas);
    }
  };

  const copiarMensaje = (texto) => {
    navigator.clipboard.writeText(texto).then(() => showToast("Respuesta copiada"));
  };

  const S = {
    btn: (color = "#1a1a2e", full = false) => ({
      padding: "8px 18px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: color, color: "#fff", border: "none", cursor: "pointer",
      width: full ? "100%" : "auto",
    }),
    btnOutline: (color = "#1a1a2e") => ({
      padding: "6px 12px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer",
    }),
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a1a2e", color: "#e8a020", padding: "12px 20px", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0f0f1a", fontFamily: "'Georgia', serif", color: "#e8e0d4" }}>

        {/* Header */}
        <div style={{ background: "#0f0f1a", padding: "0 20px", display: "flex", alignItems: "stretch", borderBottom: "1px solid #1a1a2e", flexShrink: 0 }}>
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "0 16px 0 0", fontSize: "16px" }}>
            ☰
          </button>
          <div style={{ background: "#1a2a4a", padding: "12px 18px", display: "flex", alignItems: "center", marginRight: "16px" }}>
            <span style={{ fontWeight: "900", fontSize: "11px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <span style={{ color: "#4a7ab5", fontFamily: "'Courier New', monospace", fontSize: "13px", letterSpacing: "4px", fontWeight: "700" }}>SONEX</span>
            <span style={{ color: "#333", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>ASISTENTE TÉCNICO · v2</span>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setModoRapido(!modoRapido)}
              style={{ ...S.btn(modoRapido ? "#c07010" : "#1a2a4a") }}>
              {modoRapido ? "MODO NORMAL" : "CONSULTA RÁPIDA"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Sidebar */}
          {sidebarAbierto && (
            <div style={{ width: "240px", background: "#0a0a14", borderRight: "1px solid #1a1a2e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ padding: "12px" }}>
                <button onClick={nuevaConversacion} style={{ ...S.btn("#1a2a4a", true), padding: "10px" }}>
                  + NUEVA CONVERSACIÓN
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#333", fontFamily: "'Courier New', monospace", padding: "8px 4px", marginBottom: "4px" }}>
                  CONVERSACIONES ({conversaciones.length}/10)
                </div>
                {conversaciones.map(c => (
                  <div key={c.id}
                    style={{ padding: "10px 10px", marginBottom: "2px", cursor: "pointer", background: c.id === convActiva ? "#1a2a4a" : "transparent", borderRadius: "2px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}
                    onClick={() => setConvActiva(c.id)}>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "11px", color: c.id === convActiva ? "#e8e0d4" : "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "2px" }}>
                        {c.nombre}
                      </div>
                      <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace" }}>
                        {c.mensajes.filter(m => m.rol === "user").length} mensajes
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); borrarConversacion(c.id); }}
                      style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "12px", padding: "0", flexShrink: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Modos */}
              <div style={{ padding: "12px", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>MODO</div>
                {MODOS.map(m => (
                  <button key={m.id} onClick={() => setModo(m.id)}
                    style={{ display: "block", width: "100%", padding: "7px 10px", marginBottom: "3px", textAlign: "left", fontSize: "11px", fontFamily: "'Courier New', monospace", cursor: "pointer", background: modo === m.id ? "#1a2a4a" : "transparent", color: modo === m.id ? "#4a9eff" : "#555", border: `1px solid ${modo === m.id ? "#1a2a4a" : "transparent"}` }}>
                    {m.label}
                    <div style={{ fontSize: "9px", color: "#333", marginTop: "1px" }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Disclaimer */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ fontSize: "9px", color: "#333", lineHeight: "1.5", fontFamily: "'Courier New', monospace" }}>
                  ⚠ Las respuestas son orientativas. Verificar especificaciones técnicas con el fabricante antes de cualquier instalación.
                </div>
              </div>
            </div>
          )}

          {/* Área principal */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Modo consulta rápida */}
            {modoRapido && (
              <div style={{ background: "#0f0f1a", borderBottom: "1px solid #1a1a2e", padding: "16px 24px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#c07010", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>⚡ CONSULTA RÁPIDA — respuesta en máx. 3 frases</div>
                <div style={{ display: "flex", gap: "8px", marginBottom: respuestaRapida ? "12px" : "0" }}>
                  <input id="quick-input" placeholder="Pregunta directa..."
                    style={{ flex: 1, padding: "9px 14px", background: "#0a0a14", border: "1px solid #1a2a4a", color: "#e8e0d4", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }}
                    onKeyDown={e => e.key === "Enter" && consultaRapida(e.target.value)} />
                  <button onClick={() => { const el = document.getElementById("quick-input"); consultaRapida(el.value); }}
                    disabled={cargandoRapido}
                    style={{ ...S.btn(cargandoRapido ? "#333" : "#c07010") }}>
                    {cargandoRapido ? "..." : "›"}
                  </button>
                </div>
                {respuestaRapida && (
                  <div style={{ background: "#0a0a14", border: "1px solid #1a2a4a", padding: "12px 16px", fontSize: "13px", color: "#e8e0d4", lineHeight: "1.6" }}>
                    {respuestaRapida}
                  </div>
                )}
              </div>
            )}

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

              {mensajes.length === 0 && (
                <div style={{ maxWidth: "580px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.15 }}>◈</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#4a7ab5", marginBottom: "8px" }}>SONEX</div>
                    <div style={{ fontSize: "12px", color: "#444", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>ASISTENTE TÉCNICO SONEPAR</div>
                  </div>
                  <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>CONSULTAS FRECUENTES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {SUGERENCIAS.map((s, i) => (
                      <button key={i} onClick={() => enviar(s)}
                        style={{ padding: "12px 16px", background: "#0a0a14", border: "1px solid #1a2a4a", color: "#888", fontSize: "12px", textAlign: "left", cursor: "pointer", fontFamily: "'Georgia', serif", lineHeight: "1.4" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensajes.map((msg, i) => (
                <div key={i} style={{ marginBottom: "20px", display: "flex", flexDirection: msg.rol === "user" ? "row-reverse" : "row", gap: "12px", alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{ width: "28px", height: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.rol === "user" ? "#1a2a4a" : "#0a0a14", border: "1px solid #1a2a4a", fontSize: "10px", fontFamily: "'Courier New', monospace", color: msg.rol === "user" ? "#4a9eff" : "#4a7ab5", fontWeight: "700" }}>
                    {msg.rol === "user" ? "YO" : "SX"}
                  </div>

                  <div style={{ maxWidth: "75%" }}>
                    <div style={{ background: msg.rol === "user" ? "#0d1a2e" : "#0a0a14", border: `1px solid ${msg.rol === "user" ? "#1a2a4a" : "#1a1a2e"}`, padding: "14px 18px", fontSize: "13px", lineHeight: "1.7", color: "#d4ccc4", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {msg.texto}
                    </div>
                    {msg.rol === "bot" && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                        <BadgeConfianza nivel={msg.confianza} />
                        <button onClick={() => copiarMensaje(msg.texto)}
                          style={{ ...S.btnOutline("#333"), padding: "3px 8px", fontSize: "9px", color: "#444" }}>
                          COPIAR
                        </button>
                        <span style={{ fontSize: "9px", color: "#2a2a3e", fontFamily: "'Courier New', monospace" }}>
                          {new Date(msg.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {cargando && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a14", border: "1px solid #1a2a4a", fontSize: "10px", fontFamily: "'Courier New', monospace", color: "#4a7ab5", fontWeight: "700" }}>SX</div>
                  <div style={{ background: "#0a0a14", border: "1px solid #1a2a4a", padding: "14px 18px", display: "flex", gap: "6px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: "5px", height: "5px", background: "#4a7ab5", borderRadius: "50%", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Aviso límite */}
              {limitAlcanzado && (
                <div style={{ background: "#1a0a0a", border: "1px solid #c62828", padding: "12px 18px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#c62828", fontFamily: "'Courier New', monospace" }}>
                    Límite de {LIMITE} mensajes alcanzado en esta conversación
                  </span>
                  <button onClick={nuevaConversacion} style={{ ...S.btn("#c62828"), padding: "6px 14px", fontSize: "9px" }}>
                    NUEVA CONVERSACIÓN
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "16px 24px", background: "#0a0a14", borderTop: "1px solid #1a1a2e", flexShrink: 0 }}>
              {/* Indicador turno */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace" }}>
                  MODO: <span style={{ color: "#4a7ab5" }}>{MODOS.find(m => m.id === modo)?.label.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: "9px", color: limitAlcanzado ? "#c62828" : "#333", fontFamily: "'Courier New', monospace" }}>
                  {mensajes.filter(m => m.rol === "user").length}/{LIMITE} MENSAJES
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder={limitAlcanzado ? "Límite alcanzado — inicia una nueva conversación" : "Escribe tu consulta técnica... (Enter para enviar, Shift+Enter para nueva línea)"}
                  disabled={limitAlcanzado}
                  rows={2}
                  style={{ flex: 1, padding: "11px 14px", background: "#0f0f1a", border: "1px solid #1a2a4a", color: "#e8e0d4", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none", resize: "none", opacity: limitAlcanzado ? 0.4 : 1 }}
                />
                <button onClick={() => enviar()} disabled={cargando || limitAlcanzado || !input.trim()}
                  style={{ ...S.btn(cargando || limitAlcanzado || !input.trim() ? "#1a1a2e" : "#1a2a4a"), padding: "0 20px", alignSelf: "stretch", fontSize: "16px" }}>
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
