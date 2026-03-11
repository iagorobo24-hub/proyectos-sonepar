import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ── Paleta de marca Sonepar ──────────────────────────────────────────────────
const C = {
  azulOscuro:  "#003087",
  azulMedio:   "#1A4A8A",
  azulClaro:   "#4A90D9",
  azulSuave:   "#EBF1FA",
  blanco:      "#FFFFFF",
  fondo:       "#F5F6F8",
  texto:       "#1A1A2E",
  textoSec:    "#4A5568",
  textoTer:    "#8A94A6",
  borde:       "#D1D9E6",
  verde:       "#1B6B3A",
  verdeSuave:  "#EDF7F2",
  amarillo:    "#C07010",
  amarilloS:   "#FFF8EE",
  rojo:        "#C62828",
  rojoSuave:   "#FDECEA",
};

const LogoSonepar = ({ size = 28, color = "#003087" }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 120 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="19" rx="14" ry="7.5" stroke={C.azulClaro} strokeWidth="2.2" fill="none" transform="rotate(-20 16 19)" />
    <ellipse cx="16" cy="19" rx="14" ry="7.5" stroke={color} strokeWidth="2.2" fill="none" transform="rotate(20 16 19)" />
    <text x="34" y="25" fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="700" fontSize="17" fill={color} letterSpacing="0.5">sonepar</text>
  </svg>
);

const BENCHMARKS = {
  pedidos_hora:   { bueno: 18, malo: 12, label: "Pedidos/hora",  unidad: "ped/h", desc: "Pedidos completados por hora de turno",                         icono: "📦" },
  error_picking:  { bueno: 1,  malo: 3,  label: "Error picking", unidad: "%",     desc: "Porcentaje de líneas con error sobre total procesadas",         icono: "⚠",  invertido: true },
  tiempo_ciclo:   { bueno: 5,  malo: 10, label: "Tiempo ciclo",  unidad: "min",   desc: "Tiempo medio desde entrada de pedido hasta expedición",         icono: "⏱",  invertido: true },
  ocupacion:      { bueno: 85, malo: 95, label: "Ocupación",     unidad: "%",     desc: "Porcentaje de ubicaciones ocupadas sobre el total disponible",  icono: "🏭" },
  devolucion:     { bueno: 2,  malo: 5,  label: "Devoluciones",  unidad: "%",     desc: "Porcentaje de líneas devueltas sobre total expedido",           icono: "↩",  invertido: true },
  productividad:  { bueno: 90, malo: 70, label: "Productividad", unidad: "%",     desc: "Rendimiento del equipo respecto a capacidad teórica del turno", icono: "👥" },
};

const EJEMPLO = {
  delegacion: "Sonepar A Coruña", turno: "Mañana",
  pedidos: 145, horas: 8, errores: 3, tiempo_ciclo: 4.2,
  ubicaciones_ocupadas: 8750, ubicaciones_total: 12000,
  devoluciones: 7, lineas_expedidas: 420, operarios: 6,
};

export default function KPILogistico() {
  const [datos, setDatos]           = useState({ delegacion: "", turno: "Mañana", pedidos: "", horas: "", errores: "", tiempo_ciclo: "", ubicaciones_ocupadas: "", ubicaciones_total: "", devoluciones: "", lineas_expedidas: "", operarios: "" });
  const [kpis, setKpis]             = useState(null);
  const [informe, setInforme]       = useState("");
  const [historial, setHistorial]   = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [tab, setTab]               = useState("calculo");
  const [comparativa, setComparativa] = useState({ a: null, b: null });
  const [tooltip, setTooltip]       = useState("");

  useEffect(() => {
    try { const h = localStorage.getItem("sonepar_kpi_historial"); if (h) setHistorial(JSON.parse(h)); } catch {}
  }, []);

  const guardarHistorial = (entrada) => {
    const nuevo = [entrada, ...historial].slice(0, 30);
    setHistorial(nuevo);
    try { localStorage.setItem("sonepar_kpi_historial", JSON.stringify(nuevo)); } catch {}
  };

  const calcularKPIs = () => {
    const d = datos;
    if (!d.pedidos || !d.horas || !d.lineas_expedidas) return null;
    return {
      pedidos_hora:  parseFloat(d.pedidos) / parseFloat(d.horas),
      error_picking: (parseFloat(d.errores) / parseFloat(d.lineas_expedidas)) * 100,
      tiempo_ciclo:  parseFloat(d.tiempo_ciclo),
      ocupacion:     (parseFloat(d.ubicaciones_ocupadas) / parseFloat(d.ubicaciones_total)) * 100,
      devolucion:    (parseFloat(d.devoluciones) / parseFloat(d.lineas_expedidas)) * 100,
      productividad: Math.min(100, (parseFloat(d.pedidos) / (parseFloat(d.operarios) * parseFloat(d.horas) * 2.5)) * 100),
    };
  };

  const semaforo = (kpi, valor) => {
    const b = BENCHMARKS[kpi];
    if (b.invertido) { if (valor <= b.bueno) return "verde"; if (valor >= b.malo) return "rojo"; return "amarillo"; }
    if (valor >= b.bueno) return "verde"; if (valor <= b.malo) return "rojo"; return "amarillo";
  };

  const colorSem = { verde: C.verde, amarillo: C.amarillo, rojo: C.rojo };
  const bgSem    = { verde: C.verdeSuave, amarillo: C.amarilloS, rojo: C.rojoSuave };
  const bordeSem = { verde: "#B7DFC9", amarillo: "#F5D58B", rojo: "#F5BFBC" };

  const calcular = async () => {
    const k = calcularKPIs();
    if (!k) return alert("Completa al menos: pedidos, horas y líneas expedidas");
    setKpis(k);
    setCargando(true);
    setInforme("");
    try {
      const prompt = `Eres el responsable de logística de Sonepar España. Analiza estos KPIs y genera un informe ejecutivo breve.\n\nDelegación: ${datos.delegacion || "Delegación"} | Turno: ${datos.turno}\n\nKPIs:\n- Pedidos/hora: ${k.pedidos_hora.toFixed(1)} (benchmark: >18)\n- Error picking: ${k.error_picking.toFixed(2)}% (benchmark: <1%)\n- Tiempo ciclo: ${k.tiempo_ciclo.toFixed(1)} min (benchmark: <5 min)\n- Ocupación: ${k.ocupacion.toFixed(1)}% (benchmark: 75-85%)\n- Devoluciones: ${k.devolucion.toFixed(2)}% (benchmark: <2%)\n- Productividad: ${k.productividad.toFixed(1)}% (benchmark: >90%)\n\nDatos: ${datos.pedidos} pedidos, ${datos.horas}h, ${datos.operarios} operarios, ${datos.errores} errores.\n\n3 párrafos cortos: (1) resumen del turno, (2) puntos críticos, (3) acción para el próximo turno. Tono directo.`;
      const res  = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      const txt  = data.content?.map(b => b.text || "").join("") || "";
      setInforme(txt);
      guardarHistorial({ delegacion: datos.delegacion || "Delegación", turno: datos.turno, fecha: new Date().toISOString(), kpis: k, informe: txt });
    } catch { setInforme("Error al conectar con la IA."); }
    setCargando(false);
  };

  const datosGrafico = historial.slice(0, 7).reverse().map((h, i) => ({
    name: `T${i + 1}`, pedidos_hora: parseFloat(h.kpis.pedidos_hora.toFixed(1)), error_picking: parseFloat(h.kpis.error_picking.toFixed(2)),
  }));

  const CAMPOS = [
    { key: "pedidos",              label: "PEDIDOS COMPLETADOS",       placeholder: "145",   desc: "Total de pedidos completados durante el turno" },
    { key: "horas",                label: "HORAS DE TURNO",            placeholder: "8",     desc: "Duración real del turno en horas" },
    { key: "operarios",            label: "OPERARIOS EN TURNO",        placeholder: "6",     desc: "Número de operarios activos durante el turno" },
    { key: "lineas_expedidas",     label: "LÍNEAS EXPEDIDAS",          placeholder: "420",   desc: "Total de líneas de pedido procesadas" },
    { key: "errores",              label: "ERRORES DE PICKING",        placeholder: "3",     desc: "Líneas con error detectado en verificación" },
    { key: "tiempo_ciclo",         label: "TIEMPO CICLO MEDIO (min)",  placeholder: "4.2",   desc: "Minutos desde entrada de pedido hasta expedición" },
    { key: "ubicaciones_ocupadas", label: "UBICACIONES OCUPADAS",      placeholder: "8750",  desc: "Número de ubicaciones físicas ocupadas" },
    { key: "ubicaciones_total",    label: "UBICACIONES TOTALES",       placeholder: "12000", desc: "Capacidad total de ubicaciones del almacén" },
    { key: "devoluciones",         label: "DEVOLUCIONES",              placeholder: "7",     desc: "Líneas devueltas o rechazadas por el cliente" },
  ];

  const btnP = (dis = false) => ({
    padding: "10px 18px", fontSize: "13px", fontWeight: "600",
    fontFamily: "system-ui, Segoe UI, sans-serif",
    background: dis ? C.textoTer : C.azulOscuro, color: C.blanco,
    border: "none", borderRadius: "6px", cursor: dis ? "default" : "pointer",
  });
  const btnS = { padding: "8px 14px", fontSize: "12px", fontWeight: "500", fontFamily: "system-ui, Segoe UI, sans-serif", background: C.blanco, color: C.azulOscuro, border: `1.5px solid ${C.azulOscuro}`, borderRadius: "6px", cursor: "pointer" };
  const inp  = { width: "100%", padding: "9px 12px", fontSize: "13px", fontFamily: "system-ui, Segoe UI, sans-serif", color: C.texto, border: `1.5px solid ${C.borde}`, borderRadius: "6px", background: C.blanco, outline: "none" };
  const lbl  = { fontSize: "10px", fontWeight: "600", letterSpacing: "0.8px", color: C.textoTer, fontFamily: "system-ui, Segoe UI, sans-serif", marginBottom: "5px", display: "block" };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @media print { .no-print { display: none !important; } body { background: white; } .print-area { padding: 20px; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.fondo, fontFamily: "system-ui, Segoe UI, sans-serif", color: C.texto }}>

        {/* Header */}
        <div className="no-print" style={{ background: C.azulOscuro, padding: "0 28px", display: "flex", alignItems: "center", gap: "20px", height: "56px" }}>
          <LogoSonepar size={24} color={C.blanco} />
          <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.2)" }} />
          <span style={{ color: C.blanco, fontSize: "13px", fontWeight: "500" }}>KPI Logístico</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>v3.0</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: "4px" }}>
            {[["calculo","Cálculo"],["historial","Historial"],["comparativa","Comparativa"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setTab(id)} style={{ padding: "6px 16px", fontSize: "12px", fontWeight: tab === id ? "600" : "400", background: tab === id ? "rgba(255,255,255,0.15)" : "transparent", color: tab === id ? C.blanco : "rgba(255,255,255,0.6)", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "system-ui, Segoe UI, sans-serif" }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${C.azulOscuro}, ${C.azulClaro})` }} />

        {/* TAB CÁLCULO */}
        {tab === "calculo" && (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", minHeight: "calc(100vh - 59px)" }}>

            {/* Sidebar formulario */}
            <div className="no-print" style={{ background: C.blanco, borderRight: `1px solid ${C.borde}`, padding: "24px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px", color: C.textoTer }}>DATOS DEL TURNO</span>
                <button onClick={() => setDatos({ ...EJEMPLO, turno: "Mañana" })} style={btnS}>Cargar ejemplo</button>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={lbl}>DELEGACIÓN</label>
                <input value={datos.delegacion} onChange={e => setDatos(p => ({ ...p, delegacion: e.target.value }))} placeholder="Ej: Sonepar A Coruña" style={inp} />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={lbl}>TURNO</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["Mañana", "Tarde", "Noche"].map(t => (
                    <button key={t} onClick={() => setDatos(p => ({ ...p, turno: t }))} style={{ flex: 1, padding: "8px", fontSize: "12px", fontWeight: "500", fontFamily: "system-ui, Segoe UI, sans-serif", cursor: "pointer", borderRadius: "6px", background: datos.turno === t ? C.azulOscuro : C.fondo, color: datos.turno === t ? C.blanco : C.textoSec, border: `1.5px solid ${datos.turno === t ? C.azulOscuro : C.borde}` }}>{t}</button>
                  ))}
                </div>
              </div>

              {CAMPOS.map(({ key, label, placeholder, desc }) => (
                <div key={key} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ ...lbl, marginBottom: "4px" }}>{label}</label>
                    <span onMouseEnter={() => setTooltip(key)} onMouseLeave={() => setTooltip("")} style={{ fontSize: "13px", color: C.azulClaro, cursor: "help" }}>ⓘ</span>
                  </div>
                  {tooltip === key && (
                    <div style={{ fontSize: "11px", color: C.textoSec, background: C.azulSuave, border: `1px solid ${C.borde}`, borderRadius: "4px", padding: "6px 10px", marginBottom: "4px", lineHeight: "1.4" }}>{desc}</div>
                  )}
                  <input value={datos[key]} onChange={e => setDatos(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} type="number" style={inp} />
                </div>
              ))}

              <button onClick={calcular} disabled={cargando} style={{ ...btnP(cargando), width: "100%", padding: "12px", marginTop: "10px", fontSize: "13px" }}>
                {cargando ? "Calculando…" : "Calcular KPIs + Informe IA →"}
              </button>
            </div>

            {/* Panel resultados */}
            <div className="print-area" style={{ padding: "28px 36px", overflowY: "auto" }}>
              {!kpis && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "14px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.azulSuave, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📊</div>
                  <div style={{ fontSize: "14px", color: C.textoTer }}>Introduce los datos del turno y pulsa calcular</div>
                </div>
              )}

              {kpis && (
                <div className="fade-in">
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "11px", color: C.textoTer, fontWeight: "500", marginBottom: "4px" }}>{datos.delegacion || "DELEGACIÓN"} · Turno {datos.turno}</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: C.texto }}>Informe de KPIs</div>
                    <div style={{ fontSize: "12px", color: C.textoTer, marginTop: "2px" }}>{new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>

                  {/* Grid KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                    {Object.entries(kpis).map(([key, valor]) => {
                      const b = BENCHMARKS[key]; const sem = semaforo(key, valor);
                      return (
                        <div key={key} style={{ background: bgSem[sem], border: `1.5px solid ${bordeSem[sem]}`, borderRadius: "10px", padding: "16px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.5px", color: C.textoSec }}>{b.label.toUpperCase()}</span>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: colorSem[sem], display: "block", marginTop: "2px" }} />
                          </div>
                          <div style={{ fontSize: "30px", fontWeight: "700", color: colorSem[sem], lineHeight: 1 }}>
                            {valor.toFixed(key === "error_picking" || key === "devolucion" ? 2 : 1)}
                            <span style={{ fontSize: "13px", color: C.textoTer, marginLeft: "4px", fontWeight: "400" }}>{b.unidad}</span>
                          </div>
                          <div style={{ fontSize: "10px", color: C.textoTer, marginTop: "6px" }}>Ref: {b.invertido ? `<${b.bueno}` : `>${b.bueno}`} {b.unidad}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gráficos */}
                  {datosGrafico.length >= 2 && (
                    <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                      {[
                        { titulo: "Pedidos/hora — últimos turnos",    dataKey: "pedidos_hora",  color: C.azulClaro, ref: 18, tipo: "bar"  },
                        { titulo: "Error picking % — últimos turnos", dataKey: "error_picking", color: C.rojo,      ref: 1,  tipo: "line" },
                      ].map(({ titulo, dataKey, color, ref, tipo }) => (
                        <div key={dataKey} style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "16px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", color: C.textoSec, marginBottom: "14px" }}>{titulo}</div>
                          <ResponsiveContainer width="100%" height={120}>
                            {tipo === "bar" ? (
                              <BarChart data={datosGrafico}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.textoTer }} />
                                <YAxis tick={{ fontSize: 10, fill: C.textoTer }} />
                                <Tooltip formatter={v => [v, "ped/h"]} />
                                <ReferenceLine y={ref} stroke={C.verde} strokeDasharray="4 4" />
                                <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
                              </BarChart>
                            ) : (
                              <LineChart data={datosGrafico}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.textoTer }} />
                                <YAxis tick={{ fontSize: 10, fill: C.textoTer }} />
                                <Tooltip formatter={v => [v + "%", "error"]} />
                                <ReferenceLine y={ref} stroke={C.verde} strokeDasharray="4 4" />
                                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      ))}
                    </div>
                  )}
                  {datosGrafico.length < 2 && (
                    <div className="no-print" style={{ background: C.azulSuave, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "18px", marginBottom: "24px", textAlign: "center" }}>
                      <span style={{ fontSize: "12px", color: C.textoTer }}>Calcula 2 o más turnos para ver la evolución en gráficos</span>
                    </div>
                  )}

                  {/* Informe IA */}
                  {informe && (
                    <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "22px", marginBottom: "18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.azulClaro }} />
                        <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px", color: C.textoSec }}>INFORME EJECUTIVO IA</span>
                      </div>
                      <div style={{ fontSize: "13px", color: C.texto, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{informe}</div>
                    </div>
                  )}

                  <div className="no-print">
                    <button onClick={() => window.print()} style={btnP()}>Exportar PDF →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB HISTORIAL */}
        {tab === "historial" && (
          <div style={{ padding: "28px 36px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>Historial de turnos</span>
              <span style={{ fontSize: "12px", color: C.textoTer }}>{historial.length} / 30 registros</span>
            </div>
            {historial.length === 0 && (
              <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: C.textoTer }}>Aún no hay turnos calculados</div>
              </div>
            )}
            <div style={{ display: "grid", gap: "10px" }}>
              {historial.map((h, i) => (
                <div key={i} style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "16px 22px", display: "grid", gridTemplateColumns: "180px 1fr auto", alignItems: "center", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{h.delegacion}</div>
                    <div style={{ fontSize: "11px", color: C.textoTer, marginTop: "2px" }}>{new Date(h.fecha).toLocaleDateString("es-ES")} · {h.turno}</div>
                  </div>
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {Object.entries(h.kpis).map(([key, valor]) => {
                      const b = BENCHMARKS[key]; const sem = semaforo(key, valor);
                      return (
                        <div key={key} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "9px", fontWeight: "600", color: C.textoTer, letterSpacing: "0.5px" }}>{b.label.toUpperCase()}</div>
                          <div style={{ fontSize: "15px", fontWeight: "700", color: colorSem[sem] }}>{valor.toFixed(1)}<span style={{ fontSize: "9px", color: C.textoTer }}>{b.unidad}</span></div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => { setComparativa(p => p.a ? { ...p, b: h } : { ...p, a: h }); setTab("comparativa"); }} style={btnS}>+ Comparar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB COMPARATIVA */}
        {tab === "comparativa" && (
          <div style={{ padding: "28px 36px" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>Comparativa de turnos</div>
            {(!comparativa.a || !comparativa.b) && (
              <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "36px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: C.textoTer }}>
                  {!comparativa.a ? "Ve al historial y pulsa + Comparar en dos turnos" : "Selecciona un segundo turno desde el historial"}
                </div>
                {comparativa.a && <div style={{ marginTop: "12px", fontSize: "13px" }}>Turno A: <strong>{comparativa.a.delegacion} · {comparativa.a.turno}</strong></div>}
              </div>
            )}
            {comparativa.a && comparativa.b && (
              <>
                <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 80px", background: C.azulOscuro, padding: "12px 22px", gap: "12px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>KPI</div>
                    {[comparativa.a, comparativa.b].map((c, i) => (
                      <div key={i} style={{ fontSize: "12px", fontWeight: "600", color: i === 0 ? "#6BB5FF" : "#FFB74D" }}>
                        {i === 0 ? "A" : "B"} · {c.delegacion} · {c.turno}
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "400" }}>{new Date(c.fecha).toLocaleDateString("es-ES")}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>MEJOR</div>
                  </div>
                  {Object.keys(BENCHMARKS).map((key, i) => {
                    const b = BENCHMARKS[key]; const va = comparativa.a.kpis[key]; const vb = comparativa.b.kpis[key];
                    let mejor = "empate";
                    if (b.invertido) { if (va < vb) mejor = "A"; else if (vb < va) mejor = "B"; }
                    else { if (va > vb) mejor = "A"; else if (vb > va) mejor = "B"; }
                    return (
                      <div key={key} style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 80px", padding: "12px 22px", gap: "12px", background: i % 2 === 0 ? C.blanco : C.fondo, borderTop: `1px solid ${C.borde}`, alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600" }}>{b.label}</div>
                          <div style={{ fontSize: "10px", color: C.textoTer }}>{b.unidad}</div>
                        </div>
                        {[va, vb].map((v, idx) => {
                          const sem = semaforo(key, v); const esMejor = (idx === 0 && mejor === "A") || (idx === 1 && mejor === "B");
                          return (
                            <div key={idx} style={{ fontSize: "22px", fontWeight: "700", color: colorSem[sem], background: esMejor ? bgSem[sem] : "transparent", padding: "6px 10px", borderRadius: "6px", display: "inline-block" }}>
                              {v.toFixed(key === "error_picking" || key === "devolucion" ? 2 : 1)}
                              <span style={{ fontSize: "11px", color: C.textoTer, marginLeft: "3px", fontWeight: "400" }}>{b.unidad}</span>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: "13px", fontWeight: "700", color: mejor === "A" ? C.azulClaro : mejor === "B" ? "#FFB74D" : C.textoTer }}>{mejor === "empate" ? "=" : `▶ ${mejor}`}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setComparativa({ a: null, b: null })} style={{ ...btnS, marginTop: "14px" }}>Limpiar comparativa</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
