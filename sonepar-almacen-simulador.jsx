import { useState, useEffect } from "react";

const STAGES = [
  { id: "recibido", label: "RECIBIDO", icon: "▼", desc: "Pedido registrado en sistema" },
  { id: "ubicado", label: "UBICADO", icon: "◉", desc: "Mercancía asignada a ubicación" },
  { id: "picking", label: "PICKING", icon: "⊡", desc: "Operario extrae unidades" },
  { id: "verificacion", label: "VERIFICACIÓN", icon: "✓", desc: "Control de calidad y conteo" },
  { id: "expedicion", label: "EXPEDICIÓN", icon: "▶", desc: "Paquete listo para transporte" },
];

const SAMPLE_ORDERS = [
  { ref: "PED-2024-00312", producto: "Variador ATV320 7,5kW", cantidad: 2, cliente: "Instalaciones García S.L.", zona: "A-12" },
  { ref: "PED-2024-00313", producto: "PLC Modicon M241", cantidad: 1, cliente: "Electro Norte", zona: "B-04" },
  { ref: "PED-2024-00314", producto: "Contactor LC1D25 25A", cantidad: 10, cliente: "Mantenimiento Ferrol", zona: "C-08" },
];

export default function AlmacenSimulador() {
  const [pedido, setPedido] = useState(null);
  const [etapaActual, setEtapaActual] = useState(0);
  const [progresando, setProgresando] = useState(false);
  const [logs, setLogs] = useState([]);
  const [analisisIA, setAnalisisIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [customRef, setCustomRef] = useState("");
  const [customProd, setCustomProd] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [modoCustom, setModoCustom] = useState(false);

  const addLog = (msg) => {
    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [`[${hora}] ${msg}`, ...prev].slice(0, 12));
  };

  const iniciarPedido = (p) => {
    setPedido(p);
    setEtapaActual(0);
    setLogs([]);
    setAnalisisIA("");
    addLog(`Pedido ${p.ref} recibido → Producto: ${p.producto}`);
  };

  const iniciarCustom = () => {
    if (!customRef || !customProd || !customQty) return;
    const p = {
      ref: customRef,
      producto: customProd,
      cantidad: parseInt(customQty),
      cliente: "Cliente personalizado",
      zona: "X-00",
    };
    iniciarPedido(p);
    setModoCustom(false);
  };

  const avanzar = () => {
    if (!pedido || progresando || etapaActual >= STAGES.length - 1) return;
    setProgresando(true);
    setTimeout(() => {
      const next = etapaActual + 1;
      setEtapaActual(next);
      addLog(`→ ${STAGES[next].label}: ${STAGES[next].desc}`);
      setProgresando(false);
      if (next === STAGES.length - 1) {
        addLog(`✓ Pedido ${pedido.ref} completado y listo para expedición`);
        consultarIA(pedido);
      }
    }, 700);
  };

  const reiniciar = () => {
    setPedido(null);
    setEtapaActual(0);
    setLogs([]);
    setAnalisisIA("");
  };

  const consultarIA = async (p) => {
    setCargandoIA(true);
    try {
      const prompt = `Eres un experto en logística de distribución eléctrica industrial (contexto: empresa tipo Sonepar). 
Un pedido ha completado el ciclo completo de almacén. Proporciona un análisis breve y profesional en español con:
1. Posibles incidencias típicas para este tipo de producto en cada etapa
2. Recomendaciones de optimización para el almacén
3. KPIs relevantes a medir para este tipo de pedido

Pedido: ${p.ref}
Producto: ${p.producto}
Cantidad: ${p.cantidad} unidades
Zona de almacén: ${p.zona}
Cliente: ${p.cliente}

Responde de forma concisa, en 3 bloques bien diferenciados, máximo 150 palabras en total.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("\n") || "Sin respuesta";
      setAnalisisIA(text);
    } catch (e) {
      setAnalisisIA("Error al consultar análisis IA.");
    }
    setCargandoIA(false);
  };

  const completado = pedido && etapaActual === STAGES.length - 1;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      fontFamily: "'Courier New', monospace",
      color: "#e0e0e0",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "#111820",
        borderBottom: "2px solid #f7a600",
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{
          background: "#f7a600",
          color: "#000",
          fontWeight: "900",
          fontSize: "13px",
          padding: "4px 10px",
          letterSpacing: "3px",
        }}>SONEPAR</div>
        <div style={{ color: "#f7a600", fontSize: "11px", letterSpacing: "4px", fontWeight: "700" }}>
          SIMULADOR DE FLUJO DE ALMACÉN
        </div>
        <div style={{ marginLeft: "auto", fontSize: "10px", color: "#555", letterSpacing: "2px" }}>
          SGA v1.0 · A CORUÑA
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "0", minHeight: "calc(100vh - 61px)" }}>

        {/* Panel izquierdo */}
        <div style={{ background: "#111820", borderRight: "1px solid #222", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#555", borderBottom: "1px solid #1e2530", paddingBottom: "10px" }}>
            SELECCIÓN DE PEDIDO
          </div>

          {SAMPLE_ORDERS.map((o, i) => (
            <div
              key={i}
              onClick={() => iniciarPedido(o)}
              style={{
                border: pedido?.ref === o.ref ? "1px solid #f7a600" : "1px solid #222",
                background: pedido?.ref === o.ref ? "#1a1f00" : "#0d1117",
                padding: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ color: "#f7a600", fontSize: "10px", letterSpacing: "2px", marginBottom: "4px" }}>{o.ref}</div>
              <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "4px" }}>{o.producto}</div>
              <div style={{ fontSize: "10px", color: "#666" }}>Qty: {o.cantidad} · Zona: {o.zona}</div>
              <div style={{ fontSize: "10px", color: "#555" }}>{o.cliente}</div>
            </div>
          ))}

          {/* Pedido custom */}
          <div style={{ borderTop: "1px solid #1e2530", paddingTop: "16px" }}>
            <div
              onClick={() => setModoCustom(!modoCustom)}
              style={{ fontSize: "10px", letterSpacing: "2px", color: "#f7a600", cursor: "pointer", marginBottom: "12px" }}
            >
              {modoCustom ? "▲ CERRAR" : "▼ PEDIDO MANUAL"}
            </div>

            {modoCustom && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  ["Referencia", customRef, setCustomRef, "PED-2024-00315"],
                  ["Producto", customProd, setCustomProd, "Variador ATV320..."],
                  ["Cantidad", customQty, setCustomQty, "5"],
                ].map(([label, val, setter, ph]) => (
                  <div key={label}>
                    <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "3px" }}>{label.toUpperCase()}</div>
                    <input
                      value={val}
                      onChange={e => setter(e.target.value)}
                      placeholder={ph}
                      style={{
                        width: "100%",
                        background: "#0d1117",
                        border: "1px solid #333",
                        color: "#e0e0e0",
                        padding: "6px 8px",
                        fontSize: "11px",
                        fontFamily: "'Courier New', monospace",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={iniciarCustom}
                  style={{
                    background: "#f7a600",
                    color: "#000",
                    border: "none",
                    padding: "8px",
                    fontFamily: "'Courier New', monospace",
                    fontWeight: "700",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  CARGAR PEDIDO
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Flujo de etapas */}
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#555", marginBottom: "16px" }}>
              FLUJO DE PROCESO
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
              {STAGES.map((s, i) => {
                const activa = pedido && i === etapaActual;
                const completada = pedido && i < etapaActual;
                const pendiente = !pedido || i > etapaActual;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{
                      flex: 1,
                      padding: "14px 10px",
                      background: activa ? "#f7a600" : completada ? "#1a2200" : "#111820",
                      border: activa ? "2px solid #f7a600" : completada ? "1px solid #4a6800" : "1px solid #222",
                      textAlign: "center",
                      transition: "all 0.4s",
                      position: "relative",
                    }}>
                      <div style={{
                        fontSize: "18px",
                        color: activa ? "#000" : completada ? "#a0c040" : "#333",
                        marginBottom: "4px",
                      }}>
                        {completada ? "✓" : s.icon}
                      </div>
                      <div style={{
                        fontSize: "9px",
                        letterSpacing: "1.5px",
                        color: activa ? "#000" : completada ? "#a0c040" : "#444",
                        fontWeight: activa ? "700" : "400",
                      }}>
                        {s.label}
                      </div>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div style={{
                        fontSize: "16px",
                        color: completada || activa ? "#f7a600" : "#222",
                        padding: "0 4px",
                        flexShrink: 0,
                      }}>›</div>
                    )}
                  </div>
                );
              })}
            </div>

            {pedido && (
              <div style={{ marginTop: "12px", padding: "12px 16px", background: "#111820", border: "1px solid #1e2530" }}>
                <div style={{ fontSize: "11px", color: "#aaa" }}>
                  <span style={{ color: "#f7a600" }}>{pedido.ref}</span>
                  {" · "}
                  {pedido.producto}
                  {" · "}
                  <span style={{ color: "#888" }}>{pedido.cantidad} ud · Zona {pedido.zona}</span>
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={avanzar}
              disabled={!pedido || progresando || completado}
              style={{
                background: !pedido || progresando || completado ? "#1a1a1a" : "#f7a600",
                color: !pedido || progresando || completado ? "#444" : "#000",
                border: "none",
                padding: "12px 28px",
                fontFamily: "'Courier New', monospace",
                fontWeight: "700",
                fontSize: "11px",
                letterSpacing: "3px",
                cursor: !pedido || progresando || completado ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {progresando ? "PROCESANDO..." : completado ? "COMPLETADO" : "AVANZAR ETAPA ›"}
            </button>

            <button
              onClick={reiniciar}
              style={{
                background: "transparent",
                color: "#555",
                border: "1px solid #333",
                padding: "12px 20px",
                fontFamily: "'Courier New', monospace",
                fontSize: "11px",
                letterSpacing: "2px",
                cursor: "pointer",
              }}
            >
              REINICIAR
            </button>
          </div>

          {/* Log de eventos */}
          <div style={{ background: "#080c10", border: "1px solid #1a1a1a", padding: "16px", minHeight: "120px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#555", marginBottom: "10px" }}>LOG DE EVENTOS</div>
            {logs.length === 0 ? (
              <div style={{ color: "#333", fontSize: "11px" }}>_ selecciona un pedido para iniciar</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{
                  fontSize: "11px",
                  color: i === 0 ? "#a0c040" : "#555",
                  marginBottom: "4px",
                  transition: "color 1s",
                }}>
                  {l}
                </div>
              ))
            )}
          </div>

          {/* Análisis IA */}
          {(cargandoIA || analisisIA) && (
            <div style={{
              background: "#0a1200",
              border: "1px solid #2a4000",
              padding: "20px",
            }}>
              <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#a0c040", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>◈</span> ANÁLISIS IA — MOTOR DE OPTIMIZACIÓN LOGÍSTICA
              </div>
              {cargandoIA ? (
                <div style={{ color: "#555", fontSize: "11px", animation: "none" }}>
                  Consultando modelo... ▌
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "#b0c080", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                  {analisisIA}
                </div>
              )}
            </div>
          )}

          {!pedido && (
            <div style={{
              marginTop: "auto",
              padding: "40px",
              textAlign: "center",
              color: "#222",
              fontSize: "11px",
              letterSpacing: "4px",
              borderTop: "1px solid #111820",
            }}>
              SELECCIONA UN PEDIDO PARA INICIAR SIMULACIÓN
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
