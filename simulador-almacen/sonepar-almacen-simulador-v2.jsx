import { useState, useEffect, useRef } from "react";

const ETAPAS = [
  { id: 0, nombre: "Recibido",     icono: "▼", desc: "Verificación de albarán y conteo de bultos",           estandar: 60  },
  { id: 1, nombre: "Ubicado",      icono: "◈", desc: "Transporte e introducción en ubicación WMS",           estandar: 90  },
  { id: 2, nombre: "Picking",      icono: "◉", desc: "Extracción del producto de su ubicación",              estandar: null }, // variable por producto
  { id: 3, nombre: "Verificación", icono: "✓", desc: "Comprobación de referencia y cantidad",                estandar: 30  },
  { id: 4, nombre: "Expedición",   icono: "▲", desc: "Etiquetado y preparación para envío",                  estandar: 45  },
];

const ESTANDAR_PICKING = {
  "Variador":   180, "Contactor":  45, "Sensor":     60,
  "PLC":        120, "Relé":       40, "Cable":      90,
  "Interruptor": 50, "Otro":       75,
};

const PEDIDOS_DEMO = [
  { id: 1, producto: "Variador ATV320 U22M2", referencia: "ATV320U22M2", categoria: "Variador",    cantidad: 1, cliente: "Instalaciones García", urgente: true  },
  { id: 2, producto: "Contactor LC1D40 220V", referencia: "LC1D40M7",    categoria: "Contactor",   cantidad: 3, cliente: "Mantenimiento Repsol", urgente: false },
  { id: 3, producto: "Sensor inductivo IF5932", referencia: "IF5932",    categoria: "Sensor",      cantidad: 2, cliente: "Planta Ford Almussafes", urgente: false },
];

const PROMPT_ANALISIS = (pedido, tiempos, estandares, desviaciones) => `Eres el responsable de logística de un almacén de distribución eléctrica de Sonepar España. Analiza la simulación de flujo completada.

Pedido: ${pedido.producto} (${pedido.referencia}) — cantidad: ${pedido.cantidad}
Cliente: ${pedido.cliente}

Tiempos reales por etapa (segundos):
${ETAPAS.map((e, i) => `- ${e.nombre}: ${tiempos[i]}s (estándar: ${estandares[i]}s, desviación: ${desviaciones[i] > 0 ? '+' : ''}${desviaciones[i]}%)`).join('\n')}

Tiempo total: ${tiempos.reduce((a, b) => a + b, 0)}s

Responde en 2 párrafos breves: (1) análisis del rendimiento por etapa mencionando tiempos concretos, (2) recomendación específica para la etapa más lenta. Tono directo, sin adornos.`;

export default function SimuladorAlmacen() {
  const [pantalla, setPantalla] = useState("onboarding"); // onboarding | selector | simulacion | resultado
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [etapaActual, setEtapaActual] = useState(0);
  const [tiempos, setTiempos] = useState([]);
  const [tiempoEtapa, setTiempoEtapa] = useState(0);
  const [log, setLog] = useState([]);
  const [analisis, setAnalisis] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [formManual, setFormManual] = useState({ producto: "", referencia: "", categoria: "Contactor", cantidad: "1", cliente: "" });
  const [modoManual, setModoManual] = useState(false);

  const intervalRef = useRef(null);
  const inicioEtapaRef = useRef(null);

  useEffect(() => {
    try {
      const h = localStorage.getItem("sonepar_simulaciones");
      if (h) setHistorial(JSON.parse(h));
    } catch {}
  }, []);

  // Cronómetro
  useEffect(() => {
    if (pantalla === "simulacion") {
      inicioEtapaRef.current = Date.now();
      setTiempoEtapa(0);
      intervalRef.current = setInterval(() => {
        setTiempoEtapa(Math.floor((Date.now() - inicioEtapaRef.current) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pantalla, etapaActual]);

  const iniciarSimulacion = (pedido) => {
    setPedidoActivo(pedido);
    setEtapaActual(0);
    setTiempos([]);
    setLog([]);
    setAnalisis("");
    addLog(`Pedido iniciado: ${pedido.producto}`);
    setPantalla("simulacion");
  };

  const addLog = (msg) => {
    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [`[${hora}] ${msg}`, ...prev].slice(0, 20));
  };

  const getEstandar = (etapaId) => {
    if (etapaId === 2 && pedidoActivo) {
      return ESTANDAR_PICKING[pedidoActivo.categoria] || 75;
    }
    return ETAPAS[etapaId].estandar;
  };

  const getEstado = (tiempo, estandar) => {
    if (!estandar) return null;
    const pct = (tiempo / estandar) * 100;
    if (pct <= 100) return { label: "DENTRO DEL ESTÁNDAR", color: "#2e7d32", bg: "#e8f5e9" };
    if (pct <= 150) return { label: "LENTO", color: "#f9a825", bg: "#fffde7" };
    return { label: "MUY LENTO", color: "#c62828", bg: "#ffebee" };
  };

  const avanzarEtapa = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const segundos = Math.floor((Date.now() - inicioEtapaRef.current) / 1000);
    const est = getEstandar(etapaActual);
    const estado = getEstado(segundos, est);
    const nuevos = [...tiempos, segundos];
    setTiempos(nuevos);
    addLog(`${ETAPAS[etapaActual].nombre} completada en ${segundos}s ${estado ? `— ${estado.label}` : ""}`);

    if (etapaActual < ETAPAS.length - 1) {
      setEtapaActual(etapaActual + 1);
    } else {
      // Completado
      completarSimulacion(nuevos);
    }
  };

  const completarSimulacion = async (tiemposFinales) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPantalla("resultado");
    setCargando(true);

    const estandares = ETAPAS.map((_, i) => getEstandar(i) || 75);
    const desviaciones = tiemposFinales.map((t, i) => Math.round(((t - estandares[i]) / estandares[i]) * 100));

    // Guardar en historial
    const entrada = {
      fecha: Date.now(),
      producto: pedidoActivo.producto,
      referencia: pedidoActivo.referencia,
      cliente: pedidoActivo.cliente,
      tiempos: tiemposFinales,
      estandares,
      desviaciones,
      totalTiempo: tiemposFinales.reduce((a, b) => a + b, 0),
      cuellosBottella: tiemposFinales.map((t, i) => ({ etapa: i, pct: Math.round((t / estandares[i]) * 100) })).filter(x => x.pct > 150).map(x => x.etapa),
    };

    const nuevoHistorial = [entrada, ...historial].slice(0, 10);
    setHistorial(nuevoHistorial);
    try { localStorage.setItem("sonepar_simulaciones", JSON.stringify(nuevoHistorial)); } catch {}

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_ANALISIS(pedidoActivo, tiemposFinales, estandares, desviaciones) }],
        }),
      });
      const data = await res.json();
      setAnalisis(data.content?.map(i => i.text || "").join("") || "");
    } catch { setAnalisis("Error al generar el análisis."); }
    setCargando(false);
  };

  const resetear = () => {
    setPantalla("selector");
    setPedidoActivo(null);
    setEtapaActual(0);
    setTiempos([]);
    setLog([]);
    setAnalisis("");
    setModoManual(false);
  };

  const iniciarManual = () => {
    if (!formManual.producto || !formManual.cliente) return;
    iniciarSimulacion({
      id: Date.now(), ...formManual,
      cantidad: parseInt(formManual.cantidad) || 1,
      urgente: false,
    });
  };

  const formatTiempo = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const S = {
    btn: (color = "#1a1a2e", full = false) => ({
      padding: "9px 22px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: color, color: "#fff", border: "none", cursor: "pointer",
      width: full ? "100%" : "auto",
    }),
    btnOutline: (color = "#1a1a2e") => ({
      padding: "7px 16px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer",
    }),
  };

  const estandarActual = pantalla === "simulacion" ? getEstandar(etapaActual) : null;
  const estadoCronometro = pantalla === "simulacion" && estandarActual ? getEstado(tiempoEtapa, estandarActual) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Georgia', serif", color: "#1a1a2e" }}>

      {/* Header */}
      <div style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: "3px solid #1a3a6a" }}>
        <div style={{ background: "#1a3a6a", padding: "16px 22px", display: "flex", alignItems: "center", marginRight: "20px" }}>
          <span style={{ fontWeight: "900", fontSize: "12px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
          <span style={{ color: "#4a7ab5", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>SIMULADOR DE ALMACÉN</span>
          <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>FLUJO DE PEDIDO · v2</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setMostrarHistorial(!mostrarHistorial)}
            style={{ ...S.btn(mostrarHistorial ? "#1a3a6a" : "#2a2a3e") }}>
            HISTORIAL ({historial.length})
          </button>
          {pantalla !== "onboarding" && (
            <button onClick={() => setPantalla("selector")} style={{ ...S.btn("#2a2a3e") }}>
              ← NUEVO PEDIDO
            </button>
          )}
        </div>
      </div>

      {/* Panel historial */}
      {mostrarHistorial && (
        <div style={{ background: "#1a1a2e", padding: "16px 32px", borderBottom: "1px solid #2a2a3e" }}>
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#666", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>ÚLTIMAS SIMULACIONES</div>
          {historial.length === 0 && (
            <div style={{ fontSize: "11px", color: "#555", fontFamily: "'Courier New', monospace" }}>Aún no hay simulaciones completadas</div>
          )}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {historial.map((h, i) => (
              <div key={i} style={{ background: "#2a2a3e", padding: "10px 14px", minWidth: "200px" }}>
                <div style={{ fontSize: "11px", color: "#ccc", marginBottom: "4px" }}>{h.producto}</div>
                <div style={{ fontSize: "9px", color: "#666", fontFamily: "'Courier New', monospace" }}>
                  {new Date(h.fecha).toLocaleDateString("es-ES")} · {formatTiempo(h.totalTiempo)} total
                </div>
                {h.cuellosBottella.length > 0 && (
                  <div style={{ fontSize: "9px", color: "#c62828", fontFamily: "'Courier New', monospace", marginTop: "4px" }}>
                    ⚠ Cuello de botella: {h.cuellosBottella.map(i => ETAPAS[i].nombre).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "32px" }}>

        {/* ONBOARDING */}
        {pantalla === "onboarding" && (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "40px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>BIENVENIDO AL SIMULADOR</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a2e", marginBottom: "16px", lineHeight: "1.2" }}>
                Simulador de Flujo de Almacén
              </div>
              <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.8", marginBottom: "28px" }}>
                Esta herramienta reproduce el ciclo completo de un pedido desde que entra al almacén hasta que sale expedido. Cada etapa del proceso tiene un tiempo estándar de referencia — el simulador mide cuánto tardas y te indica si estás dentro del estándar o no.
              </div>

              <div style={{ background: "#f4f1ec", padding: "20px", marginBottom: "28px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "14px" }}>LAS 5 ETAPAS DEL CICLO</div>
                <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                  {ETAPAS.map((e, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 6px", borderRight: i < 4 ? "1px solid #e0dbd4" : "none" }}>
                      <div style={{ fontSize: "16px", color: "#1a3a6a", marginBottom: "6px" }}>{e.icono}</div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>{e.nombre}</div>
                      <div style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                        {e.id === 2 ? "45–180s" : `${e.estandar}s`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
                {[
                  { titulo: "Selecciona un pedido", desc: "Elige entre los pedidos de demo o introduce uno manual" },
                  { titulo: "Avanza cada etapa", desc: "Pulsa el botón cuando termines cada fase del proceso" },
                  { titulo: "Revisa los tiempos", desc: "Al terminar verás el análisis IA con datos reales de tu simulación" },
                ].map(({ titulo, desc }, i) => (
                  <div key={i} style={{ flex: "1 1 160px" }}>
                    <div style={{ fontSize: "10px", fontFamily: "'Courier New', monospace", color: "#1a3a6a", marginBottom: "4px" }}>0{i + 1} · {titulo.toUpperCase()}</div>
                    <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.5" }}>{desc}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => setPantalla("selector")} style={{ ...S.btn("#1a3a6a"), padding: "13px 32px", fontSize: "11px" }}>
                INICIAR SIMULADOR ›
              </button>
            </div>
          </div>
        )}

        {/* SELECTOR */}
        {pantalla === "selector" && (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "20px" }}>SELECCIONA EL PEDIDO A SIMULAR</div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button onClick={() => setModoManual(false)} style={{ ...S.btn(!modoManual ? "#1a3a6a" : "#ddd"), color: !modoManual ? "#fff" : "#888" }}>PEDIDOS DEMO</button>
              <button onClick={() => setModoManual(true)}  style={{ ...S.btn(modoManual ? "#1a3a6a" : "#ddd"), color: modoManual ? "#fff" : "#888" }}>PEDIDO MANUAL</button>
            </div>

            {!modoManual && (
              <div style={{ display: "grid", gap: "10px" }}>
                {PEDIDOS_DEMO.map(p => (
                  <div key={p.id} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "16px", cursor: "pointer", borderLeft: `4px solid ${p.urgente ? "#c62828" : "#1a3a6a"}` }}
                    onClick={() => iniciarSimulacion(p)}>
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e" }}>{p.producto}</div>
                        {p.urgente && <span style={{ padding: "2px 8px", background: "#c62828", color: "#fff", fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700" }}>URGENTE</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                        REF: {p.referencia} · Qty: {p.cantidad} · {p.cliente}
                      </div>
                    </div>
                    <button style={{ ...S.btn("#1a3a6a") }}>SIMULAR ›</button>
                  </div>
                ))}
              </div>
            )}

            {modoManual && (
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "24px" }}>
                {[
                  { key: "producto", label: "PRODUCTO / DESCRIPCIÓN", placeholder: "Ej: Relé de protección RW2" },
                  { key: "referencia", label: "REFERENCIA", placeholder: "Ej: RW2-LD-2016-1" },
                  { key: "cliente", label: "CLIENTE", placeholder: "Nombre del cliente o proyecto" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label}</div>
                    <input value={formManual[key]} onChange={e => setFormManual(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>CATEGORÍA</div>
                    <select value={formManual.categoria} onChange={e => setFormManual(p => ({ ...p, categoria: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }}>
                      {Object.keys(ESTANDAR_PICKING).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>CANTIDAD</div>
                    <input value={formManual.cantidad} onChange={e => setFormManual(p => ({ ...p, cantidad: e.target.value }))}
                      type="number" min="1"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
                  </div>
                </div>
                <button onClick={iniciarManual} style={{ ...S.btn("#1a3a6a", true), padding: "12px" }}>
                  INICIAR SIMULACIÓN ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* SIMULACIÓN */}
        {pantalla === "simulacion" && pedidoActivo && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>

            {/* Panel principal */}
            <div>
              {/* Info pedido */}
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "16px 20px", marginBottom: "20px", borderLeft: "4px solid #1a3a6a" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>PEDIDO ACTIVO</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e" }}>{pedidoActivo.producto}</div>
                <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                  REF: {pedidoActivo.referencia} · Qty: {pedidoActivo.cantidad} · {pedidoActivo.cliente}
                </div>
              </div>

              {/* Progreso etapas */}
              <div style={{ display: "flex", marginBottom: "24px" }}>
                {ETAPAS.map((e, i) => {
                  const completada = tiempos[i] !== undefined;
                  const activa = i === etapaActual;
                  const est = getEstandar(i);
                  const estadoEt = completada ? getEstado(tiempos[i], est) : null;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                      {i > 0 && (
                        <div style={{ position: "absolute", left: 0, top: "20px", width: "50%", height: "2px", background: completada || activa ? "#1a3a6a" : "#e0dbd4" }} />
                      )}
                      {i < 4 && (
                        <div style={{ position: "absolute", right: 0, top: "20px", width: "50%", height: "2px", background: completada ? "#1a3a6a" : "#e0dbd4" }} />
                      )}
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", background: completada ? (estadoEt?.color || "#2e7d32") : activa ? "#1a3a6a" : "#e0dbd4", color: completada || activa ? "#fff" : "#aaa", fontWeight: "700", border: activa ? "3px solid #4a7ab5" : "none" }}>
                          {completada ? "✓" : e.icono}
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: activa ? "700" : "400", color: activa ? "#1a1a2e" : "#888", fontFamily: "'Courier New', monospace" }}>{e.nombre.toUpperCase()}</div>
                        {completada && (
                          <div style={{ fontSize: "9px", color: estadoEt?.color || "#aaa", fontFamily: "'Courier New', monospace", marginTop: "2px" }}>{formatTiempo(tiempos[i])}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Etapa activa */}
              <div style={{ background: "#fff", border: "2px solid #1a3a6a", padding: "24px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>ETAPA ACTIVA</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#1a3a6a" }}>{ETAPAS[etapaActual].nombre}</div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>{ETAPAS[etapaActual].desc}</div>
                  </div>
                  {/* Cronómetro */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>TIEMPO</div>
                    <div style={{ fontSize: "36px", fontWeight: "700", color: estadoCronometro?.color || "#1a1a2e", fontFamily: "'Courier New', monospace" }}>
                      {formatTiempo(tiempoEtapa)}
                    </div>
                    {estandarActual && (
                      <div style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                        ESTÁNDAR: {formatTiempo(estandarActual)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado semáforo */}
                {estadoCronometro && (
                  <div style={{ padding: "8px 14px", background: estadoCronometro.bg, marginBottom: "16px", display: "inline-block" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: estadoCronometro.color, fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>
                      {estadoCronometro.label}
                    </span>
                  </div>
                )}

                <button onClick={avanzarEtapa} style={{ ...S.btn("#1a3a6a", true), padding: "14px", fontSize: "11px" }}>
                  {etapaActual < ETAPAS.length - 1 ? `COMPLETAR ${ETAPAS[etapaActual].nombre.toUpperCase()} →` : "COMPLETAR CICLO ›"}
                </button>
              </div>
            </div>

            {/* Log */}
            <div style={{ background: "#1a1a2e", padding: "16px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#555", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>LOG DE EVENTOS</div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {log.map((entry, i) => (
                  <div key={i} style={{ fontSize: "10px", color: i === 0 ? "#e8a020" : "#555", fontFamily: "'Courier New', monospace", marginBottom: "6px", lineHeight: "1.4" }}>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {pantalla === "resultado" && pedidoActivo && tiempos.length > 0 && (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>SIMULACIÓN COMPLETADA</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a2e", marginBottom: "20px" }}>{pedidoActivo.producto}</div>

            {/* Métricas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "TIEMPO TOTAL", valor: formatTiempo(tiempos.reduce((a, b) => a + b, 0)), color: "#1a3a6a" },
                { label: "ETAPA MÁS LENTA", valor: ETAPAS[tiempos.indexOf(Math.max(...tiempos))].nombre, color: "#c62828" },
                { label: "ETAPA MÁS RÁPIDA", valor: ETAPAS[tiempos.indexOf(Math.min(...tiempos))].nombre, color: "#2e7d32" },
              ].map(({ label, valor, color }) => (
                <div key={label} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "16px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{label}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color }}>{valor}</div>
                </div>
              ))}
            </div>

            {/* Tabla etapas */}
            <div style={{ background: "#fff", border: "1px solid #e0dbd4", marginBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 90px 90px 90px 1fr", padding: "10px 16px", background: "#1a1a2e", fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace" }}>
                {["ETAPA", "TIEMPO", "ESTÁNDAR", "DESV.", "RESULTADO"].map(h => <div key={h}>{h}</div>)}
              </div>
              {ETAPAS.map((e, i) => {
                const est = getEstandar(i) || 75;
                const desv = Math.round(((tiempos[i] - est) / est) * 100);
                const estado = getEstado(tiempos[i], est);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 90px 90px 90px 1fr", padding: "12px 16px", borderBottom: i < 4 ? "1px solid #f5f0e8" : "none", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{e.nombre}</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", fontWeight: "700" }}>{formatTiempo(tiempos[i])}</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#aaa" }}>{formatTiempo(est)}</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: desv > 0 ? "#c62828" : "#2e7d32", fontWeight: "700" }}>
                      {desv > 0 ? "+" : ""}{desv}%
                    </div>
                    <div style={{ padding: "3px 10px", background: estado?.bg, color: estado?.color, fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700", display: "inline-block" }}>
                      {estado?.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Análisis IA */}
            <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px", marginBottom: "20px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>◈ ANÁLISIS IA</div>
              {cargando ? (
                <div style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>ANALIZANDO TIEMPOS...</div>
              ) : (
                <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{analisis}</div>
              )}
            </div>

            <button onClick={resetear} style={{ ...S.btn("#1a3a6a"), padding: "12px 28px" }}>
              NUEVA SIMULACIÓN ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
