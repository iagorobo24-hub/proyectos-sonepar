import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line } from "recharts";

const TURNOS = ["Mañana (06:00-14:00)", "Tarde (14:00-22:00)", "Noche (22:00-06:00)"];
const DELEGACIONES = ["A Coruña", "Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Zaragoza"];

const BENCHMARK = {
  pedidosHora: { bueno: 45, medio: 30, malo: 15 },
  errorPicking: { bueno: 0.5, medio: 1.5, malo: 3 },
  tiempoCiclo: { bueno: 8, medio: 15, malo: 25 },
  ocupacionAlmacen: { bueno: 75, medio: 85, malo: 95 },
  devolucionesPorc: { bueno: 1, medio: 3, malo: 6 },
};

const getColor = (key, val) => {
  const b = BENCHMARK[key];
  if (!b) return "#888";
  if (key === "errorPicking" || key === "tiempoCiclo" || key === "devolucionesPorc") {
    if (val <= b.bueno) return "#2e7d32";
    if (val <= b.medio) return "#f57c00";
    return "#e53935";
  } else if (key === "ocupacionAlmacen") {
    if (val <= b.bueno) return "#2e7d32";
    if (val <= b.medio) return "#f57c00";
    return "#e53935";
  } else {
    if (val >= b.bueno) return "#2e7d32";
    if (val >= b.medio) return "#f57c00";
    return "#e53935";
  }
};

const getLabel = (key, val) => {
  const b = BENCHMARK[key];
  if (!b) return "—";
  if (key === "errorPicking" || key === "tiempoCiclo" || key === "devolucionesPorc") {
    if (val <= b.bueno) return "ÓPTIMO";
    if (val <= b.medio) return "ACEPTABLE";
    return "CRÍTICO";
  } else if (key === "ocupacionAlmacen") {
    if (val <= b.bueno) return "ÓPTIMO";
    if (val <= b.medio) return "ALTO";
    return "CRÍTICO";
  } else {
    if (val >= b.bueno) return "ÓPTIMO";
    if (val >= b.medio) return "ACEPTABLE";
    return "BAJO";
  }
};

export default function KPILogistico() {
  const [delegacion, setDelegacion] = useState("A Coruña");
  const [turno, setTurno] = useState(TURNOS[0]);
  const [datos, setDatos] = useState({
    pedidosTotales: "320",
    horasTrabajadas: "8",
    erroresPicking: "4",
    tiempoCicloMin: "12",
    ubicacionesTotales: "5000",
    ubicacionesOcupadas: "3900",
    devoluciones: "6",
    operarios: "8",
  });
  const [resultado, setResultado] = useState(null);
  const [informe, setInforme] = useState("");
  const [cargando, setCargando] = useState(false);
  const [calculado, setCalculado] = useState(false);

  const setD = (k, v) => setDatos(p => ({ ...p, [k]: v }));

  const calcular = () => {
    const p = parseFloat(datos.pedidosTotales) || 0;
    const h = parseFloat(datos.horasTrabajadas) || 1;
    const e = parseFloat(datos.erroresPicking) || 0;
    const t = parseFloat(datos.tiempoCicloMin) || 0;
    const uTotal = parseFloat(datos.ubicacionesTotales) || 1;
    const uOcup = parseFloat(datos.ubicacionesOcupadas) || 0;
    const dev = parseFloat(datos.devoluciones) || 0;
    const op = parseFloat(datos.operarios) || 1;

    const kpis = {
      pedidosHora: parseFloat((p / h).toFixed(1)),
      errorPicking: parseFloat(((e / p) * 100).toFixed(2)),
      tiempoCiclo: t,
      ocupacionAlmacen: parseFloat(((uOcup / uTotal) * 100).toFixed(1)),
      devolucionesPorc: parseFloat(((dev / p) * 100).toFixed(2)),
      productividadOp: parseFloat((p / op).toFixed(1)),
    };

    setResultado(kpis);
    setCalculado(true);
    setInforme("");
  };

  const generarInforme = async () => {
    if (!resultado) return;
    setCargando(true);
    try {
      const prompt = `Eres un analista logístico senior especializado en distribución de material eléctrico (contexto: empresa tipo Sonepar). 
Analiza estos KPIs del turno "${turno}" de la delegación "${delegacion}" y genera un informe ejecutivo en español:

KPIs del turno:
- Pedidos/hora: ${resultado.pedidosHora} (benchmark óptimo: ≥45)
- Error de picking: ${resultado.errorPicking}% (benchmark óptimo: ≤0.5%)
- Tiempo de ciclo medio: ${resultado.tiempoCiclo} min (benchmark óptimo: ≤8 min)
- Ocupación almacén: ${resultado.ocupacionAlmacen}% (benchmark óptimo: ≤75%)
- Tasa de devoluciones: ${resultado.devolucionesPorc}% (benchmark óptimo: ≤1%)
- Productividad por operario: ${resultado.productividadOp} pedidos/operario

Datos base: ${datos.pedidosTotales} pedidos, ${datos.operarios} operarios, ${datos.horasTrabajadas}h turno.

Genera un informe con estas 4 secciones exactas (texto plano, sin markdown):
RESUMEN EJECUTIVO: [2-3 frases con valoración general del turno]
PUNTOS FUERTES: [2 puntos concretos donde el turno ha rendido bien]
ÁREAS DE MEJORA: [2-3 acciones específicas y realizables para mejorar los KPIs más débiles]
RECOMENDACIÓN PARA EL SIGUIENTE TURNO: [1 acción concreta e inmediata]`;

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
      setInforme(data.content?.map(i => i.text || "").join("") || "");
    } catch (e) {
      setInforme("Error al generar el informe.");
    }
    setCargando(false);
  };

  const historicoDemo = [
    { dia: "Lun", pedidos: 285, errores: 1.2 },
    { dia: "Mar", pedidos: 310, errores: 0.8 },
    { dia: "Mié", pedidos: 298, errores: 1.5 },
    { dia: "Jue", pedidos: 342, errores: 0.6 },
    { dia: "Vie", pedidos: 320, errores: resultado ? resultado.errorPicking : 1.2 },
  ];

  const campos = [
    { key: "pedidosTotales", label: "Pedidos totales", unit: "ud" },
    { key: "horasTrabajadas", label: "Horas trabajadas", unit: "h" },
    { key: "erroresPicking", label: "Errores de picking", unit: "ud" },
    { key: "tiempoCicloMin", label: "Tiempo ciclo medio", unit: "min" },
    { key: "ubicacionesTotales", label: "Ubicaciones totales", unit: "ud" },
    { key: "ubicacionesOcupadas", label: "Ubicaciones ocupadas", unit: "ud" },
    { key: "devoluciones", label: "Devoluciones", unit: "ud" },
    { key: "operarios", label: "Operarios en turno", unit: "p" },
  ];

  const kpisMostrar = resultado ? [
    { key: "pedidosHora", label: "Pedidos / Hora", val: resultado.pedidosHora, unit: "ped/h", desc: "Rendimiento operativo" },
    { key: "errorPicking", label: "Error de Picking", val: resultado.errorPicking, unit: "%", desc: "Calidad del proceso" },
    { key: "tiempoCiclo", label: "Tiempo de Ciclo", val: resultado.tiempoCiclo, unit: "min", desc: "Velocidad de proceso" },
    { key: "ocupacionAlmacen", label: "Ocupación Almacén", val: resultado.ocupacionAlmacen, unit: "%", desc: "Capacidad utilizada" },
    { key: "devolucionesPorc", label: "Tasa Devoluciones", val: resultado.devolucionesPorc, unit: "%", desc: "Satisfacción cliente" },
    { key: "productividadOp", label: "Productividad/Op.", val: resultado.productividadOp, unit: "ped/op", desc: "Eficiencia personal" },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1a1a2e" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)", padding: "0 36px", display: "flex", alignItems: "stretch", boxShadow: "0 2px 20px rgba(13,71,161,0.4)" }}>
        <div style={{ background: "#ffd600", padding: "18px 22px", display: "flex", alignItems: "center", marginRight: "24px" }}>
          <span style={{ fontWeight: "900", fontSize: "13px", letterSpacing: "3px", color: "#000", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#ffd600", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>KPI LOGÍSTICO</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>ANÁLISIS DE TURNO · IA</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
          <select value={delegacion} onChange={e => setDelegacion(e.target.value)} style={{
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
            padding: "6px 12px", fontSize: "11px", fontFamily: "'Courier New', monospace", cursor: "pointer", outline: "none",
          }}>
            {DELEGACIONES.map(d => <option key={d} value={d} style={{ background: "#1565c0" }}>{d}</option>)}
          </select>
          <select value={turno} onChange={e => setTurno(e.target.value)} style={{
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
            padding: "6px 12px", fontSize: "11px", fontFamily: "'Courier New', monospace", cursor: "pointer", outline: "none",
          }}>
            {TURNOS.map(t => <option key={t} value={t} style={{ background: "#1565c0" }}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "calc(100vh - 61px)", gap: "0" }}>

        {/* Panel entrada datos */}
        <div style={{ background: "#fff", borderRight: "1px solid #e0e4ed", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", borderBottom: "1px solid #f0f0f0", paddingBottom: "12px" }}>
            DATOS DEL TURNO
          </div>

          {campos.map(({ key, label, unit }) => (
            <div key={key}>
              <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "4px", letterSpacing: "1px" }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="number"
                  value={datos[key]}
                  onChange={e => setD(key, e.target.value)}
                  style={{
                    flex: 1, padding: "8px 12px", border: "1px solid #e0e4ed", fontSize: "15px",
                    fontWeight: "600", color: "#1a1a2e", outline: "none", background: "#f8f9ff",
                    fontFamily: "'Courier New', monospace",
                  }}
                />
                <span style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace", width: "30px" }}>{unit}</span>
              </div>
            </div>
          ))}

          <button onClick={calcular} style={{
            marginTop: "8px",
            background: "linear-gradient(135deg, #0d47a1, #1565c0)",
            color: "#ffd600", border: "none", padding: "14px",
            fontSize: "11px", letterSpacing: "3px", fontFamily: "'Courier New', monospace",
            cursor: "pointer", fontWeight: "700", boxShadow: "0 4px 12px rgba(13,71,161,0.3)",
          }}>
            CALCULAR KPIs ›
          </button>

          {calculado && (
            <button onClick={generarInforme} disabled={cargando} style={{
              background: cargando ? "#e0e4ed" : "#ffd600",
              color: cargando ? "#aaa" : "#000", border: "none", padding: "12px",
              fontSize: "11px", letterSpacing: "2px", fontFamily: "'Courier New', monospace",
              cursor: cargando ? "not-allowed" : "pointer", fontWeight: "700",
            }}>
              {cargando ? "GENERANDO INFORME..." : "◈ INFORME IA"}
            </button>
          )}
        </div>

        {/* Panel resultados */}
        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {!calculado ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px" }}>
              <div style={{ fontSize: "64px", opacity: 0.1 }}>📊</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", letterSpacing: "4px", color: "#ccc" }}>
                INTRODUCE LOS DATOS Y PULSA CALCULAR
              </div>
            </div>
          ) : (
            <>
              {/* Grid KPIs */}
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>
                  INDICADORES — {delegacion.toUpperCase()} · {turno.split(" ")[0].toUpperCase()}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {kpisMostrar.map(({ key, label, val, unit, desc }) => {
                    const color = getColor(key, val);
                    const lbl = getLabel(key, val);
                    return (
                      <div key={key} style={{
                        background: "#fff", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        borderTop: `4px solid ${color}`, position: "relative",
                      }}>
                        <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{label.toUpperCase()}</div>
                        <div style={{ fontSize: "32px", fontWeight: "900", color, lineHeight: 1, marginBottom: "4px" }}>
                          {val}<span style={{ fontSize: "14px", fontWeight: "400", color: "#aaa", marginLeft: "4px" }}>{unit}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: "#bbb", marginBottom: "8px" }}>{desc}</div>
                        <div style={{
                          display: "inline-block", padding: "2px 8px", fontSize: "9px",
                          letterSpacing: "1.5px", fontFamily: "'Courier New', monospace",
                          background: color + "15", color, border: `1px solid ${color}40`, fontWeight: "700",
                        }}>{lbl}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráficos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "#fff", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>PEDIDOS SEMANA</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={historicoDemo} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11, fontFamily: "'Courier New', monospace", fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontFamily: "'Courier New', monospace", fontSize: "11px", border: "1px solid #eee" }} />
                      <Bar dataKey="pedidos" fill="#1565c0" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "#fff", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>ERROR PICKING % SEMANA</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={historicoDemo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11, fontFamily: "'Courier New', monospace", fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontFamily: "'Courier New', monospace", fontSize: "11px", border: "1px solid #eee" }} />
                      <Line type="monotone" dataKey="errores" stroke="#e53935" strokeWidth={2} dot={{ fill: "#e53935", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Informe IA */}
              {informe && (
                <div style={{ background: "#0d1a3a", padding: "28px 32px", boxShadow: "0 4px 20px rgba(13,71,161,0.2)" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#ffd600", fontFamily: "'Courier New', monospace", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>◈</span> INFORME EJECUTIVO IA — {delegacion.toUpperCase()} · {turno.split(" ")[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#c8d8f0", lineHeight: "1.9", whiteSpace: "pre-wrap" }}>
                    {informe}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
