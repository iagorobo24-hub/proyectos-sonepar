import { useState, useEffect } from "react";
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './KpiLogistico.module.css'

const BENCHMARKS = {
  pedidos_hora:   { bueno: 18, malo: 12, label: "Pedidos/hora",  unidad: "ped/h", desc: "Pedidos completados por hora",                       icono: "📦" },
  error_picking:  { bueno: 1,  malo: 3,  label: "Error picking", unidad: "%",     desc: "Porcentaje de líneas con error",                     icono: "⚠",  invertido: true },
  tiempo_ciclo:   { bueno: 5,  malo: 10, label: "Tiempo ciclo",  unidad: "min",   desc: "Tiempo medio pedido→expedición",                      icono: "⏱",  invertido: true },
  ocupacion:      { bueno: 85, malo: 95, label: "Ocupación",     unidad: "%",     desc: "Ubicaciones ocupadas sobre total",                    icono: "🏭" },
  devolucion:     { bueno: 2,  malo: 5,  label: "Devoluciones",  unidad: "%",     desc: "Porcentaje de líneas devueltas",                      icono: "↩",  invertido: true },
  productividad:  { bueno: 90, malo: 70, label: "Productividad", unidad: "%",     desc: "Rendimiento sobre capacidad teórica",                 icono: "👥" },
};

const EJEMPLO_DATOS = {
  delegacion: "Sonepar A Coruña",
  turno: "Mañana",
  pedidos: "145",
  horas: "8",
  errores: "3",
  tiempo_ciclo: "4.2",
  ubicaciones_ocupadas: "8750",
  ubicaciones_total: "12000",
  devoluciones: "7",
  lineas_expedidas: "420",
  operarios: "6",
};

export default function KPILogistico() {
  const { toast } = useToast();
  const [datos, setDatos] = useState({ delegacion: "", turno: "Mañana", pedidos: "", horas: "", errores: "", tiempo_ciclo: "", ubicaciones_ocupadas: "", ubicaciones_total: "", devoluciones: "", lineas_expedidas: "", operarios: "" });
  const [kpis, setKpis] = useState(null);
  const [informe, setInforme] = useState("");
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [tab, setTab] = useState("calculo");

  const cargarEjemplo = () => {
    setDatos(EJEMPLO_DATOS);
    toast.show("Datos de ejemplo cargados", "success");
  };

  useEffect(() => { try { const h = localStorage.getItem("sonepar_kpi_historial"); if (h) setHistorial(JSON.parse(h)); } catch {} }, []);

  const guardarHistorial = (entrada) => { const nuevo = [entrada, ...historial].slice(0, 30); setHistorial(nuevo); try { localStorage.setItem("sonepar_kpi_historial", JSON.stringify(nuevo)); } catch {} };

  const calcularKPIs = () => {
    const d = datos;
    if (!d.pedidos || !d.horas || !d.lineas_expedidas) return null;
    return {
      pedidos_hora: parseFloat(d.pedidos) / parseFloat(d.horas),
      error_picking: (parseFloat(d.errores) / parseFloat(d.lineas_expedidas)) * 100,
      tiempo_ciclo: parseFloat(d.tiempo_ciclo),
      ocupacion: (parseFloat(d.ubicaciones_ocupadas) / parseFloat(d.ubicaciones_total)) * 100,
      devolucion: (parseFloat(d.devoluciones) / parseFloat(d.lineas_expedidas)) * 100,
      productividad: Math.min(100, (parseFloat(d.pedidos) / (parseFloat(d.operarios) * parseFloat(d.horas) * 2.5)) * 100),
    };
  };

  const semaforoColor = (kpi, valor) => {
    const b = BENCHMARKS[kpi]; if (!b) return 'azul';
    if (b.invertido) { if (valor <= b.bueno) return 'verde'; if (valor >= b.malo) return 'rojo'; return 'amarillo'; }
    if (valor >= b.bueno) return 'verde'; if (valor <= b.malo) return 'rojo'; return 'amarillo';
  };

  const calcular = async () => {
    const k = calcularKPIs(); if (!k) { toast.show("Completa al menos: pedidos, horas y líneas expedidas"); return; }
    setKpis(k); setCargando(true); setInforme("");
    try {
      const { callAnthropicAI } = await import('../services/anthropicService');
      const { text } = await callAnthropicAI({ model: "claude-3-5-sonnet-20240620", max_tokens: 1000, system: "Eres el responsable de logística de Sonepar España.", messages: [{ role: "user", content: `Turno: ${datos.turno} | ${datos.delegacion || "Delegación"}\nPedidos/hora: ${k.pedidos_hora.toFixed(1)} (obj: >18)\nError picking: ${k.error_picking.toFixed(2)}% (obj: <1%)\nTiempo ciclo: ${k.tiempo_ciclo.toFixed(1)}min (obj: <5)\nOcupación: ${k.ocupacion.toFixed(1)}%\nDevoluciones: ${k.devolucion.toFixed(2)}%\nProductividad: ${k.productividad.toFixed(1)}%\n\n3 párrafos: resumen, puntos críticos, acción próxima.` }] });
      setInforme(text || "Error al conectar."); guardarHistorial({ delegacion: datos.delegacion || "Delegación", turno: datos.turno, fecha: new Date().toISOString(), kpis: k, informe: text });
    } catch { setInforme("Error al conectar."); }
    setCargando(false);
  };

  const datosGrafico = historial.slice(0, 7).reverse().map((h, i) => ({ name: `T${i + 1}`, pedidos_hora: parseFloat(h.kpis.pedidos_hora.toFixed(1)) }));

  const CAMPOS = [
    { key: "pedidos", label: "PEDIDOS COMPLETADOS", placeholder: "145" },
    { key: "horas", label: "HORAS DE TURNO", placeholder: "8" },
    { key: "operarios", label: "OPERARIOS EN TURNO", placeholder: "6" },
    { key: "lineas_expedidas", label: "LÍNEAS EXPEDIDAS", placeholder: "420" },
    { key: "errores", label: "ERRORES DE PICKING", placeholder: "3" },
    { key: "tiempo_ciclo", label: "TIEMPO CICLO MEDIO (min)", placeholder: "4.2" },
    { key: "ubicaciones_ocupadas", label: "UBICACIONES OCUPADAS", placeholder: "8750" },
    { key: "ubicaciones_total", label: "UBICACIONES TOTALES", placeholder: "12000" },
    { key: "devoluciones", label: "DEVOLUCIONES", placeholder: "7" },
  ];

  const semaforo = (kpi, valor) => {
    const b = BENCHMARKS[kpi]; if (!b) return null;
    if (b.invertido) { if (valor <= b.bueno) return { label: "Objetivo", color: "var(--success)", bg: "var(--success-soft)" }; if (valor >= b.malo) return { label: "Crítico", color: "var(--error)", bg: "var(--error-soft)" }; return { label: "Atención", color: "var(--warning)", bg: "var(--warning-soft)" }; }
    if (valor >= b.bueno) return { label: "Objetivo", color: "var(--success)", bg: "var(--success-soft)" }; if (valor <= b.malo) return { label: "Crítico", color: "var(--error)", bg: "var(--error-soft)" }; return { label: "Atención", color: "var(--warning)", bg: "var(--warning-soft)" };
  };

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.main__content}>
          <div className={styles.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>📈</span>
              <h1 className={styles.pageTitle}>KPI Logístico</h1>
            </div>
            <p className={styles.pageSubtitle}>Mide y analiza el rendimiento de tu turno logístico</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewToggle__btn} ${tab === 'calculo' ? styles['viewToggle__btn--active'] : ''}`} onClick={() => setTab('calculo')}>Calcular</button>
              <button className={`${styles.viewToggle__btn} ${tab === 'historial' ? styles['viewToggle__btn--active'] : ''}`} onClick={() => setTab('historial')}>Historial</button>
            </div>
          </div>

          {tab === 'calculo' && (
            <>
              {/* Formulario */}
              <div className={styles.formWrapper}>
                <div className={styles.formGrid}>
                  {CAMPOS.map(({ key, label, placeholder }) => (
                    <div key={key} className={styles.formGroup}>
                      <label className={styles.formGroup__label}>{label}</label>
                      <input className={styles.formGroup__input} type="number" step="0.1" placeholder={placeholder} value={datos[key]} onChange={e => setDatos(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className={styles.formGroup}>
                    <label className={styles.formGroup__label}>TURNO</label>
                    <select className={styles.formGroup__input} value={datos.turno} onChange={e => setDatos(p => ({ ...p, turno: e.target.value }))}>
                      <option>Mañana</option><option>Tarde</option><option>Noche</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formGroup__label}>DELEGACIÓN</label>
                    <input className={styles.formGroup__input} placeholder="Sonepar A Coruña" value={datos.delegacion} onChange={e => setDatos(p => ({ ...p, delegacion: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <Button variant="secondary" size="md" onClick={cargarEjemplo}>Cargar ejemplo</Button>
                <Button variant="primary" size="lg" onClick={calcular} loading={cargando}>Calcular KPIs e informe IA →</Button>
              </div>

              {/* KPIs */}
              {kpis && (
                <>
                  <div className={styles.kpiGrid}>
                    {Object.entries(BENCHMARKS).map(([key, b]) => {
                      const valor = kpis[key]; const color = semaforoColor(key, valor);
                      return (
                        <div key={key} className={`${styles.kpiCard} ${styles[`kpiCard--${color}`]}`}>
                          <div className={styles.kpiCard__value} style={{ color: color === 'verde' ? 'var(--success)' : color === 'rojo' ? 'var(--error)' : color === 'amarillo' ? 'var(--warning)' : 'var(--blue-800)' }}>
                            {valor.toFixed(1)}{b.unidad}
                          </div>
                          <div className={styles.kpiCard__label}>{b.label}</div>
                          <div className={styles.kpiCard__benchmark}>Obj: {b.invertido ? `<${b.bueno}` : `>${b.bueno}`}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gráfico */}
                  {datosGrafico.length > 1 && (
                    <div style={{ maxWidth: 500, margin: '0 auto 24px', padding: '16px', background: 'var(--white)', border: '1.5px solid var(--gray-100)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Tendencia pedidos/hora</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={datosGrafico}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <ReferenceLine y={18} stroke="var(--success)" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="pedidos_hora" stroke="var(--blue-800)" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Informe IA */}
                  {informe && (
                    <div className={styles.informeCard}>
                      <div className={styles.informeCard__title}>📝 Informe ejecutivo</div>
                      <div className={styles.informeCard__text} style={{ whiteSpace: 'pre-wrap' }}>{informe}</div>
                    </div>
                  )}
                </>
              )}

              {!kpis && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyState__icon}>📊</div>
                  <div className={styles.emptyState__title}>Introduce los datos del turno</div>
                  <div className={styles.emptyState__text}>Completa los campos superiores y pulsa "Calcular" para obtener los KPIs y el informe IA.</div>
                </div>
              )}
            </>
          )}

          {tab === 'historial' && (
            <div>
              {historial.length > 0 ? (
                <div className={styles.historialList}>
                  {historial.map((h, i) => (
                    <div key={i} className={styles.historialItem} onClick={() => { setDatos({ ...h, pedidos: h.kpis.pedidos_hora * h.horas, horas: h.horas, errores: h.kpis.error_picking * h.kpis.pedidos_hora * h.horas / 100, tiempo_ciclo: h.kpis.tiempo_ciclo, ubicaciones_ocupadas: h.kpis.ocupacion * h.kpis.pedidos_hora * h.horas / 100, ubicaciones_total: 12000, devoluciones: h.kpis.devolucion * h.kpis.pedidos_hora * h.horas / 100, lineas_expedidas: h.kpis.pedidos_hora * h.horas, operarios: h.horas ? h.kpis.pedidos_hora * h.horas / (h.kpis.productividad / 100 * 2.5 * h.horas) : 6 }); setKpis(h.kpis); setInforme(h.informe); setTab('calculo'); }}>
                      <div className={styles.historialItem__header}>
                        <span className={styles.historialItem__delegacion}>{h.delegacion}</span>
                        <span className={styles.historialItem__fecha}>{new Date(h.fecha).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className={styles.historialItem__turno}>{h.turno} · Ped/h: {h.kpis.pedidos_hora.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyState__icon}>📋</div>
                  <div className={styles.emptyState__title}>Sin historial</div>
                  <div className={styles.emptyState__text}>Los informes generados aparecerán aquí.</div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
