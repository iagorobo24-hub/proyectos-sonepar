import { useState, useEffect } from "react";

const SEVERIDADES = ["Crítica", "Alta", "Media", "Baja"];
const ESTADOS = ["Abierta", "En diagnóstico", "Resuelta", "Escalada"];
const ZONAS = ["Zona A — Recepción", "Zona B — Almacén alto", "Zona C — Picking", "Zona D — Expedición", "Zona E — Mantenimiento"];
const COLOR_SEV = { "Crítica": "#c62828", "Alta": "#e65100", "Media": "#f9a825", "Baja": "#2e7d32" };
const COLOR_EST = { "Abierta": "#1565c0", "En diagnóstico": "#6a1b9a", "Resuelta": "#2e7d32", "Escalada": "#c62828" };

const DEMOS = () => [
  { id: 1, equipo: "Variador ATV320 — Línea 3", zona: "Zona C — Picking", operario: "M. Fernández", sintoma: "El variador se dispara por sobrecalentamiento a los 20 minutos de arranque. Alarma F0028.", severidad: "Crítica", estado: "Abierta", fechaCreacion: Date.now() - 1800000, fechaResolucion: null, observaciones: "", diagnostico: null },
  { id: 2, equipo: "Contactor LC1D40 — Cuadro 7", zona: "Zona B — Almacén alto", operario: "A. López", sintoma: "La bobina no atrae al energizar. Se escucha un zumbido pero el contactor no cierra.", severidad: "Alta", estado: "En diagnóstico", fechaCreacion: Date.now() - 5400000, fechaResolucion: null, observaciones: "Medida tensión en bornes bobina: 218V AC. Parece correcta.", diagnostico: null },
  { id: 3, equipo: "Sensor inductivo IF5932", zona: "Zona D — Expedición", operario: "R. Martínez", sintoma: "Falso positivo intermitente. El sensor detecta presencia cuando la cinta está vacía.", severidad: "Media", estado: "Resuelta", fechaCreacion: Date.now() - 86400000, fechaResolucion: Date.now() - 43200000, observaciones: "Resuelto limpiando la cara activa del sensor con IPA.", diagnostico: { causa_probable: "Suciedad en la cara activa del sensor reduciendo la distancia de detección efectiva.", pasos_verificacion: ["Limpiar cara activa con alcohol isopropílico", "Verificar distancia de montaje (debe ser ≤ Sn/2)", "Comprobar apantallamiento eléctrico del cable"], solucion: "Limpieza de la cara activa y ajuste de la distancia de montaje a 3mm.", medidas_preventivas: ["Incluir limpieza de sensores en el mantenimiento semanal", "Revisar el tendido del cable sensor para evitar interferencias"] } },
  { id: 4, equipo: "PLC Modicon M241", zona: "Zona A — Recepción", operario: "C. González", sintoma: "Pérdida de comunicación Modbus con los drives de la línea de recepción. Error E/S en pantalla.", severidad: "Alta", estado: "Escalada", fechaCreacion: Date.now() - 10800000, fechaResolucion: null, observaciones: "", diagnostico: null },
];

const PROMPT_DIAGNOSTICO = (inc) => `Eres un técnico de mantenimiento industrial con 15 años de experiencia en automatización, PLCs, variadores, sensores y equipos de almacén logístico. Trabajas en una delegación de Sonepar España.

Incidencia reportada:
- Equipo: ${inc.equipo}
- Zona: ${inc.zona}
- Síntoma: ${inc.sintoma}
- Severidad: ${inc.severidad}

Responde ÚNICAMENTE con JSON válido sin backticks ni markdown:
{
  "causa_probable": "descripción técnica concisa de la causa más probable",
  "pasos_verificacion": ["paso 1 concreto y accionable", "paso 2", "paso 3"],
  "solucion": "solución recomendada con referencias a materiales o ajustes concretos",
  "medidas_preventivas": ["medida preventiva 1", "medida preventiva 2"]
}`;

export default function DashboardIncidencias() {
  const [incidencias, setIncidencias] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroSev, setFiltroSev] = useState("Todas");
  const [seleccionada, setSeleccionada] = useState(null);
  const [modo, setModo] = useState("lista"); // lista | detalle | nueva
  const [form, setForm] = useState({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
  const [cargandoIA, setCargandoIA] = useState(false);
  const [toast, setToast] = useState("");
  const [ahora, setAhora] = useState(Date.now());

  // Reloj para alerta crítica
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Cargar desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_incidencias");
      if (saved) {
        let data = JSON.parse(saved);
        // Migración: añadir campos v2 si faltan
        data = data.map(inc => ({
          fechaCreacion: Date.now() - 1800000,
          fechaResolucion: null,
          observaciones: "",
          ...inc,
        }));
        setIncidencias(data);
      } else {
        setIncidencias(DEMOS());
      }
    } catch {
      setIncidencias(DEMOS());
    }
  }, []);

  // Guardar en localStorage
  const guardar = (data) => {
    setIncidencias(data);
    try { localStorage.setItem("sonepar_incidencias", JSON.stringify(data)); } catch {}
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Incidencias críticas sin atender > 2h
  const criticas = incidencias.filter(i =>
    i.severidad === "Crítica" &&
    i.estado === "Abierta" &&
    (ahora - i.fechaCreacion) > 7200000
  );

  // KPIs
  const kpis = {
    criticas: incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta").length,
    abiertas: incidencias.filter(i => i.estado === "Abierta").length,
    enDiagnostico: incidencias.filter(i => i.estado === "En diagnóstico").length,
    resueltas: incidencias.filter(i => i.estado === "Resuelta").length,
  };

  // Estadísticas de resolución
  const resueltas = incidencias.filter(i => i.estado === "Resuelta" && i.fechaResolucion);
  const statsResolucion = resueltas.reduce((acc, inc) => {
    const horas = ((inc.fechaResolucion - inc.fechaCreacion) / 3600000).toFixed(1);
    const equipo = inc.equipo.split("—")[0].trim();
    if (!acc[equipo]) acc[equipo] = [];
    acc[equipo].push(parseFloat(horas));
    return acc;
  }, {});

  // Filtrado
  const filtradas = incidencias.filter(i =>
    (filtroEstado === "Todas" || i.estado === filtroEstado) &&
    (filtroSev === "Todas" || i.severidad === filtroSev)
  );

  // Cambiar estado
  const cambiarEstado = (id, nuevoEstado) => {
    const data = incidencias.map(i => i.id === id ? {
      ...i,
      estado: nuevoEstado,
      fechaResolucion: nuevoEstado === "Resuelta" ? Date.now() : i.fechaResolucion,
    } : i);
    guardar(data);
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id));
    showToast(`Estado actualizado: ${nuevoEstado}`);
  };

  // Guardar observación
  const guardarObservacion = (id, texto) => {
    const data = incidencias.map(i => i.id === id ? { ...i, observaciones: texto } : i);
    guardar(data);
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id));
    showToast("Observación guardada");
  };

  // Nueva incidencia
  const crearIncidencia = () => {
    if (!form.equipo || !form.operario || !form.sintoma) { showToast("⚠ Completa todos los campos"); return; }
    const nueva = { ...form, id: Date.now(), estado: "Abierta", fechaCreacion: Date.now(), fechaResolucion: null, observaciones: "", diagnostico: null };
    guardar([nueva, ...incidencias]);
    setForm({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
    setModo("lista");
    showToast("Incidencia registrada correctamente");
  };

  // Diagnóstico IA
  const generarDiagnostico = async (inc) => {
    setCargandoIA(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_DIAGNOSTICO(inc) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const diag = JSON.parse(text.replace(/```json|```/g, "").trim());
      const updated = incidencias.map(i => i.id === inc.id ? { ...i, diagnostico: diag, estado: i.estado === "Abierta" ? "En diagnóstico" : i.estado } : i);
      guardar(updated);
      setSeleccionada(updated.find(i => i.id === inc.id));
      showToast("Diagnóstico IA generado");
    } catch { showToast("Error al generar diagnóstico"); }
    setCargandoIA(false);
  };

  const formatTiempo = (ts) => {
    const min = Math.floor((ahora - ts) / 60000);
    if (min < 60) return `Hace ${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${Math.floor(h / 24)}d`;
  };

  const S = {
    btn: (color = "#1a1a2e") => ({
      padding: "7px 16px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: color, color: "#fff", border: "none", cursor: "pointer",
    }),
    btnOutline: (color = "#1a1a2e") => ({
      padding: "6px 14px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer",
    }),
  };

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } textarea { resize: vertical; }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a1a2e", color: "#e8a020", padding: "12px 20px", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Georgia', serif", color: "#1a1a2e" }}>

        {/* Header */}
        <div style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: "3px solid #c62828" }}>
          <div style={{ background: "#c62828", padding: "16px 22px", display: "flex", alignItems: "center", marginRight: "20px" }}>
            <span style={{ fontWeight: "900", fontSize: "12px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <span style={{ color: "#c62828", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>INCIDENCIAS</span>
            <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>TÉCNICAS · v2</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setModo("lista")} style={{ ...S.btn(modo === "lista" ? "#c62828" : "#2a2a3e") }}>LISTADO</button>
            <button onClick={() => { setModo("nueva"); setSeleccionada(null); }} style={{ ...S.btn(modo === "nueva" ? "#c62828" : "#2a2a3e") }}>+ NUEVA</button>
          </div>
        </div>

        {/* Alerta crítica */}
        {criticas.length > 0 && (
          <div style={{ background: "#c62828", padding: "10px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#fff", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "2px", fontWeight: "700" }}>
              ⚠ {criticas.length} INCIDENCIA{criticas.length > 1 ? "S" : ""} CRÍTICA{criticas.length > 1 ? "S" : ""} SIN ATENDER MÁS DE 2 HORAS:
            </span>
            <span style={{ color: "#ffcdd2", fontFamily: "'Courier New', monospace", fontSize: "11px" }}>
              {criticas.map(i => i.equipo.split("—")[0].trim()).join(" · ")}
            </span>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "#e0dbd4", borderBottom: "1px solid #e0dbd4" }}>
          {[
            { label: "CRÍTICAS ACTIVAS", valor: kpis.criticas, color: "#c62828" },
            { label: "ABIERTAS", valor: kpis.abiertas, color: "#1565c0" },
            { label: "EN DIAGNÓSTICO", valor: kpis.enDiagnostico, color: "#6a1b9a" },
            { label: "RESUELTAS", valor: kpis.resueltas, color: "#2e7d32" },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{ background: "#fff", padding: "18px 24px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{label}</div>
              <div style={{ fontSize: "32px", fontWeight: "700", color }}>{valor}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: seleccionada && modo === "detalle" ? "1fr 400px" : "1fr", minHeight: "calc(100vh - 160px)" }}>

          {/* Panel izquierdo */}
          <div style={{ padding: "24px 32px" }}>

            {/* MODO NUEVA */}
            {modo === "nueva" && (
              <div style={{ maxWidth: "600px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "20px" }}>REGISTRAR NUEVA INCIDENCIA</div>
                {[
                  { label: "EQUIPO / REFERENCIA", key: "equipo", type: "text", placeholder: "Ej: Variador ATV320 — Línea 3" },
                  { label: "OPERARIO QUE REPORTA", key: "operario", type: "text", placeholder: "Nombre del operario" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label}</div>
                    <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "'Georgia', serif", outline: "none", background: "#fff" }}
                    />
                  </div>
                ))}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>ZONA</div>
                    <select value={form.zona} onChange={e => setForm(p => ({ ...p, zona: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none", background: "#fff" }}>
                      {ZONAS.map(z => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>SEVERIDAD</div>
                    <select value={form.severidad} onChange={e => setForm(p => ({ ...p, severidad: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none", background: "#fff", color: COLOR_SEV[form.severidad] }}>
                      {SEVERIDADES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>DESCRIPCIÓN DEL SÍNTOMA</div>
                  <textarea value={form.sintoma} onChange={e => setForm(p => ({ ...p, sintoma: e.target.value }))}
                    placeholder="Describe el síntoma con el máximo detalle posible: cuándo ocurre, con qué frecuencia, qué indicadores o alarmas aparecen..."
                    rows={4}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "'Georgia', serif", outline: "none", background: "#fff" }}
                  />
                </div>
                <button onClick={crearIncidencia} style={{ ...S.btn("#c62828"), padding: "12px 28px", fontSize: "11px" }}>
                  REGISTRAR INCIDENCIA ›
                </button>
              </div>
            )}

            {/* MODO LISTA */}
            {(modo === "lista" || modo === "detalle") && (
              <>
                {/* Filtros */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>ESTADO:</span>
                  {["Todas", ...ESTADOS].map(e => (
                    <button key={e} onClick={() => setFiltroEstado(e)}
                      style={{ padding: "5px 12px", fontSize: "10px", fontFamily: "'Courier New', monospace", cursor: "pointer", fontWeight: "700", letterSpacing: "1px", background: filtroEstado === e ? "#1a1a2e" : "#fff", color: filtroEstado === e ? "#fff" : "#888", border: `1px solid ${filtroEstado === e ? "#1a1a2e" : "#ddd"}` }}>
                      {e.toUpperCase()}
                    </button>
                  ))}
                  <span style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginLeft: "8px" }}>SEV:</span>
                  {["Todas", ...SEVERIDADES].map(s => (
                    <button key={s} onClick={() => setFiltroSev(s)}
                      style={{ padding: "5px 12px", fontSize: "10px", fontFamily: "'Courier New', monospace", cursor: "pointer", fontWeight: "700", letterSpacing: "1px", background: filtroSev === s ? (COLOR_SEV[s] || "#1a1a2e") : "#fff", color: filtroSev === s ? "#fff" : "#888", border: `1px solid ${filtroSev === s ? (COLOR_SEV[s] || "#1a1a2e") : "#ddd"}` }}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Tabla */}
                <div style={{ background: "#fff", border: "1px solid #e0dbd4" }}>
                  {/* Cabecera */}
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 140px 120px 90px 90px", padding: "10px 16px", background: "#1a1a2e", fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace" }}>
                    {["SEVERIDAD", "EQUIPO / SÍNTOMA", "ZONA", "ESTADO", "DIAG. IA", "TIEMPO"].map(h => <div key={h}>{h}</div>)}
                  </div>

                  {filtradas.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontFamily: "'Courier New', monospace", fontSize: "12px", letterSpacing: "2px" }}>
                      SIN INCIDENCIAS CON ESTOS FILTROS
                    </div>
                  )}

                  {filtradas.map((inc, i) => (
                    <div key={inc.id}
                      onClick={() => { setSeleccionada(inc); setModo("detalle"); }}
                      style={{ display: "grid", gridTemplateColumns: "120px 1fr 140px 120px 90px 90px", padding: "14px 16px", borderBottom: "1px solid #f5f0e8", cursor: "pointer", background: seleccionada?.id === inc.id ? "#fdf8f0" : i % 2 === 0 ? "#fff" : "#fdfcfa", borderLeft: `4px solid ${COLOR_SEV[inc.severidad]}`, alignItems: "center" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fdf8f0"}
                      onMouseLeave={e => e.currentTarget.style.background = seleccionada?.id === inc.id ? "#fdf8f0" : i % 2 === 0 ? "#fff" : "#fdfcfa"}
                    >
                      <div style={{ fontSize: "11px", fontWeight: "700", color: COLOR_SEV[inc.severidad], fontFamily: "'Courier New', monospace" }}>{inc.severidad.toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e", marginBottom: "2px" }}>{inc.equipo}</div>
                        <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.4" }}>{inc.sintoma.slice(0, 80)}{inc.sintoma.length > 80 ? "..." : ""}</div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", fontFamily: "'Courier New', monospace" }}>{inc.zona.split("—")[0].trim()}</div>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: COLOR_EST[inc.estado], fontFamily: "'Courier New', monospace", letterSpacing: "0.5px" }}>{inc.estado.toUpperCase()}</div>
                      {/* Indicador diagnóstico IA */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ padding: "3px 8px", fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700", background: inc.diagnostico ? "#e8f5e9" : "#f5f5f5", color: inc.diagnostico ? "#2e7d32" : "#bbb", border: `1px solid ${inc.diagnostico ? "#a5d6a7" : "#e0e0e0"}` }}>
                          {inc.diagnostico ? "✓" : "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{formatTiempo(inc.fechaCreacion)}</div>
                    </div>
                  ))}
                </div>

                {/* Estadísticas de resolución */}
                {Object.keys(statsResolucion).length >= 2 && (
                  <div style={{ marginTop: "20px", background: "#fff", border: "1px solid #e0dbd4", padding: "16px 20px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>TIEMPO MEDIO DE RESOLUCIÓN POR EQUIPO</div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {Object.entries(statsResolucion).map(([equipo, tiempos]) => {
                        const media = (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1);
                        return (
                          <div key={equipo} style={{ background: "#f4f1ec", padding: "10px 16px", minWidth: "140px" }}>
                            <div style={{ fontSize: "10px", color: "#888", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>{equipo}</div>
                            <div style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a2e" }}>{media}h</div>
                            <div style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{tiempos.length} resolución{tiempos.length > 1 ? "es" : ""}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel detalle */}
          {seleccionada && modo === "detalle" && (
            <div style={{ background: "#fff", borderLeft: "1px solid #e0dbd4", padding: "24px", overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>INCIDENCIA #{seleccionada.id.toString().slice(-4)}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e", lineHeight: "1.3" }}>{seleccionada.equipo}</div>
                </div>
                <button onClick={() => { setSeleccionada(null); setModo("lista"); }} style={{ background: "transparent", border: "none", fontSize: "18px", color: "#aaa", cursor: "pointer" }}>✕</button>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Courier New', monospace", fontWeight: "700", background: COLOR_SEV[seleccionada.severidad], color: "#fff" }}>{seleccionada.severidad.toUpperCase()}</span>
                <span style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Courier New', monospace", fontWeight: "700", color: COLOR_EST[seleccionada.estado], border: `1px solid ${COLOR_EST[seleccionada.estado]}` }}>{seleccionada.estado.toUpperCase()}</span>
              </div>

              {/* Datos */}
              {[
                ["Zona", seleccionada.zona],
                ["Operario", seleccionada.operario],
                ["Registrada", formatTiempo(seleccionada.fechaCreacion)],
                seleccionada.fechaResolucion ? ["Resuelta", formatTiempo(seleccionada.fechaResolucion)] : null,
              ].filter(Boolean).map(([label, valor]) => (
                <div key={label} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "12px" }}>
                  <span style={{ color: "#aaa", fontFamily: "'Courier New', monospace", minWidth: "70px", fontSize: "10px", paddingTop: "2px" }}>{label.toUpperCase()}</span>
                  <span style={{ color: "#444" }}>{valor}</span>
                </div>
              ))}

              <div style={{ marginTop: "12px", padding: "12px", background: "#f4f1ec", fontSize: "13px", color: "#333", lineHeight: "1.6", marginBottom: "16px" }}>
                {seleccionada.sintoma}
              </div>

              {/* Cambiar estado */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>CAMBIAR ESTADO</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {ESTADOS.filter(e => e !== seleccionada.estado).map(e => (
                    <button key={e} onClick={() => cambiarEstado(seleccionada.id, e)}
                      style={{ ...S.btnOutline(COLOR_EST[e]), padding: "5px 12px", fontSize: "9px" }}>
                      {e.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>OBSERVACIONES DE SEGUIMIENTO</div>
                <ObservacionesEditor
                  initial={seleccionada.observaciones}
                  onSave={(texto) => guardarObservacion(seleccionada.id, texto)}
                />
              </div>

              {/* Diagnóstico IA */}
              <div style={{ borderTop: "1px solid #f0ebe0", paddingTop: "16px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>◈ DIAGNÓSTICO IA</div>

                {!seleccionada.diagnostico && (
                  <button onClick={() => generarDiagnostico(seleccionada)} disabled={cargandoIA}
                    style={{ ...S.btn(cargandoIA ? "#aaa" : "#1a1a2e"), padding: "10px 20px", width: "100%" }}>
                    {cargandoIA ? "ANALIZANDO..." : "GENERAR DIAGNÓSTICO IA ›"}
                  </button>
                )}

                {seleccionada.diagnostico && (
                  <div>
                    {[
                      { titulo: "CAUSA PROBABLE", contenido: seleccionada.diagnostico.causa_probable, color: "#c62828" },
                      { titulo: "SOLUCIÓN", contenido: seleccionada.diagnostico.solucion, color: "#1565c0" },
                    ].map(({ titulo, contenido, color }) => (
                      <div key={titulo} style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "9px", letterSpacing: "2px", color, fontFamily: "'Courier New', monospace", marginBottom: "6px", fontWeight: "700" }}>{titulo}</div>
                        <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6", padding: "10px 12px", background: "#f4f1ec" }}>{contenido}</div>
                      </div>
                    ))}

                    {[
                      { titulo: "PASOS DE VERIFICACIÓN", items: seleccionada.diagnostico.pasos_verificacion },
                      { titulo: "MEDIDAS PREVENTIVAS", items: seleccionada.diagnostico.medidas_preventivas },
                    ].map(({ titulo, items }) => (
                      <div key={titulo} style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{titulo}</div>
                        {items?.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px", alignItems: "flex-start" }}>
                            <span style={{ color: "#1a1a2e", fontFamily: "'Courier New', monospace", fontSize: "10px", paddingTop: "3px", flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ fontSize: "12px", color: "#555", lineHeight: "1.5" }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}

                    <button onClick={() => generarDiagnostico(seleccionada)} disabled={cargandoIA}
                      style={{ ...S.btnOutline("#aaa"), width: "100%", fontSize: "9px", padding: "6px" }}>
                      {cargandoIA ? "ANALIZANDO..." : "REGENERAR DIAGNÓSTICO"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Componente separado para observaciones con estado local
function ObservacionesEditor({ initial, onSave }) {
  const [texto, setTexto] = useState(initial || "");
  const [editado, setEditado] = useState(false);

  useEffect(() => { setTexto(initial || ""); setEditado(false); }, [initial]);

  return (
    <div>
      <textarea
        value={texto}
        onChange={e => { setTexto(e.target.value); setEditado(true); }}
        placeholder="Añade notas de seguimiento: lecturas de tensión, medidas tomadas, personas contactadas..."
        maxLength={500}
        rows={3}
        style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", fontSize: "12px", fontFamily: "'Georgia', serif", outline: "none", background: "#fff" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <span style={{ fontSize: "9px", color: "#ccc", fontFamily: "'Courier New', monospace" }}>{texto.length}/500</span>
        {editado && (
          <button onClick={() => { onSave(texto); setEditado(false); }}
            style={{ padding: "5px 14px", fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700", background: "#1a1a2e", color: "#fff", border: "none", cursor: "pointer", letterSpacing: "1px" }}>
            GUARDAR OBSERVACIÓN
          </button>
        )}
      </div>
    </div>
  );
}
