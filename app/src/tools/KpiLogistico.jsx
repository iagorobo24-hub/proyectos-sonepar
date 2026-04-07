import { useState, useEffect } from "react";
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import WelcomeState from '../components/ui/WelcomeState'
import { useToast } from '../contexts/ToastContext'
import styles from './KpiLogistico.module.css'

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
  const { toast } = useToast();
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
    if (b.invertido) { if (valor <= b.bueno) return "azul"; if (valor >= b.malo) return "rojo"; return "amarillo"; }
    if (valor >= b.bueno) return "azul"; if (valor <= b.malo) return "rojo"; return "amarillo";
  };

  const calcular = async () => {
    const k = calcularKPIs();
    if (!k) { toast.show("Completa al menos: pedidos, horas y líneas expedidas"); return; }
    setKpis(k);
    setCargando(true);
    setInforme("");
    try {
      const { callAnthropicAI } = await import('../services/anthropicService')
      const systemPrompt = `Eres el responsable de logística de Sonepar España. Analiza estos KPIs y genera un informe ejecutivo breve.`

      const { text } = await callAnthropicAI({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Delegación: ${datos.delegacion || "Delegación"} | Turno: ${datos.turno}\n\nKPIs:\n- Pedidos/hora: ${k.pedidos_hora.toFixed(1)} (benchmark: >18)\n- Error picking: ${k.error_picking.toFixed(2)}% (benchmark: <1%)\n- Tiempo ciclo: ${k.tiempo_ciclo.toFixed(1)} min (benchmark: <5 min)\n- Ocupación: ${k.ocupacion.toFixed(1)}% (benchmark: 75-85%)\n- Devoluciones: ${k.devolucion.toFixed(2)}% (benchmark: <2%)\n- Productividad: ${k.productividad.toFixed(1)}% (benchmark: >90%)\n\nDatos: ${datos.pedidos} pedidos, ${datos.horas}h, ${datos.operarios} operarios, ${datos.errores} errores.\n\n3 párrafos cortos: (1) resumen del turno, (2) puntos críticos, (3) acción para el próximo turno. Tono directo.` }],
      })

      setInforme(text || "Error al conectar con la IA.");
      guardarHistorial({ delegacion: datos.delegacion || "Delegación", turno: datos.turno, fecha: new Date().toISOString(), kpis: k, informe: text });
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

  return (
    <div className={styles.layout}>
      {/* ── Panel izquierdo — formulario y datos ── */}
      <div className={styles.panelBusqueda}>
        {/* Tabs CÁLCULO / HISTORIAL / COMPARATIVA */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.tab} ${tab === 'calculo' ? styles.tabActivo : ''}`}
            onClick={() => setTab('calculo')}
          >
            Cálculo
          </button>
          <button
            className={`${styles.tab} ${tab === 'historial' ? styles.tabActivo : ''}`}
            onClick={() => setTab('historial')}
          >
            Historial
          </button>
          <button
            className={`${styles.tab} ${tab === 'comparativa' ? styles.tabActivo : ''}`}
            onClick={() => setTab('comparativa')}
          >
            Comparativa
          </button>
        </div>

        {/* Formulario de cálculo */}
        {tab === 'calculo' && (
          <>
            <div className={styles.seccion}>
              <div className={styles.seccionLabel}>DATOS DEL TURNO</div>
              <div style={{ marginBottom: 12 }}>
                <Input
                  value={datos.delegacion}
                  onChange={e => setDatos(p => ({ ...p, delegacion: e.target.value }))}
                  placeholder="Delegación (Ej: Sonepar A Coruña)"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div className={styles.seccionLabel}>TURNO</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["Mañana", "Tarde", "Noche"].map(t => (
                    <button
                      key={t}
                      onClick={() => setDatos(p => ({ ...p, turno: t }))}
                      className={`${datos.turno === t ? styles.btnPrimary : styles.btnSecondary}`}
                      style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setDatos({ ...EJEMPLO, turno: "Mañana" })}
                style={{ width: "100%", marginBottom: 12 }}
              >
                Cargar ejemplo
              </Button>
            </div>

            <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
              {CAMPOS.map(({ key, label, placeholder, desc }) => (
                <div key={key} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className={styles.seccionLabel} style={{ marginBottom: "4px" }}>{label}</div>
                    <span 
                      onMouseEnter={() => setTooltip(key)} 
                      onMouseLeave={() => setTooltip("")} 
                      style={{ fontSize: "13px", color: "var(--color-brand)", cursor: "help" }}
                    >
                      ⓘ
                    </span>
                  </div>
                  {tooltip === key && (
                    <div style={{ fontSize: "11px", color: "var(--color-text)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "6px 10px", marginBottom: "4px", lineHeight: "1.4" }}>
                      {desc}
                    </div>
                  )}
                  <input 
                    value={datos[key]} 
                    onChange={e => setDatos(p => ({ ...p, [key]: e.target.value }))} 
                    placeholder={placeholder} 
                    type="number" 
                    className={styles.input}
                  />
                </div>
              ))}
              <Button 
                variant="primary" 
                onClick={calcular} 
                loading={cargando}
                style={{ width: "100%", padding: "12px" }}
              >
                {cargando ? "Calculando..." : "Calcular KPIs + Informe IA"}
              </Button>
            </div>
          </>
        )}

        {/* Historial */}
        {tab === 'historial' && (
          <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
            <div className={styles.seccionLabel}>
              HISTORIAL ({historial.length} / 30 registros)
            </div>
            {historial.length === 0 ? (
              <div className={styles.vacio}>
                <div className={styles.vacioDiamond}>◈</div>
                <div className={styles.vacioTexto}>Aún no hay turnos calculados</div>
              </div>
            ) : (
              historial.map((h, i) => (
                <div key={i} className={styles.historialItem}>
                  <div className={styles.historialHeader}>
                    <div className={styles.historialTitulo}>{h.delegacion}</div>
                    <div className={styles.historialMeta}>
                      {new Date(h.fecha).toLocaleDateString("es-ES")} · {h.turno}
                    </div>
                  </div>
                  <div className={styles.historialKpis}>
                    {Object.entries(h.kpis).map(([key, valor]) => {
                      const b = BENCHMARKS[key];
                      return (
                        <div key={key} className={styles.historialKpi}>
                          <div>{b.label.toUpperCase()}</div>
                          <div className={styles.historialKpiValor}>
                            {valor.toFixed(1)}{b.unidad}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => { setComparativa(p => p.a ? { ...p, b: h } : { ...p, a: h }); setTab("comparativa"); }}
                    style={{ marginTop: 8 }}
                  >
                    + Comparar
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comparativa */}
        {tab === 'comparativa' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>COMPARATIVA DE TURNOS</div>
            {(!comparativa.a || !comparativa.b) ? (
              <div className={styles.vacio}>
                <div className={styles.vacioDiamond}>◈</div>
                <div className={styles.vacioTexto}>
                  {!comparativa.a ? "Selecciona dos turnos para comparar" : "Selecciona un segundo turno"}
                </div>
                {comparativa.a && (
                  <div style={{ fontSize: 13, color: "var(--color-text)", marginTop: 12 }}>
                    Turno A: <strong>{comparativa.a.delegacion} · {comparativa.a.turno}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div className={styles.seccionLabel}>TURNOS SELECCIONADOS</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-2)" }}>
                    <div>A: {comparativa.a.delegacion} · {comparativa.a.turno}</div>
                    <div>B: {comparativa.b.delegacion} · {comparativa.b.turno}</div>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => setComparativa({ a: null, b: null })}
                  style={{ width: "100%" }}
                >
                  Limpiar comparativa
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Panel derecho — resultados ── */}
      <div className={styles.panelResultado}>
        {/* Resultados del cálculo */}
        {tab === 'calculo' && kpis && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-2)", fontWeight: "500", marginBottom: "4px" }}>
                {datos.delegacion || "DELEGACIÓN"} · Turno {datos.turno}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>Informe de KPIs</div>
              <div style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: "2px" }}>
                {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>

            {/* Grid KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {Object.entries(kpis).map(([key, valor]) => {
                const b = BENCHMARKS[key];
                const sem = semaforo(key, valor);
                const semaforoClass = sem === "azul" ? styles.semaforoVerde : sem === "amarillo" ? styles.semaforoAmarillo : styles.semaforoRojo;
                return (
                  <div key={key} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <div className={styles.kpiLabel}>{b.label.toUpperCase()}</div>
                      <div className={`${styles.semaforoIndicador} ${semaforoClass}`} />
                    </div>
                    <div className={styles.kpiValue}>
                      {valor.toFixed(key === "error_picking" || key === "devolucion" ? 2 : 1)}
                      <span style={{ fontSize: 13, color: "var(--color-text-2)", marginLeft: 4, fontWeight: 400 }}>
                        {b.unidad}
                      </span>
                    </div>
                    <div className={styles.kpiDescription}>
                      Ref: {b.invertido ? `<${b.bueno}` : `>${b.bueno}`} {b.unidad}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gráficos */}
            {datosGrafico.length >= 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                {[
                  { titulo: "Pedidos/hora — últimos turnos",    dataKey: "pedidos_hora",  ref: 18, tipo: "bar"  },
                  { titulo: "Error picking % — últimos turnos", dataKey: "error_picking", ref: 1,  tipo: "line" },
                ].map(({ titulo, dataKey, ref, tipo }) => (
                  <div key={dataKey} className={styles.chartContainer}>
                    <div className={styles.chartTitle}>{titulo}</div>
                    <ResponsiveContainer width="100%" height={120}>
                      {tipo === "bar" ? (
                        <BarChart data={datosGrafico}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-2)" }} />
                          <YAxis tick={{ fontSize: 10, fill: "var(--color-text-2)" }} />
                          <Tooltip formatter={v => [v, "ped/h"]} />
                          <ReferenceLine y={ref} stroke="var(--color-brand)" strokeDasharray="4 4" />
                          <Bar dataKey={dataKey} fill="var(--color-brand)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={datosGrafico}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-2)" }} />
                          <YAxis tick={{ fontSize: 10, fill: "var(--color-text-2)" }} />
                          <Tooltip formatter={v => [v + "%", "error"]} />
                          <ReferenceLine y={ref} stroke="var(--color-brand)" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey={dataKey} stroke="var(--color-text)" strokeWidth={2} dot={{ fill: "var(--color-text)", r: 3 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            )}

            {/* Informe IA */}
            {informe && (
              <div className={styles.informeSection}>
                <div className={styles.informeTitle}>INFORME EJECUTIVO IA</div>
                <div className={styles.informeContent}>{informe}</div>
              </div>
            )}

            <Button variant="primary" onClick={() => window.print()} style={{ marginTop: 16 }}>
              Exportar PDF
            </Button>
          </div>
        )}

        {/* Vista comparativa detallada */}
        {tab === 'comparativa' && comparativa.a && comparativa.b && (
          <div>
            <div className={styles.seccionLabel} style={{ marginBottom: 20 }}>
              COMPARATIVA DETALLADA
            </div>
            <div className={styles.card} style={{ overflow: "hidden" }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "200px 1fr 1fr 80px", 
                background: "var(--color-surface)", 
                padding: "12px 22px", 
                gap: "12px" 
              }}>
                <div className={styles.kpiLabel}>KPI</div>
                {[comparativa.a, comparativa.b].map((c, i) => (
                  <div key={i} style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                    {i === 0 ? "A" : "B"} · {c.delegacion} · {c.turno}
                    <div style={{ fontSize: 10, color: "var(--color-text-2)", fontWeight: 400 }}>
                      {new Date(c.fecha).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                ))}
                <div className={styles.kpiLabel}>MEJOR</div>
              </div>
              {Object.keys(BENCHMARKS).map((key, i) => {
                const b = BENCHMARKS[key];
                const va = comparativa.a.kpis[key];
                const vb = comparativa.b.kpis[key];
                let mejor = "empate";
                if (b.invertido) { if (va < vb) mejor = "A"; else if (vb < va) mejor = "B"; }
                else { if (va > vb) mejor = "A"; else if (vb > va) mejor = "B"; }
                return (
                  <div key={key} style={{ 
                    display: "grid", 
                    gridTemplateColumns: "200px 1fr 1fr 80px", 
                    padding: "12px 22px", 
                    gap: "12px", 
                    background: i % 2 === 0 ? "var(--color-bg)" : "var(--color-surface)", 
                    borderTop: "1px solid var(--color-border)", 
                    alignItems: "center" 
                  }}>
                    <div>
                      <div className={styles.cardTitle}>{b.label}</div>
                      <div className={styles.cardMeta}>{b.unidad}</div>
                    </div>
                    {[va, vb].map((v, idx) => {
                      const sem = semaforo(key, v);
                      const semaforoClass = sem === "azul" ? styles.semaforoVerde : sem === "amarillo" ? styles.semaforoAmarillo : styles.semaforoRojo;
                      const esMejor = (idx === 0 && mejor === "A") || (idx === 1 && mejor === "B");
                      return (
                        <div key={idx} style={{ 
                          fontSize: 22, 
                          fontWeight: 700, 
                          color: "var(--color-text)", 
                          background: esMejor ? "var(--color-surface)" : "transparent", 
                          padding: "6px 10px", 
                          borderRadius: "6px", 
                          display: "inline-block" 
                        }}>
                          {v.toFixed(key === "error_picking" || key === "devolucion" ? 2 : 1)}
                          <span style={{ fontSize: 11, color: "var(--color-text-2)", marginLeft: 3, fontWeight: 400 }}>
                            {b.unidad}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                      {mejor === "empate" ? "=" : `▶ ${mejor}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {tab === 'calculo' && !kpis && (
          <WelcomeState
            icon={TrendingUp}
            title="KPI Logístico"
            subtitle="Introduce los datos del turno y calcula 6 KPIs clave con semáforo de estado e informe ejecutivo IA."
            chips={[
              'Pedidos por hora',
              'Error de picking',
              'Tiempo de ciclo',
              'Ocupación almacén',
              'Cargar ejemplo →'
            ]}
            onChipClick={(chip) => {
              if (chip === 'Cargar ejemplo →') {
                const btn = document.querySelector('[data-demo-btn]')
                if (btn) btn.click()
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
