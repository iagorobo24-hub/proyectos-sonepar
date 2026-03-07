import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const BENCHMARKS = {
  pedidos_hora:   { bueno: 18, malo: 12, label: "Pedidos/hora", unidad: "ped/h", desc: "Número de pedidos completados por hora de turno", icono: "📦" },
  error_picking:  { bueno: 1, malo: 3, label: "Error picking", unidad: "%", desc: "Porcentaje de líneas con error sobre total de líneas procesadas", icono: "⚠", invertido: true },
  tiempo_ciclo:   { bueno: 5, malo: 10, label: "Tiempo ciclo", unidad: "min", desc: "Tiempo medio desde entrada de pedido hasta expedición", icono: "⏱", invertido: true },
  ocupacion:      { bueno: 85, malo: 95, label: "Ocupación", unidad: "%", desc: "Porcentaje de ubicaciones ocupadas sobre el total disponible", icono: "🏭" },
  devolucion:     { bueno: 2, malo: 5, label: "Devoluciones", unidad: "%", desc: "Porcentaje de líneas devueltas sobre total expedido", icono: "↩", invertido: true },
  productividad:  { bueno: 90, malo: 70, label: "Productividad", unidad: "%", desc: "Rendimiento del equipo respecto a la capacidad teórica del turno", icono: "👥" },
};

const EJEMPLO = {
  delegacion: "Sonepar A Coruña", turno: "Mañana",
  pedidos: 145, horas: 8, errores: 3, tiempo_ciclo: 4.2,
  ubicaciones_ocupadas: 8750, ubicaciones_total: 12000,
  devoluciones: 7, lineas_expedidas: 420, operarios: 6,
};

const PROMPT_INFORME = (kpis, datos, delegacion, turno) => `Eres el responsable de logística de una delegación de Sonepar España. Analiza los KPIs del turno y genera un informe ejecutivo breve.

Delegación: ${delegacion} | Turno: ${turno}

KPIs del turno:
- Pedidos/hora: ${kpis.pedidos_hora.toFixed(1)} (benchmark: >18)
- Error picking: ${kpis.error_picking.toFixed(2)}% (benchmark: <1%)
- Tiempo ciclo: ${kpis.tiempo_ciclo.toFixed(1)} min (benchmark: <5 min)
- Ocupación almacén: ${kpis.ocupacion.toFixed(1)}% (benchmark: 75-85%)
- Tasa devoluciones: ${kpis.devolucion.toFixed(2)}% (benchmark: <2%)
- Productividad equipo: ${kpis.productividad.toFixed(1)}% (benchmark: >90%)

Datos brutos: ${datos.pedidos} pedidos, ${datos.horas}h turno, ${datos.operarios} operarios, ${datos.errores} errores picking.

Responde en 3 párrafos cortos: (1) resumen del turno en una frase, (2) puntos críticos a resolver, (3) acción concreta recomendada para el próximo turno. Tono directo, sin adornos.`;

export default function KpiLogistico() {
  const [datos, setDatos] = useState({
    delegacion: "", turno: "Mañana",
    pedidos: "", horas: "", errores: "", tiempo_ciclo: "",
    ubicaciones_ocupadas: "", ubicaciones_total: "",
    devoluciones: "", lineas_expedidas: "", operarios: "",
  });
  const [kpis, setKpis] = useState(null);
  const [informe, setInforme] = useState("");
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [tab, setTab] = useState("calculo"); // calculo | historial | comparativa
  const [comparativa, setComparativa] = useState({ a: null, b: null });
  const [tooltip, setTooltip] = useState("");

  useEffect(() => {
    try {
      const h = localStorage.getItem("sonepar_kpi_historial");
      if (h) setHistorial(JSON.parse(h));
    } catch {}
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
    if (b.invertido) {
      if (valor <= b.bueno) return "verde";
      if (valor <= b.malo) return "amarillo";
      return "rojo";
    }
    if (valor >= b.bueno) return "verde";
    if (valor >= b.malo) return "amarillo";
    return "rojo";
  };

  const colorSem = { verde: "#2e7d32", amarillo: "#f9a825", rojo: "#c62828" };
  const bgSem    = { verde: "#e8f5e9", amarillo: "#fffde7", rojo: "#ffebee" };

  const calcular = async () => {
    const k = calcularKPIs();
    if (!k) return;
    setKpis(k);
    setCargando(true);
    setInforme("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_INFORME(k, datos, datos.delegacion || "Delegación", datos.turno) }],
        }),
      });
      const data = await res.json();
      const texto = data.content?.map(i => i.text || "").join("") || "";
      setInforme(texto);
      guardarHistorial({
        fecha: Date.now(),
        delegacion: datos.delegacion || "Delegación",
        turno: datos.turno,
        kpis: k,
        informe: texto.slice(0, 500),
      });
    } catch { setInforme("Error al generar el informe."); }
    setCargando(false);
  };

  const cargarEjemplo = () => {
    setDatos({
      delegacion: EJEMPLO.delegacion, turno: EJEMPLO.turno,
      pedidos: String(EJEMPLO.pedidos), horas: String(EJEMPLO.horas),
      errores: String(EJEMPLO.errores), tiempo_ciclo: String(EJEMPLO.tiempo_ciclo),
      ubicaciones_ocupadas: String(EJEMPLO.ubicaciones_ocupadas),
      ubicaciones_total: String(EJEMPLO.ubicaciones_total),
      devoluciones: String(EJEMPLO.devoluciones),
      lineas_expedidas: String(EJEMPLO.lineas_expedidas),
      operarios: String(EJEMPLO.operarios),
    });
    setKpis(null); setInforme("");
  };

  const imprimirPDF = () => window.print();

  // Datos para gráficos desde historial
  const datosGrafico = historial.slice(0, 7).reverse().map((h, i) => ({
    name: `T${i + 1}`,
    pedidos_hora: parseFloat(h.kpis.pedidos_hora.toFixed(1)),
    error_picking: parseFloat(h.kpis.error_picking.toFixed(2)),
    fecha: new Date(h.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
  }));

  const CAMPOS = [
    { key: "pedidos",             label: "PEDIDOS COMPLETADOS",        placeholder: "145",  desc: "Total de pedidos completados durante el turno" },
    { key: "horas",               label: "HORAS DE TURNO",             placeholder: "8",    desc: "Duración real del turno en horas" },
    { key: "operarios",           label: "OPERARIOS EN TURNO",         placeholder: "6",    desc: "Número de operarios activos durante el turno" },
    { key: "lineas_expedidas",    label: "LÍNEAS EXPEDIDAS",           placeholder: "420",  desc: "Total de líneas de pedido procesadas y expedidas" },
    { key: "errores",             label: "ERRORES DE PICKING",         placeholder: "3",    desc: "Número de líneas con error detectado en verificación" },
    { key: "tiempo_ciclo",        label: "TIEMPO CICLO MEDIO (min)",   placeholder: "4.2",  desc: "Tiempo medio en minutos desde entrada de pedido hasta expedición" },
    { key: "ubicaciones_ocupadas",label: "UBICACIONES OCUPADAS",       placeholder: "8750", desc: "Número de ubicaciones físicas actualmente ocupadas" },
    { key: "ubicaciones_total",   label: "UBICACIONES TOTALES",        placeholder: "12000",desc: "Capacidad total de ubicaciones del almacén" },
    { key: "devoluciones",        label: "DEVOLUCIONES",               placeholder: "7",    desc: "Número de líneas devueltas o rechazadas por el cliente" },
  ];

  const S = {
    btn: (color = "#1a1a2e", full = false) => ({
      padding: "9px 20px", fontSize: "10px", letterSpacing: "1.5px",
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

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-area { padding: 20px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Georgia', serif", color: "#1a1a2e" }}>

        {/* Header */}
        <div className="no-print" style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: "3px solid #1565c0" }}>
          <div style={{ background: "#1565c0", padding: "16px 22px", display: "flex", alignItems: "center", marginRight: "20px" }}>
            <span style={{ fontWeight: "900", fontSize: "12px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <span style={{ color: "#1565c0", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>KPI LOGÍSTICO</span>
            <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>CALCULADORA · v2</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {["calculo", "historial", "comparativa"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ ...S.btn(tab === t ? "#1565c0" : "#2a2a3e") }}>
                {t === "calculo" ? "CÁLCULO" : t === "historial" ? "HISTORIAL" : "COMPARATIVA"}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CÁLCULO */}
        {tab === "calculo" && (
          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", minHeight: "calc(100vh - 67px)" }}>

            {/* Formulario */}
            <div className="no-print" style={{ background: "#fff", borderRight: "1px solid #e0dbd4", padding: "24px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace" }}>DATOS DEL TURNO</div>
                <button onClick={cargarEjemplo} style={{ ...S.btnOutline("#1565c0"), fontSize: "9px", padding: "5px 12px" }}>
                  CARGAR EJEMPLO
                </button>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>DELEGACIÓN</div>
                <input value={datos.delegacion} onChange={e => setDatos(p => ({ ...p, delegacion: e.target.value }))}
                  placeholder="Ej: Sonepar A Coruña"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>TURNO</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["Mañana", "Tarde", "Noche"].map(t => (
                    <button key={t} onClick={() => setDatos(p => ({ ...p, turno: t }))}
                      style={{ flex: 1, padding: "8px", fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: "700", cursor: "pointer", background: datos.turno === t ? "#1565c0" : "#f4f1ec", color: datos.turno === t ? "#fff" : "#888", border: `1px solid ${datos.turno === t ? "#1565c0" : "#ddd"}` }}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {CAMPOS.map(({ key, label, placeholder, desc }) => (
                <div key={key} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{label}</div>
                    <span
                      onMouseEnter={() => setTooltip(key)}
                      onMouseLeave={() => setTooltip("")}
                      style={{ fontSize: "10px", color: "#aaa", cursor: "help", position: "relative" }}
                      title={desc}
                    >ⓘ</span>
                  </div>
                  {tooltip === key && (
                    <div style={{ fontSize: "11px", color: "#555", background: "#fff8e1", border: "1px solid #ffe082", padding: "6px 10px", marginBottom: "5px", lineHeight: "1.4" }}>{desc}</div>
                  )}
                  <input value={datos[key]} onChange={e => setDatos(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} type="number"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
                </div>
              ))}

              <button onClick={calcular} disabled={cargando}
                style={{ ...S.btn(cargando ? "#aaa" : "#1565c0", true), padding: "12px", marginTop: "8px" }}>
                {cargando ? "CALCULANDO..." : "CALCULAR KPIs + INFORME IA ›"}
              </button>
            </div>

            {/* Resultados */}
            <div className="print-area" style={{ padding: "24px 32px", overflowY: "auto" }}>
              {!kpis && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "40px", opacity: 0.15 }}>◈</div>
                  <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#ccc", fontFamily: "'Courier New', monospace" }}>INTRODUCE LOS DATOS DEL TURNO Y PULSA CALCULAR</div>
                </div>
              )}

              {kpis && (
                <>
                  {/* Cabecera imprimible */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>
                      {datos.delegacion || "DELEGACIÓN"} · TURNO {datos.turno.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e" }}>Informe de KPIs</div>
                    <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                      {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>

                  {/* Grid KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                    {Object.entries(kpis).map(([key, valor]) => {
                      const b = BENCHMARKS[key];
                      const sem = semaforo(key, valor);
                      return (
                        <div key={key} style={{ background: bgSem[sem], border: `1px solid ${colorSem[sem]}30`, padding: "16px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{b.label.toUpperCase()}</div>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colorSem[sem], marginTop: "2px" }} />
                          </div>
                          <div style={{ fontSize: "28px", fontWeight: "700", color: colorSem[sem] }}>
                            {valor.toFixed(key === "error_picking" || key === "devolucion" ? 2 : 1)}
                            <span style={{ fontSize: "13px", color: "#888", marginLeft: "4px" }}>{b.unidad}</span>
                          </div>
                          <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace", marginTop: "4px" }}>
                            REF: {b.invertido ? `<${b.bueno}` : `>${b.bueno}`} {b.unidad}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gráficos dinámicos */}
                  {datosGrafico.length >= 2 && (
                    <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                      {[
                        { titulo: "PEDIDOS/HORA — ÚLTIMOS TURNOS", dataKey: "pedidos_hora", color: "#1565c0", ref: 18 },
                        { titulo: "ERROR PICKING % — ÚLTIMOS TURNOS", dataKey: "error_picking", color: "#c62828", ref: 1 },
                      ].map(({ titulo, dataKey, color, ref }) => (
                        <div key={dataKey} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "16px" }}>
                          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>{titulo}</div>
                          <ResponsiveContainer width="100%" height={120}>
                            {dataKey === "pedidos_hora" ? (
                              <BarChart data={datosGrafico}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "'Courier New', monospace" }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v) => [v, "ped/h"]} />
                                <ReferenceLine y={ref} stroke="#2e7d32" strokeDasharray="4 4" />
                                <Bar dataKey={dataKey} fill={color} />
                              </BarChart>
                            ) : (
                              <LineChart data={datosGrafico}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "'Courier New', monospace" }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v) => [v + "%", "error"]} />
                                <ReferenceLine y={ref} stroke="#2e7d32" strokeDasharray="4 4" />
                                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color }} />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      ))}
                    </div>
                  )}

                  {datosGrafico.length < 2 && (
                    <div className="no-print" style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px", marginBottom: "24px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ccc", fontFamily: "'Courier New', monospace" }}>
                        CALCULA 2 O MÁS TURNOS PARA VER LA EVOLUCIÓN EN GRÁFICOS
                      </div>
                    </div>
                  )}

                  {/* Informe IA */}
                  {informe && (
                    <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>◈ INFORME EJECUTIVO IA</div>
                      <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{informe}</div>
                    </div>
                  )}

                  <div className="no-print" style={{ display: "flex", gap: "8px" }}>
                    <button onClick={imprimirPDF} style={{ ...S.btn("#1565c0") }}>EXPORTAR PDF ›</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB HISTORIAL */}
        {tab === "historial" && (
          <div style={{ padding: "24px 32px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "20px" }}>HISTORIAL DE TURNOS ({historial.length}/30)</div>

            {historial.length === 0 && (
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ccc", fontFamily: "'Courier New', monospace" }}>AÚN NO HAY TURNOS CALCULADOS</div>
                <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>Calcula tu primer turno para empezar el historial</div>
              </div>
            )}

            <div style={{ display: "grid", gap: "8px" }}>
              {historial.map((h, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "16px 20px", display: "grid", gridTemplateColumns: "160px 1fr auto", alignItems: "center", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e" }}>{h.delegacion}</div>
                    <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                      {new Date(h.fecha).toLocaleDateString("es-ES")} · {h.turno.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {Object.entries(h.kpis).map(([key, valor]) => {
                      const b = BENCHMARKS[key];
                      const sem = semaforo(key, valor);
                      return (
                        <div key={key} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{b.label.toUpperCase()}</div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: colorSem[sem] }}>{valor.toFixed(1)}<span style={{ fontSize: "9px" }}>{b.unidad}</span></div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => { setComparativa(p => p.a ? { ...p, b: h } : { ...p, a: h }); setTab("comparativa"); }}
                      style={{ ...S.btnOutline("#1565c0"), fontSize: "9px", padding: "5px 10px" }}>
                      + COMPARAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB COMPARATIVA */}
        {tab === "comparativa" && (
          <div style={{ padding: "24px 32px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "20px" }}>COMPARATIVA DE TURNOS</div>

            {(!comparativa.a || !comparativa.b) && (
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "30px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ccc", fontFamily: "'Courier New', monospace" }}>
                  {!comparativa.a && !comparativa.b
                    ? "VE AL HISTORIAL Y PULSA + COMPARAR EN DOS TURNOS"
                    : "SELECCIONA UN SEGUNDO TURNO DESDE EL HISTORIAL"}
                </div>
                {comparativa.a && (
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#1a1a2e" }}>
                    Turno A seleccionado: <strong>{comparativa.a.delegacion} · {comparativa.a.turno}</strong>
                  </div>
                )}
              </div>
            )}

            {comparativa.a && comparativa.b && (
              <>
                <div style={{ background: "#fff", border: "1px solid #e0dbd4" }}>
                  {/* Cabecera */}
                  <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 80px", background: "#1a1a2e", padding: "12px 20px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace" }}>KPI</div>
                    {[comparativa.a, comparativa.b].map((c, i) => (
                      <div key={i} style={{ fontSize: "11px", fontWeight: "700", color: i === 0 ? "#64b5f6" : "#ffb74d", fontFamily: "'Courier New', monospace" }}>
                        {i === 0 ? "A" : "B"} · {c.delegacion} · {c.turno.toUpperCase()}
                        <div style={{ fontSize: "9px", color: "#666", fontWeight: "400" }}>{new Date(c.fecha).toLocaleDateString("es-ES")}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace" }}>MEJOR</div>
                  </div>

                  {Object.keys(BENCHMARKS).map((key, i) => {
                    const b = BENCHMARKS[key];
                    const va = comparativa.a.kpis[key];
                    const vb = comparativa.b.kpis[key];
                    let mejor = "empate";
                    if (b.invertido) { if (va < vb) mejor = "A"; else if (vb < va) mejor = "B"; }
                    else { if (va > vb) mejor = "A"; else if (vb > va) mejor = "B"; }
                    return (
                      <div key={key} style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 80px", padding: "12px 20px", background: i % 2 === 0 ? "#fff" : "#fdfcfa", borderTop: "1px solid #f5f0e8", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e" }}>{b.label}</div>
                          <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{b.unidad}</div>
                        </div>
                        {[va, vb].map((v, idx) => {
                          const sem = semaforo(key, v);
                          const esMejor = (idx === 0 && mejor === "A") || (idx === 1 && mejor === "B");
                          return (
                            <div key={idx} style={{ fontSize: "20px", fontWeight: "700", color: colorSem[sem], background: esMejor ? bgSem[sem] : "transparent", padding: "6px 12px", display: "inline-block" }}>
                              {v.toFixed(key === "error_picking" || key === "devolucion" ? 2 : 1)}
                              <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "3px" }}>{b.unidad}</span>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: "14px", fontWeight: "700", color: mejor === "A" ? "#64b5f6" : mejor === "B" ? "#ffb74d" : "#aaa", fontFamily: "'Courier New', monospace" }}>
                          {mejor === "empate" ? "=" : `▶ ${mejor}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setComparativa({ a: null, b: null })} style={{ ...S.btnOutline("#aaa"), marginTop: "12px", fontSize: "9px" }}>
                  LIMPIAR COMPARATIVA
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
