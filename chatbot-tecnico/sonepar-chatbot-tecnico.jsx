import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Eres SONEX, el asistente técnico de Sonepar España. Eres un experto en material eléctrico e industrial con 20 años de experiencia en el sector. Trabajas en el mostrador técnico y ayudas a instaladores, técnicos de mantenimiento y responsables de compras.

Tu especialidad incluye:
- Variadores de frecuencia y arrancadores suaves (Schneider ATV, Siemens Sinamics, ABB ACS)
- PLCs y automatización (Schneider Modicon, Siemens S7, Allen-Bradley)
- Contactores, guardamotores y protecciones (Schneider TeSys, ABB, Eaton)
- Material eléctrico BT: interruptores, diferenciales, magnetotérmicos (Legrand, Hager, Schneider)
- Iluminación industrial y LED (Philips, Osram, Ledvance)
- Vehículo eléctrico: puntos de recarga, gestión (Schneider EVlink, ABB Terra, Wallbox)
- Energías renovables: inversores, optimizadores (SMA, Fronius, Huawei)
- Cableado y canalizaciones (Prysmian, Nexans, Legrand)

Reglas de respuesta:
1. Responde SIEMPRE en español, de forma técnica pero clara
2. Cuando recomiendes un producto, incluye la referencia comercial real si la conoces
3. Si te preguntan por una aplicación concreta (ej: "motor 7,5kW en zona ATEX"), da opciones concretas con justificación técnica
4. Sé directo y práctico, como un compañero de mostrador con experiencia
5. Si no conoces algo con certeza, dilo claramente y sugiere consultar con el fabricante
6. Cuando sea relevante, menciona normativas aplicables (IEC, UNE, REBT)
7. Usa formato estructurado cuando sea útil: listas, comparativas, pasos
8. Máximo 300 palabras por respuesta salvo que se pida detalle explícito`;

const SUGERENCIAS = [
  "¿Qué variador necesito para un motor de 15kW trifásico?",
  "Diferencias entre contactor y guardamotor",
  "Motor en zona ATEX, ¿qué equipo uso?",
  "¿Qué diferencial pongo en una instalación fotovoltaica?",
  "PLC para control de 8 entradas y 6 salidas digitales",
  "Punto de recarga 22kW para parking empresa",
  "Cable para instalación exterior enterrada 50m",
  "Arranque estrella-triángulo vs variador, ¿cuándo usar cada uno?",
];

const TEMAS_RAPIDOS = [
  { label: "Variadores", q: "¿Cuáles son las gamas de variadores más habituales para uso industrial?" },
  { label: "PLCs", q: "¿Qué PLC recomiendas para una aplicación industrial de complejidad media?" },
  { label: "Protecciones", q: "Explícame la diferencia entre magnetotérmico, diferencial y guardamotor" },
  { label: "VE", q: "¿Qué necesito para instalar puntos de recarga en un parking de empresa?" },
  { label: "Solar FV", q: "¿Qué inversor recomiendas para una instalación de autoconsumo industrial de 50kWp?" },
  { label: "Cableado", q: "¿Qué sección de cable necesito para una línea trifásica de 32A a 80 metros?" },
];

function MensajeBot({ texto }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {partes.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ color: "#fff", fontWeight: "700" }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

export default function ChatbotTecnico() {
  const [mensajes, setMensajes] = useState([
    {
      rol: "bot",
      texto: "Hola, soy **SONEX**, tu asesor técnico de Sonepar. Puedo ayudarte con selección de productos, especificaciones técnicas, compatibilidades y aplicaciones. ¿Qué necesitas?",
      ts: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historialAPI, setHistorialAPI] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  const enviar = async (texto = input) => {
    if (!texto.trim() || cargando) return;
    const ts = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    setMensajes(p => [...p, { rol: "user", texto, ts }]);
    setInput("");
    setCargando(true);

    const nuevoHistorial = [...historialAPI, { role: "user", content: texto }];

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: nuevoHistorial,
        }),
      });
      const data = await res.json();
      const respuesta = data.content?.map(i => i.text || "").join("") || "Sin respuesta.";
      const tsBot = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      setMensajes(p => [...p, { rol: "bot", texto: respuesta, ts: tsBot }]);
      setHistorialAPI([...nuevoHistorial, { role: "assistant", content: respuesta }]);
    } catch {
      setMensajes(p => [...p, { rol: "bot", texto: "Error de conexión. Inténtalo de nuevo.", ts: "" }]);
    }
    setCargando(false);
    inputRef.current?.focus();
  };

  const limpiar = () => {
    setMensajes([{
      rol: "bot",
      texto: "Conversación reiniciada. Soy **SONEX**, ¿en qué puedo ayudarte?",
      ts: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setHistorialAPI([]);
    setInput("");
  };

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "260px 1fr", background: "#0e1117", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", color: "#e0e0e0" }}>

      {/* Sidebar */}
      <div style={{ background: "#131820", borderRight: "1px solid #1e2530", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ padding: "20px 18px", borderBottom: "1px solid #1e2530" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ background: "#ff6b00", padding: "5px 8px", fontSize: "10px", fontWeight: "900", letterSpacing: "2px", color: "#fff" }}>SONEPAR</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ff6b00", letterSpacing: "2px" }}>SONEX</div>
          </div>
          <div style={{ fontSize: "9px", color: "#444", letterSpacing: "2px" }}>ASESOR TÉCNICO IA · 24/7</div>
        </div>

        {/* Estado */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #1e2530", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 6px #4caf50" }} />
          <span style={{ fontSize: "10px", color: "#4caf50", letterSpacing: "2px" }}>EN LÍNEA</span>
        </div>

        {/* Temas rápidos */}
        <div style={{ padding: "16px 14px", borderBottom: "1px solid #1e2530" }}>
          <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#444", marginBottom: "10px" }}>TEMAS RÁPIDOS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {TEMAS_RAPIDOS.map(t => (
              <button key={t.label} onClick={() => enviar(t.q)} style={{
                background: "transparent", border: "1px solid #1e2530", color: "#888",
                padding: "7px 10px", fontSize: "10px", letterSpacing: "1px",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff6b00"; e.currentTarget.style.color = "#ff6b00"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2530"; e.currentTarget.style.color = "#888"; }}
              >
                ▸ {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div style={{ padding: "14px", marginTop: "auto", borderTop: "1px solid #1e2530" }}>
          <button onClick={limpiar} style={{
            width: "100%", background: "transparent", border: "1px solid #1e2530",
            color: "#555", padding: "8px", fontSize: "9px", letterSpacing: "2px",
            cursor: "pointer",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "#ff6b00"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
          >
            ↺ NUEVA CONVERSACIÓN
          </button>
          <div style={{ marginTop: "10px", fontSize: "8px", color: "#333", letterSpacing: "1px", textAlign: "center", lineHeight: "1.6" }}>
            SONEX usa IA para asistencia técnica. Verifica siempre especificaciones críticas con el fabricante.
          </div>
        </div>
      </div>

      {/* Chat principal */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header chat */}
        <div style={{ background: "#131820", borderBottom: "1px solid #1e2530", padding: "14px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff6b00", boxShadow: "0 0 8px #ff6b00" }} />
          <span style={{ fontSize: "11px", color: "#ff6b00", letterSpacing: "3px", fontWeight: "700" }}>SONEX — ASESOR TÉCNICO</span>
          <span style={{ fontSize: "9px", color: "#333", letterSpacing: "2px", marginLeft: "8px" }}>MOSTRADOR TÉCNICO · A CORUÑA</span>
          <div style={{ marginLeft: "auto", fontSize: "9px", color: "#333", letterSpacing: "1px" }}>
            {mensajes.length - 1} mensajes
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {mensajes.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.rol === "user" ? "flex-end" : "flex-start", gap: "4px" }}>
              <div style={{ fontSize: "8px", color: "#333", letterSpacing: "2px" }}>
                {m.rol === "user" ? "TÚ" : "SONEX"} · {m.ts}
              </div>
              <div style={{
                maxWidth: "72%",
                padding: "14px 18px",
                background: m.rol === "user" ? "#ff6b00" : "#131820",
                color: m.rol === "user" ? "#fff" : "#c8d0d8",
                fontSize: "13px",
                lineHeight: "1.75",
                border: m.rol === "bot" ? "1px solid #1e2530" : "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {m.rol === "bot" ? <MensajeBot texto={m.texto} /> : m.texto}
              </div>
            </div>
          ))}

          {cargando && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
              <div style={{ fontSize: "8px", color: "#333", letterSpacing: "2px" }}>SONEX · consultando...</div>
              <div style={{ background: "#131820", border: "1px solid #1e2530", padding: "14px 18px", display: "flex", gap: "6px", alignItems: "center" }}>
                {[0, 1, 2].map(n => (
                  <div key={n} style={{
                    width: "6px", height: "6px", borderRadius: "50%", background: "#ff6b00",
                    animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Sugerencias iniciales */}
          {mensajes.length === 1 && !cargando && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ fontSize: "9px", color: "#333", letterSpacing: "3px", marginBottom: "12px" }}>PREGUNTAS FRECUENTES</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {SUGERENCIAS.map(s => (
                  <button key={s} onClick={() => enviar(s)} style={{
                    background: "#131820", border: "1px solid #1e2530", color: "#666",
                    padding: "10px 14px", fontSize: "11px", cursor: "pointer",
                    textAlign: "left", lineHeight: "1.4", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ff6b00"; e.currentTarget.style.color = "#ff6b00"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2530"; e.currentTarget.style.color = "#666"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ background: "#131820", borderTop: "1px solid #1e2530", padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: "0" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
              placeholder="Pregunta sobre cualquier producto, aplicación o normativa..."
              disabled={cargando}
              style={{
                flex: 1, background: "#0e1117", border: "1px solid #1e2530", borderRight: "none",
                color: "#e0e0e0", padding: "14px 18px", fontSize: "13px",
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                outline: "none",
              }}
            />
            <button onClick={() => enviar()} disabled={cargando || !input.trim()} style={{
              background: cargando || !input.trim() ? "#1e2530" : "#ff6b00",
              color: cargando || !input.trim() ? "#444" : "#fff",
              border: "none", padding: "14px 22px", fontSize: "12px",
              letterSpacing: "2px", cursor: cargando || !input.trim() ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace", fontWeight: "700", transition: "all 0.15s",
            }}>
              {cargando ? "..." : "ENVIAR"}
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "8px", color: "#2a2a2a", letterSpacing: "2px" }}>
            ENTER para enviar · Conversación completa en contexto · {historialAPI.length / 2} turnos
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0e1117; }
        ::-webkit-scrollbar-thumb { background: #1e2530; }
        input::placeholder { color: #2a3040; }
      `}</style>
    </div>
  );
}
