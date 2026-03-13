import { useState, useEffect } from "react";

// ── Design system corporativo Sonepar ──────────────────────────────────────
const C = {
  navy:       "#003087",
  navyDark:   "#002060",
  blue:       "#4A90D9",
  blueMid:    "#1565C0",
  bg:         "#F5F6F8",
  white:      "#FFFFFF",
  border:     "#D8DCE6",
  textPri:    "#1A1F36",
  textSec:    "#5C6080",
  textMuted:  "#9399B2",
  optimal:    "#1B6B3A",
  optimalBg:  "#E8F5EE",
  accept:     "#C07010",
  acceptBg:   "#FFF3E0",
  critical:   "#C62828",
  criticalBg: "#FDEDED",
  blueBg:     "#EBF3FC",
  purple:     "#6A1B9A",
  purpleBg:   "#F3E5F5",
};

const SvgLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="16" rx="14" ry="8" stroke="white" strokeWidth="1.8" fill="none"/>
    <ellipse cx="16" cy="16" rx="8" ry="14" stroke="white" strokeWidth="1.8" fill="none"/>
    <circle cx="16" cy="16" r="2.5" fill="white"/>
  </svg>
);

const SEVERIDADES = ["Crítica", "Alta", "Media", "Baja"];
const ESTADOS = ["Abierta", "En diagnóstico", "Resuelta", "Escalada"];
const ZONAS = ["Zona A — Recepción", "Zona B — Almacén alto", "Zona C — Picking", "Zona D — Expedición", "Zona E — Mantenimiento"];

const SEV_COLOR = { "Crítica": C.critical, "Alta": "#E65100", "Media": C.accept, "Baja": C.optimal };
const SEV_BG    = { "Crítica": C.criticalBg, "Alta": "#FBE9E7", "Media": C.acceptBg, "Baja": C.optimalBg };
const EST_COLOR = { "Abierta": C.blueMid, "En diagnóstico": C.purple, "Resuelta": C.optimal, "Escalada": C.critical };
const EST_BG    = { "Abierta": C.blueBg, "En diagnóstico": C.purpleBg, "Resuelta": C.optimalBg, "Escalada": C.criticalBg };

const DEMOS = () => [
  { id: 1, equipo: "Variador ATV320 — Línea 3", zona: "Zona C — Picking", operario: "M. Fernández", sintoma: "El variador se dispara por sobrecalentamiento a los 20 minutos de arranque. Alarma F0028.", severidad: "Crítica", estado: "Abierta", fechaCreacion: Date.now() - 1800000, fechaResolucion: null, observaciones: "", diagnostico: null },
  { id: 2, equipo: "Contactor LC1D40 — Cuadro 7", zona: "Zona B — Almacén alto", operario: "A. López", sintoma: "La bobina no atrae al energizar. Se escucha un zumbido pero el contactor no cierra.", severidad: "Alta", estado: "En diagnóstico", fechaCreacion: Date.now() - 5400000, fechaResolucion: null, observaciones: "Medida tensión en bornes bobina: 218V AC. Parece correcta.", diagnostico: null },
  { id: 3, equipo: "Sensor inductivo IF5932", zona: "Zona D — Expedición", operario: "R. Martínez", sintoma: "Falso positivo intermitente. El sensor detecta presencia cuando la cinta está vacía.", severidad: "Media", estado: "Resuelta", fechaCreacion: Date.now() - 86400000, fechaResolucion: Date.now() - 43200000, observaciones: "Resuelto limpiando la cara activa con IPA.", diagnostico: { causa_probable: "Suciedad en la cara activa del sensor reduciendo la distancia de detección efectiva.", pasos_verificacion: ["Limpiar cara activa con alcohol isopropílico", "Verificar distancia de montaje (debe ser ≤ Sn/2)", "Comprobar apantallamiento eléctrico del cable"], solucion: "Limpieza de la cara activa y ajuste de la distancia de montaje a 3mm.", medidas_preventivas: ["Incluir limpieza de sensores en el mantenimiento semanal", "Revisar el tendido del cable sensor para evitar interferencias"] } },
  { id: 4, equipo: "PLC Modicon M241", zona: "Zona A — Recepción", operario: "C. González", sintoma: "Pérdida de comunicación Modbus con los drives de la línea de recepción. Error E/S en pantalla.", severidad: "Alta", estado: "Escalada", fechaCreacion: Date.now() - 10800000, fechaResolucion: null, observaciones: "", diagnostico: null },
];

const PROMPT_DIAGNOSTICO = (inc) => `Eres un técnico de mantenimiento industrial con 15 años de experiencia en automatización, PLCs, variadores, sensores y equipos de almacén logístico. Trabajas en una delegación de Sonepar España.\n\nIncidencia reportada:\n- Equipo: ${inc.equipo}\n- Zona: ${inc.zona}\n- Síntoma: ${inc.sintoma}\n- Severidad: ${inc.severidad}\n\nResponde ÚNICAMENTE con JSON válido sin backticks ni markdown:\n{\n  "causa_probable": "descripción técnica concisa de la causa más probable",\n  "pasos_verificacion": ["paso 1 concreto y accionable", "paso 2", "paso 3"],\n  "solucion": "solución recomendada con referencias a materiales o ajustes concretos",\n  "medidas_preventivas": ["medida preventiva 1", "medida preventiva 2"]\n}`;

// ── Badge severity / estado ────────────────────────────────────────────────
const SevBadge = ({ sev }) => (
  <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 10, fontWeight: 700,
    background: SEV_BG[sev], color: SEV_COLOR[sev], letterSpacing: "0.5px" }}>
    {sev.toUpperCase()}
  </span>
);
const EstBadge = ({ est }) => (
  <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 10, fontWeight: 700,
    background: EST_BG[est], color: EST_COLOR[est], letterSpacing: "0.5px" }}>
    {est.toUpperCase()}
  </span>
);

function ObservacionesEditor({ initial, onSave }) {
  const [texto, setTexto] = useState(initial || "");
  const [editado, setEditado] = useState(false);
  useEffect(() => { setTexto(initial || ""); setEditado(false); }, [initial]);
  return (
    <div>
      <textarea value={texto} rows={3} maxLength={500}
        onChange={e => { setTexto(e.target.value); setEditado(true); }}
        placeholder="Notas de seguimiento: lecturas de tensión, medidas tomadas, personas contactadas..."
        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`,
          borderRadius: 6, fontSize: 12, color: C.textPri, outline: "none",
          background: C.white, fontFamily: "system-ui,sans-serif" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{texto.length}/500</span>
        {editado && (
          <button onClick={() => { onSave(texto); setEditado(false); }}
            style={{ padding: "5px 14px", border: "none", borderRadius: 5,
              background: C.navy, color: C.white, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Guardar observación
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardIncidencias() {
  const [incidencias, setIncidencias] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroSev, setFiltroSev] = useState("Todas");
  const [seleccionada, setSeleccionada] = useState(null);
  const [modo, setModo] = useState("lista");
  const [form, setForm] = useState({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
  const [cargandoIA, setCargandoIA] = useState(false);
  const [toast, setToast] = useState("");
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_incidencias");
      if (saved) {
        const data = JSON.parse(saved).map(inc => ({
          fechaCreacion: Date.now() - 1800000, fechaResolucion: null, observaciones: "", ...inc,
        }));
        setIncidencias(data);
      } else { setIncidencias(DEMOS()); }
    } catch { setIncidencias(DEMOS()); }
  }, []);

  const guardar = (data) => {
    setIncidencias(data);
    try { localStorage.setItem("sonepar_incidencias", JSON.stringify(data)); } catch {}
  };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const criticas = incidencias.filter(i =>
    i.severidad === "Crítica" && i.estado === "Abierta" && (ahora - i.fechaCreacion) > 7200000);

  const kpis = {
    criticas: incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta").length,
    abiertas: incidencias.filter(i => i.estado === "Abierta").length,
    enDiag:   incidencias.filter(i => i.estado === "En diagnóstico").length,
    resueltas: incidencias.filter(i => i.estado === "Resuelta").length,
  };

  const resueltas = incidencias.filter(i => i.estado === "Resuelta" && i.fechaResolucion);
  const statsResolucion = resueltas.reduce((acc, inc) => {
    const h = ((inc.fechaResolucion - inc.fechaCreacion) / 3600000).toFixed(1);
    const eq = inc.equipo.split("—")[0].trim();
    if (!acc[eq]) acc[eq] = [];
    acc[eq].push(parseFloat(h));
    return acc;
  }, {});

  const filtradas = incidencias.filter(i =>
    (filtroEstado === "Todas" || i.estado === filtroEstado) &&
    (filtroSev === "Todas" || i.severidad === filtroSev));

  const cambiarEstado = (id, nuevoEstado) => {
    const data = incidencias.map(i => i.id === id ? {
      ...i, estado: nuevoEstado,
      fechaResolucion: nuevoEstado === "Resuelta" ? Date.now() : i.fechaResolucion,
    } : i);
    guardar(data);
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id));
    showToast(`Estado: ${nuevoEstado}`);
  };

  const guardarObservacion = (id, texto) => {
    const data = incidencias.map(i => i.id === id ? { ...i, observaciones: texto } : i);
    guardar(data);
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id));
    showToast("Observación guardada");
  };

  const crearIncidencia = () => {
    if (!form.equipo || !form.operario || !form.sintoma) { showToast("⚠ Completa todos los campos"); return; }
    const nueva = { ...form, id: Date.now(), estado: "Abierta", fechaCreacion: Date.now(),
      fechaResolucion: null, observaciones: "", diagnostico: null };
    guardar([nueva, ...incidencias]);
    setForm({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
    setModo("lista");
    showToast("Incidencia registrada");
  };

  const generarDiagnostico = async (inc) => {
    setCargandoIA(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_DIAGNOSTICO(inc) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const diag = JSON.parse(text.replace(/```json|```/g, "").trim());
      const updated = incidencias.map(i => i.id === inc.id
        ? { ...i, diagnostico: diag, estado: i.estado === "Abierta" ? "En diagnóstico" : i.estado } : i);
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

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${C.border}`,
    borderRadius: 6, fontSize: 13, color: C.textPri, outline: "none",
    background: C.white, fontFamily: "system-ui,sans-serif",
  };

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } textarea { resize: vertical; }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: C.navy, color: C.white, padding: "12px 20px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,48,135,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: C.bg, color: C.textPri,
        fontFamily: "system-ui,-apple-system,sans-serif" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ background: C.navy, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.critical}, #EF9A9A, ${C.critical})` }} />
          <div style={{ padding: "0 28px", display: "flex", alignItems: "center", height: 56, gap: 16 }}>
            <SvgLogo />
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>Dashboard Incidencias</div>
              <div style={{ color: C.blue, fontSize: 10, letterSpacing: "1px", marginTop: 1 }}>
                SONEPAR ESPAÑA · TÉCNICAS v3
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => setModo("lista")}
              style={{ padding: "6px 16px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer", letterSpacing: "0.8px",
                background: modo === "lista" ? C.blue : "rgba(255,255,255,0.1)", color: C.white }}>
              LISTADO
            </button>
            <button onClick={() => { setModo("nueva"); setSeleccionada(null); }}
              style={{ padding: "6px 16px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer", letterSpacing: "0.8px",
                background: modo === "nueva" ? C.blue : "rgba(255,255,255,0.1)", color: C.white }}>
              + NUEVA
            </button>
          </div>
        </div>

        {/* Alerta crítica */}
        {criticas.length > 0 && (
          <div style={{ background: C.criticalBg, borderBottom: `1px solid ${C.critical}30`,
            padding: "10px 28px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: C.critical, color: C.white, borderRadius: 4,
              padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>⚠ CRÍTICO</span>
            <span style={{ fontSize: 12, color: C.critical, fontWeight: 600 }}>
              {criticas.length} incidencia{criticas.length > 1 ? "s" : ""} crítica{criticas.length > 1 ? "s" : ""} sin atender +2h:
            </span>
            <span style={{ fontSize: 12, color: C.critical }}>
              {criticas.map(i => i.equipo.split("—")[0].trim()).join(" · ")}
            </span>
          </div>
        )}

        {/* ── KPI row ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1,
          background: C.border, borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: "CRÍTICAS ACTIVAS",  valor: kpis.criticas,  color: kpis.criticas > 0 ? C.critical : C.optimal },
            { label: "ABIERTAS",          valor: kpis.abiertas,  color: C.blueMid  },
            { label: "EN DIAGNÓSTICO",    valor: kpis.enDiag,    color: C.purple   },
            { label: "RESUELTAS",         valor: kpis.resueltas, color: C.optimal  },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{ background: C.white, padding: "16px 24px" }}>
              <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{valor}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: seleccionada && modo === "detalle" ? "1fr 400px" : "1fr",
          minHeight: "calc(100vh - 160px)" }}>

          {/* ── Panel izquierdo ──────────────────────────── */}
          <div style={{ padding: "24px 28px" }}>

            {/* NUEVA INCIDENCIA */}
            {modo === "nueva" && (
              <div style={{ maxWidth: 600 }}>
                <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "1px", marginBottom: 20 }}>
                  REGISTRAR NUEVA INCIDENCIA
                </div>
                {[
                  { label: "Equipo / Referencia", key: "equipo", placeholder: "Ej: Variador ATV320 — Línea 3" },
                  { label: "Operario que reporta", key: "operario", placeholder: "Nombre del operario" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>{label}</div>
                    <input value={form[key]} placeholder={placeholder} style={inputStyle}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Zona</div>
                    <select value={form.zona} style={inputStyle}
                      onChange={e => setForm(p => ({ ...p, zona: e.target.value }))}>
                      {ZONAS.map(z => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Severidad</div>
                    <select value={form.severidad} style={{ ...inputStyle, color: SEV_COLOR[form.severidad] }}
                      onChange={e => setForm(p => ({ ...p, severidad: e.target.value }))}>
                      {SEVERIDADES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Descripción del síntoma</div>
                  <textarea value={form.sintoma} rows={4} style={{ ...inputStyle }}
                    placeholder="Describe el síntoma con el máximo detalle: cuándo ocurre, con qué frecuencia, alarmas..."
                    onChange={e => setForm(p => ({ ...p, sintoma: e.target.value }))} />
                </div>
                <button onClick={crearIncidencia}
                  style={{ padding: "11px 28px", border: "none", borderRadius: 6,
                    background: C.navy, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Registrar incidencia ›
                </button>
              </div>
            )}

            {/* LISTA */}
            {(modo === "lista" || modo === "detalle") && (
              <>
                {/* Filtros */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginRight: 4 }}>ESTADO:</span>
                  {["Todas", ...ESTADOS].map(e => (
                    <button key={e} onClick={() => setFiltroEstado(e)}
                      style={{ padding: "5px 12px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                        border: `1px solid ${filtroEstado === e ? C.navy : C.border}`,
                        background: filtroEstado === e ? C.navy : C.white,
                        color: filtroEstado === e ? C.white : C.textSec, cursor: "pointer" }}>
                      {e}
                    </button>
                  ))}
                  <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginLeft: 8, marginRight: 4 }}>SEV:</span>
                  {["Todas", ...SEVERIDADES].map(s => (
                    <button key={s} onClick={() => setFiltroSev(s)}
                      style={{ padding: "5px 12px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${filtroSev === s ? (SEV_COLOR[s] || C.navy) : C.border}`,
                        background: filtroSev === s ? (SEV_COLOR[s] || C.navy) : C.white,
                        color: filtroSev === s ? C.white : C.textSec }}>
                      {s}
                    </button>
                  ))}
                </div>

                {/* Tabla */}
                <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`,
                  overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 140px 130px 80px 80px",
                    padding: "10px 16px", background: C.navy, fontSize: 10, letterSpacing: "1.5px",
                    color: "#8A9CC2" }}>
                    {["SEVERIDAD", "EQUIPO / SÍNTOMA", "ZONA", "ESTADO", "DIAG. IA", "TIEMPO"].map(h => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>
                  {filtradas.length === 0 && (
                    <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                      Sin incidencias con estos filtros
                    </div>
                  )}
                  {filtradas.map((inc, i) => (
                    <div key={inc.id} onClick={() => { setSeleccionada(inc); setModo("detalle"); }}
                      style={{ display: "grid", gridTemplateColumns: "110px 1fr 140px 130px 80px 80px",
                        padding: "13px 16px", borderTop: `1px solid ${C.border}`,
                        cursor: "pointer", alignItems: "center",
                        background: seleccionada?.id === inc.id ? C.blueBg : i % 2 === 0 ? C.white : C.bg,
                        borderLeft: `3px solid ${SEV_COLOR[inc.severidad]}`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.blueBg}
                      onMouseLeave={e => e.currentTarget.style.background = seleccionada?.id === inc.id ? C.blueBg : i % 2 === 0 ? C.white : C.bg}
                    >
                      <SevBadge sev={inc.severidad} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{inc.equipo}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>
                          {inc.sintoma.slice(0, 80)}{inc.sintoma.length > 80 ? "..." : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.textSec }}>{inc.zona.split("—")[0].trim()}</div>
                      <EstBadge est={inc.estado} />
                      <div>
                        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                          background: inc.diagnostico ? C.optimalBg : "#F0F1F5",
                          color: inc.diagnostico ? C.optimal : C.textMuted }}>
                          {inc.diagnostico ? "✓ IA" : "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{formatTiempo(inc.fechaCreacion)}</div>
                    </div>
                  ))}
                </div>

                {/* Stats resolución */}
                {Object.keys(statsResolucion).length >= 2 && (
                  <div style={{ marginTop: 20, background: C.white, borderRadius: 8,
                    border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                    <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1.5px", marginBottom: 12 }}>
                      TIEMPO MEDIO DE RESOLUCIÓN POR EQUIPO
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {Object.entries(statsResolucion).map(([eq, tiempos]) => {
                        const media = (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1);
                        return (
                          <div key={eq} style={{ background: C.bg, borderRadius: 7, padding: "10px 16px", minWidth: 130 }}>
                            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{eq}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{media}h</div>
                            <div style={{ fontSize: 9, color: C.textMuted }}>{tiempos.length} resolución{tiempos.length > 1 ? "es" : ""}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Panel detalle ─────────────────────────────── */}
          {seleccionada && modo === "detalle" && (
            <div style={{ background: C.white, borderLeft: `1px solid ${C.border}`,
              padding: 24, overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 4 }}>
                    INCIDENCIA #{seleccionada.id.toString().slice(-4)}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{seleccionada.equipo}</div>
                </div>
                <button onClick={() => { setSeleccionada(null); setModo("lista"); }}
                  style={{ background: "none", border: "none", fontSize: 18, color: C.textMuted, cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <SevBadge sev={seleccionada.severidad} />
                <EstBadge est={seleccionada.estado} />
              </div>

              {[
                ["Zona", seleccionada.zona],
                ["Operario", seleccionada.operario],
                ["Registrada", formatTiempo(seleccionada.fechaCreacion)],
                seleccionada.fechaResolucion ? ["Resuelta", formatTiempo(seleccionada.fechaResolucion)] : null,
              ].filter(Boolean).map(([label, valor]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", minWidth: 68, paddingTop: 2 }}>
                    {label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: C.textSec }}>{valor}</span>
                </div>
              ))}

              <div style={{ margin: "12px 0 16px", padding: 12, background: C.bg, borderRadius: 6,
                fontSize: 13, color: C.textPri, lineHeight: 1.6, borderLeft: `3px solid ${SEV_COLOR[seleccionada.severidad]}` }}>
                {seleccionada.sintoma}
              </div>

              {/* Cambiar estado */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 8 }}>CAMBIAR ESTADO</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ESTADOS.filter(e => e !== seleccionada.estado).map(e => (
                    <button key={e} onClick={() => cambiarEstado(seleccionada.id, e)}
                      style={{ padding: "5px 11px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                        border: `1px solid ${EST_COLOR[e]}30`, background: EST_BG[e],
                        color: EST_COLOR[e], cursor: "pointer" }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 8 }}>
                  OBSERVACIONES DE SEGUIMIENTO
                </div>
                <ObservacionesEditor initial={seleccionada.observaciones}
                  onSave={(texto) => guardarObservacion(seleccionada.id, texto)} />
              </div>

              {/* Diagnóstico IA */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: "1px" }}>
                    DIAGNÓSTICO IA
                  </span>
                </div>

                {!seleccionada.diagnostico && (
                  <button onClick={() => generarDiagnostico(seleccionada)} disabled={cargandoIA}
                    style={{ width: "100%", padding: 11, border: "none", borderRadius: 6,
                      background: cargandoIA ? C.border : C.navy, color: C.white,
                      fontSize: 12, fontWeight: 700, cursor: cargandoIA ? "default" : "pointer" }}>
                    {cargandoIA ? "Analizando incidencia..." : "Generar diagnóstico IA ›"}
                  </button>
                )}

                {seleccionada.diagnostico && (
                  <div>
                    {[
                      { titulo: "CAUSA PROBABLE", contenido: seleccionada.diagnostico.causa_probable, color: C.critical },
                      { titulo: "SOLUCIÓN",        contenido: seleccionada.diagnostico.solucion,       color: C.blueMid },
                    ].map(({ titulo, contenido, color }) => (
                      <div key={titulo} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: "1px", marginBottom: 5 }}>
                          {titulo}
                        </div>
                        <div style={{ fontSize: 12, color: C.textPri, lineHeight: 1.6,
                          padding: "10px 12px", background: C.bg, borderRadius: 6,
                          borderLeft: `3px solid ${color}` }}>
                          {contenido}
                        </div>
                      </div>
                    ))}
                    {[
                      { titulo: "PASOS DE VERIFICACIÓN", items: seleccionada.diagnostico.pasos_verificacion },
                      { titulo: "MEDIDAS PREVENTIVAS",   items: seleccionada.diagnostico.medidas_preventivas },
                    ].map(({ titulo, items }) => (
                      <div key={titulo} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 6 }}>{titulo}</div>
                        {items?.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                            <span style={{ background: C.navy, color: C.white, borderRadius: "50%",
                              width: 16, height: 16, display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    <button onClick={() => generarDiagnostico(seleccionada)} disabled={cargandoIA}
                      style={{ width: "100%", padding: "7px", border: `1px solid ${C.border}`,
                        borderRadius: 5, background: C.white, color: C.textSec, fontSize: 11, cursor: "pointer" }}>
                      {cargandoIA ? "Analizando..." : "Regenerar diagnóstico"}
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
