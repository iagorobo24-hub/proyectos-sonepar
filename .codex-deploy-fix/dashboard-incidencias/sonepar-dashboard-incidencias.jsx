import { useState } from "react";

const EQUIPOS = ["Variador", "PLC", "Contactor", "Robot AutoStore", "Cinta transportadora", "Sensor", "HMI", "Cuadro eléctrico", "Otro"];
const SEVERIDADES = [
  { id: "critica", label: "CRÍTICA", color: "#e53935", bg: "#fff5f5" },
  { id: "alta", label: "ALTA", color: "#f57c00", bg: "#fff8f0" },
  { id: "media", label: "MEDIA", color: "#f9a825", bg: "#fffdf0" },
  { id: "baja", label: "BAJA", color: "#388e3c", bg: "#f5fff5" },
];
const ESTADOS = ["Abierta", "En diagnóstico", "Resuelta", "Escalada"];

const INCIDENCIAS_DEMO = [
  { id: "INC-001", equipo: "Variador", zona: "A-12", sintoma: "El variador ATV320 no arranca. Muestra error OLF en pantalla al intentar dar marcha.", severidad: "critica", estado: "En diagnóstico", fecha: "07/03/2026 09:14", operario: "M. López", diagnosticoIA: null },
  { id: "INC-002", equipo: "Contactor", zona: "C-08", sintoma: "Contactor LC1D25 hace ruido mecánico excesivo al conmutar. Posible bobina dañada.", severidad: "alta", estado: "Abierta", fecha: "07/03/2026 10:30", operario: "R. Fernández", diagnosticoIA: null },
  { id: "INC-003", equipo: "Sensor", zona: "B-04", sintoma: "Sensor de presencia no detecta paquetes pequeños. Falla intermitente.", severidad: "media", estado: "Resuelta", fecha: "06/03/2026 15:22", operario: "A. Martínez", diagnosticoIA: "Ajuste de sensibilidad y limpieza de lente. Causa: acumulación de polvo en zona B-04. Solución: incrementar ciclo de limpieza preventiva a semanal." },
  { id: "INC-004", equipo: "PLC", zona: "D-01", sintoma: "PLC Modicon M241 pierde comunicación Ethernet de forma aleatoria cada 2-3 horas.", severidad: "alta", estado: "Escalada", fecha: "06/03/2026 11:05", operario: "M. López", diagnosticoIA: null },
];

export default function DashboardIncidencias() {
  const [incidencias, setIncidencias] = useState(INCIDENCIAS_DEMO);
  const [vista, setVista] = useState("lista"); // lista | nueva | detalle
  const [seleccionada, setSeleccionada] = useState(null);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroSev, setFiltroSev] = useState("Todas");

  // Form nueva incidencia
  const [form, setForm] = useState({ equipo: "", zona: "", sintoma: "", severidad: "media", operario: "" });
  const [guardando, setGuardando] = useState(false);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const crearIncidencia = () => {
    if (!form.equipo || !form.zona || !form.sintoma || !form.operario) return;
    setGuardando(true);
    setTimeout(() => {
      const nueva = {
        id: `INC-00${incidencias.length + 1}`,
        ...form,
        estado: "Abierta",
        fecha: new Date().toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        diagnosticoIA: null,
      };
      setIncidencias(p => [nueva, ...p]);
      setForm({ equipo: "", zona: "", sintoma: "", severidad: "media", operario: "" });
      setGuardando(false);
      setVista("lista");
    }, 600);
  };

  const diagnosticarIA = async (inc) => {
    setDiagnosticando(true);
    try {
      const prompt = `Eres un técnico experto en automatización industrial y distribución eléctrica (entorno tipo Sonepar/almacén logístico). 
      
Analiza esta incidencia y proporciona un diagnóstico técnico profesional en español:

Equipo: ${inc.equipo}
Zona: ${inc.zona}
Síntoma reportado: ${inc.sintoma}
Severidad: ${inc.severidad}

Responde con este formato exacto (sin markdown, texto plano):
CAUSA PROBABLE: [una causa técnica concreta y probable]
PASOS DE VERIFICACIÓN: [3-4 pasos concretos para verificar/diagnosticar]
SOLUCIÓN RECOMENDADA: [acción correctiva específica]
PREVENCIÓN: [acción preventiva para evitar recurrencia]
TIEMPO ESTIMADO: [tiempo estimado de resolución]`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const texto = data.content?.map(i => i.text || "").join("") || "";
      setIncidencias(p => p.map(i => i.id === inc.id ? { ...i, diagnosticoIA: texto, estado: "En diagnóstico" } : i));
      setSeleccionada(p => ({ ...p, diagnosticoIA: texto, estado: "En diagnóstico" }));
    } catch (e) {
      console.error(e);
    }
    setDiagnosticando(false);
  };

  const cambiarEstado = (inc, nuevoEstado) => {
    setIncidencias(p => p.map(i => i.id === inc.id ? { ...i, estado: nuevoEstado } : i));
    setSeleccionada(p => ({ ...p, estado: nuevoEstado }));
  };

  const getSev = (id) => SEVERIDADES.find(s => s.id === id) || SEVERIDADES[2];

  const incFiltradas = incidencias.filter(i => {
    const okEstado = filtroEstado === "Todas" || i.estado === filtroEstado;
    const okSev = filtroSev === "Todas" || i.severidad === filtroSev;
    return okEstado && okSev;
  });

  const stats = {
    criticas: incidencias.filter(i => i.severidad === "critica" && i.estado !== "Resuelta").length,
    abiertas: incidencias.filter(i => i.estado === "Abierta").length,
    enDiag: incidencias.filter(i => i.estado === "En diagnóstico").length,
    resueltas: incidencias.filter(i => i.estado === "Resuelta").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Trebuchet MS', sans-serif", color: "#1a1a2e" }}>

      {/* Header */}
      <div style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: "3px solid #e53935" }}>
        <div style={{ background: "#e53935", padding: "16px 20px", display: "flex", alignItems: "center", marginRight: "20px" }}>
          <span style={{ fontWeight: "900", fontSize: "13px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "#fff", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "3px" }}>INCIDENCIAS TÉCNICAS</span>
          <span style={{ color: "#555", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>MANTENIMIENTO · IA DIAGNÓSTICO</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {["lista", "nueva"].map(v => (
            <button key={v} onClick={() => setVista(v)} style={{
              background: vista === v ? "#e53935" : "transparent",
              color: vista === v ? "#fff" : "#888",
              border: "1px solid " + (vista === v ? "#e53935" : "#333"),
              padding: "8px 16px",
              fontFamily: "'Courier New', monospace",
              fontSize: "10px",
              letterSpacing: "2px",
              cursor: "pointer",
            }}>
              {v === "lista" ? "▤ DASHBOARD" : "+ NUEVA"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "#ddd", borderBottom: "1px solid #ddd" }}>
        {[
          { label: "CRÍTICAS ACTIVAS", val: stats.criticas, color: "#e53935", bg: "#fff5f5" },
          { label: "ABIERTAS", val: stats.abiertas, color: "#f57c00", bg: "#fff8f0" },
          { label: "EN DIAGNÓSTICO", val: stats.enDiag, color: "#1565c0", bg: "#f0f4ff" },
          { label: "RESUELTAS HOY", val: stats.resueltas, color: "#2e7d32", bg: "#f5fff5" },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, padding: "20px 28px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{label}</div>
            <div style={{ fontSize: "36px", fontWeight: "900", color, lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>

        {/* VISTA LISTA */}
        {vista === "lista" && (
          <div>
            {/* Filtros */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>FILTRAR:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {["Todas", ...ESTADOS].map(e => (
                  <button key={e} onClick={() => setFiltroEstado(e)} style={{
                    padding: "5px 12px", fontSize: "10px", letterSpacing: "1px",
                    fontFamily: "'Courier New', monospace",
                    background: filtroEstado === e ? "#1a1a2e" : "#fff",
                    color: filtroEstado === e ? "#fff" : "#888",
                    border: "1px solid " + (filtroEstado === e ? "#1a1a2e" : "#ddd"),
                    cursor: "pointer",
                  }}>{e.toUpperCase()}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px", marginLeft: "16px" }}>
                {["Todas", ...SEVERIDADES.map(s => s.id)].map(s => (
                  <button key={s} onClick={() => setFiltroSev(s)} style={{
                    padding: "5px 12px", fontSize: "10px", letterSpacing: "1px",
                    fontFamily: "'Courier New', monospace",
                    background: filtroSev === s ? (SEVERIDADES.find(x => x.id === s)?.color || "#1a1a2e") : "#fff",
                    color: filtroSev === s ? "#fff" : "#888",
                    border: "1px solid " + (filtroSev === s ? (SEVERIDADES.find(x => x.id === s)?.color || "#1a1a2e") : "#ddd"),
                    cursor: "pointer",
                  }}>{s.toUpperCase()}</button>
                ))}
              </div>
            </div>

            {/* Tabla */}
            <div style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "90px 120px 80px 1fr 110px 120px 80px",
                padding: "10px 20px", background: "#f8f9fa", borderBottom: "2px solid #eee",
                fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace",
              }}>
                {["ID", "EQUIPO", "ZONA", "SÍNTOMA", "SEVERIDAD", "ESTADO", "ACCIÓN"].map(h => <div key={h}>{h}</div>)}
              </div>

              {incFiltradas.map((inc, i) => {
                const sev = getSev(inc.severidad);
                return (
                  <div key={inc.id} style={{
                    display: "grid", gridTemplateColumns: "90px 120px 80px 1fr 110px 120px 80px",
                    padding: "14px 20px",
                    borderBottom: "1px solid #f0f0f0",
                    alignItems: "center",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                    borderLeft: `4px solid ${sev.color}`,
                  }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#1a1a2e", fontWeight: "700" }}>{inc.id}</div>
                    <div style={{ fontSize: "12px", color: "#444" }}>{inc.equipo}</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#888" }}>{inc.zona}</div>
                    <div style={{ fontSize: "12px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "12px" }}>{inc.sintoma}</div>
                    <div>
                      <span style={{
                        background: sev.bg, color: sev.color, padding: "3px 8px",
                        fontSize: "9px", letterSpacing: "1px", fontFamily: "'Courier New', monospace", fontWeight: "700",
                        border: `1px solid ${sev.color}`,
                      }}>{sev.label}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", fontFamily: "'Courier New', monospace" }}>{inc.estado}</div>
                    <div>
                      <button onClick={() => { setSeleccionada(inc); setVista("detalle"); }} style={{
                        background: "#1a1a2e", color: "#fff", border: "none",
                        padding: "5px 10px", fontSize: "10px", cursor: "pointer",
                        fontFamily: "'Courier New', monospace", letterSpacing: "1px",
                      }}>VER ›</button>
                    </div>
                  </div>
                );
              })}

              {incFiltradas.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "12px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>
                  SIN INCIDENCIAS CON ESTOS FILTROS
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA NUEVA */}
        {vista === "nueva" && (
          <div style={{ maxWidth: "640px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "24px" }}>
              REGISTRAR NUEVA INCIDENCIA
            </div>

            <div style={{ background: "#fff", padding: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "20px" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { label: "OPERARIO", key: "operario", ph: "Nombre del operario" },
                  { label: "ZONA", key: "zona", ph: "Ej: A-12, B-04..." },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label}</div>
                    <input value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={ph}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", fontSize: "13px", outline: "none", fontFamily: "'Trebuchet MS', sans-serif", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>TIPO DE EQUIPO</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {EQUIPOS.map(e => (
                    <button key={e} onClick={() => setF("equipo", e)} style={{
                      padding: "6px 14px", fontSize: "11px",
                      background: form.equipo === e ? "#1a1a2e" : "#fff",
                      color: form.equipo === e ? "#fff" : "#888",
                      border: "1px solid " + (form.equipo === e ? "#1a1a2e" : "#ddd"),
                      cursor: "pointer",
                    }}>{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>SEVERIDAD</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {SEVERIDADES.map(s => (
                    <button key={s.id} onClick={() => setF("severidad", s.id)} style={{
                      padding: "6px 16px", fontSize: "10px", letterSpacing: "1px",
                      fontFamily: "'Courier New', monospace", fontWeight: "700",
                      background: form.severidad === s.id ? s.color : "#fff",
                      color: form.severidad === s.id ? "#fff" : s.color,
                      border: `1px solid ${s.color}`,
                      cursor: "pointer",
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>DESCRIPCIÓN DEL SÍNTOMA</div>
                <textarea value={form.sintoma} onChange={e => setF("sintoma", e.target.value)}
                  placeholder="Describe el síntoma con el mayor detalle posible: qué ocurre, cuándo ocurre, qué muestra la pantalla..."
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", fontSize: "13px", outline: "none", fontFamily: "'Trebuchet MS', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <button onClick={crearIncidencia} disabled={guardando || !form.equipo || !form.sintoma || !form.operario || !form.zona}
                style={{
                  background: guardando || !form.equipo || !form.sintoma || !form.operario || !form.zona ? "#ccc" : "#e53935",
                  color: "#fff", border: "none", padding: "14px", fontSize: "11px",
                  letterSpacing: "3px", fontFamily: "'Courier New', monospace", cursor: "pointer", fontWeight: "700",
                }}>
                {guardando ? "GUARDANDO..." : "REGISTRAR INCIDENCIA ›"}
              </button>
            </div>
          </div>
        )}

        {/* VISTA DETALLE */}
        {vista === "detalle" && seleccionada && (
          <div style={{ maxWidth: "800px" }}>
            <button onClick={() => setVista("lista")} style={{
              background: "transparent", border: "none", color: "#888", cursor: "pointer",
              fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "2px", marginBottom: "16px", padding: "0",
            }}>‹ VOLVER AL DASHBOARD</button>

            <div style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderTop: `4px solid ${getSev(seleccionada.severidad).color}` }}>
              <div style={{ padding: "24px 28px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#aaa", marginBottom: "6px", letterSpacing: "2px" }}>
                      {seleccionada.fecha} · {seleccionada.operario}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e" }}>{seleccionada.id}</div>
                    <div style={{ fontSize: "14px", color: "#888", marginTop: "4px" }}>{seleccionada.equipo} · Zona {seleccionada.zona}</div>
                  </div>
                  <span style={{
                    background: getSev(seleccionada.severidad).bg, color: getSev(seleccionada.severidad).color,
                    padding: "6px 14px", fontSize: "11px", letterSpacing: "2px",
                    fontFamily: "'Courier New', monospace", fontWeight: "700",
                    border: `1px solid ${getSev(seleccionada.severidad).color}`,
                  }}>{getSev(seleccionada.severidad).label}</span>
                </div>
                <div style={{ marginTop: "16px", padding: "16px", background: "#f8f9fa", borderLeft: "3px solid #ddd", fontSize: "14px", color: "#444", lineHeight: "1.6" }}>
                  {seleccionada.sintoma}
                </div>
              </div>

              {/* Cambio de estado */}
              <div style={{ padding: "16px 28px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>ESTADO:</span>
                {ESTADOS.map(e => (
                  <button key={e} onClick={() => cambiarEstado(seleccionada, e)} style={{
                    padding: "5px 12px", fontSize: "10px", letterSpacing: "1px",
                    fontFamily: "'Courier New', monospace",
                    background: seleccionada.estado === e ? "#1a1a2e" : "#fff",
                    color: seleccionada.estado === e ? "#fff" : "#888",
                    border: "1px solid " + (seleccionada.estado === e ? "#1a1a2e" : "#ddd"),
                    cursor: "pointer",
                  }}>{e.toUpperCase()}</button>
                ))}
              </div>

              {/* Diagnóstico IA */}
              <div style={{ padding: "24px 28px" }}>
                {!seleccionada.diagnosticoIA ? (
                  <div style={{ textAlign: "center", padding: "32px" }}>
                    <div style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Courier New', monospace", letterSpacing: "2px", marginBottom: "20px" }}>
                      SIN DIAGNÓSTICO IA TODAVÍA
                    </div>
                    <button onClick={() => diagnosticarIA(seleccionada)} disabled={diagnosticando}
                      style={{
                        background: diagnosticando ? "#ccc" : "#1a1a2e", color: "#fff",
                        border: "none", padding: "14px 32px", fontSize: "11px",
                        letterSpacing: "3px", fontFamily: "'Courier New', monospace",
                        cursor: diagnosticando ? "not-allowed" : "pointer", fontWeight: "700",
                      }}>
                      {diagnosticando ? "ANALIZANDO CON IA..." : "◈ DIAGNOSTICAR CON IA"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#1565c0", fontFamily: "'Courier New', monospace", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>◈</span> DIAGNÓSTICO IA
                    </div>
                    <div style={{ background: "#f0f4ff", border: "1px solid #c5d5f0", padding: "20px 24px", lineHeight: "1.8", fontSize: "13px", color: "#333", whiteSpace: "pre-wrap" }}>
                      {seleccionada.diagnosticoIA}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
