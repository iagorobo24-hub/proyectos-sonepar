import { useState, useEffect, useRef } from "react";
import { ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { Label, TipCard } from '../components/ui/CircleLayout';
import styles from './DashboardIncidencias.module.css';

const SEVERIDADES = ["Crítica", "Alta", "Media", "Baja"];
const ESTADOS = ["Abierta", "En diagnóstico", "Resuelta", "Escalada"];
const ZONAS = ["Zona A — Recepción", "Zona B — Almacén alto", "Zona C — Picking", "Zona D — Expedición", "Zona E — Mantenimiento"];

const DEMOS = () => [
  { id: 1, equipo: "Variador ATV320 — Línea 3", zona: "Zona C — Picking", operario: "M. Fernández", sintoma: "El variador se dispara por sobrecalentamiento a los 20 minutos de arranque. Alarma F0028.", severidad: "Crítica", estado: "Abierta", fechaCreacion: Date.now() - 1800000, fechaResolucion: null, observaciones: "", diagnostico: null },
];

const PROMPT_DIAGNOSTICO = (inc) => `Eres un técnico de mantenimiento industrial con 15 años de experiencia en Sonepar España.\nIncidencia: ${inc.equipo}\nZona: ${inc.zona}\nSíntoma: ${inc.sintoma}\nSeveridad: ${inc.severidad}\n\nResponde con JSON: {"causa_probable":"...","pasos_verificacion":["...","...","..."],"solucion":"...","medidas_preventivas":["...","..."]}`;

const SevBadge = ({ sev }) => {
  const cls = { "Crítica": "badge--critica", "Alta": "badge--alta", "Media": "badge--media", "Baja": "badge--baja" };
  return <span className={`${styles.badge} ${styles[cls[sev]] || styles['badge--media']}`}>{sev.toUpperCase()}</span>;
};
const EstBadge = ({ est }) => {
  const cls = { "Abierta": "badge--abierta", "En diagnóstico": "badge--diagnostico", "Resuelta": "badge--resuelta", "Escalada": "badge--escalada" };
  return <span className={`${styles.badge} ${styles[cls[est]] || styles['badge--media']}`}>{est.toUpperCase()}</span>;
};

function ObservacionesEditor({ initial, onSave }) {
  const [texto, setTexto] = useState(initial || "");
  const [editado, setEditado] = useState(false);
  const { toast } = useToast();
  useEffect(() => { setTexto(initial || ""); setEditado(false); }, [initial]);
  const handleSave = () => { onSave(texto); setEditado(false); toast.show('Observación guardada', 'success'); };
  return (
    <div>
      <textarea className={styles.formCard__textarea} value={texto} rows={3} maxLength={500} onChange={e => { setTexto(e.target.value); setEditado(true); }} placeholder="Notas de seguimiento..." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "var(--gray-400)" }}>{texto.length}/500</span>
        {editado && <Button variant="primary" size="sm" onClick={handleSave}>Guardar observación</Button>}
      </div>
    </div>
  );
}

export default function DashboardIncidencias() {
  const { toast } = useToast();
  const [incidencias, setIncidencias] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroSev, setFiltroSev] = useState("Todas");
  const [seleccionada, setSeleccionada] = useState(null);
  const [modo, setModo] = useState("lista");
  const [form, setForm] = useState({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
  const [cargandoIA, setCargandoIA] = useState(false);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    try { const saved = localStorage.getItem("sonepar_incidencias"); setIncidencias(saved ? JSON.parse(saved) : DEMOS()); } catch { setIncidencias(DEMOS()); }
  }, []);

  const guardar = (data) => { setIncidencias(data); try { localStorage.setItem("sonepar_incidencias", JSON.stringify(data)); } catch {} };
  const kpis = {
    criticas: incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta").length,
    abiertas: incidencias.filter(i => i.estado === "Abierta").length,
    enDiag: incidencias.filter(i => i.estado === "En diagnóstico").length,
    resueltas: incidencias.filter(i => i.estado === "Resuelta").length,
  };
  const criticas = incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta" && (ahora - i.fechaCreacion) > 7200000);
  const filtradas = incidencias.filter(i => (filtroEstado === "Todas" || i.estado === filtroEstado) && (filtroSev === "Todas" || i.severidad === filtroSev));

  const cambiarEstado = (id, nuevoEstado) => {
    const data = incidencias.map(i => i.id === id ? { ...i, estado: nuevoEstado, fechaResolucion: nuevoEstado === "Resuelta" ? Date.now() : i.fechaResolucion } : i);
    guardar(data); if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id)); toast.show(`Estado: ${nuevoEstado}`);
  };
  const guardarObservacion = (id, texto) => {
    const data = incidencias.map(i => i.id === id ? { ...i, observaciones: texto } : i);
    guardar(data); if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id)); toast.show("Observación guardada");
  };
  const crearIncidencia = () => {
    if (!form.equipo || !form.operario || !form.sintoma) { toast.show("⚠ Completa todos los campos"); return; }
    const nueva = { ...form, id: Date.now(), estado: "Abierta", fechaCreacion: Date.now(), fechaResolucion: null, observaciones: "", diagnostico: null };
    guardar([nueva, ...incidencias]); setForm({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" }); setModo("lista"); toast.show("Incidencia registrada");
  };
  const generarDiagnostico = async (inc) => {
    setCargandoIA(true);
    try {
      const { callAnthropicAI, parseAIJsonResponse } = await import('../services/anthropicService');
      const { text } = await callAnthropicAI({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: PROMPT_DIAGNOSTICO(inc), messages: [{ role: "user", content: "Diagnostica esta incidencia." }] });
      const diag = parseAIJsonResponse(text, p => p.causa_probable && p.pasos_verificacion);
      if (!diag || diag.error) { toast.show("La IA devolvió una respuesta inválida."); setCargandoIA(false); return; }
      const updated = incidencias.map(i => i.id === inc.id ? { ...i, diagnostico: diag, estado: i.estado === "Abierta" ? "En diagnóstico" : i.estado } : i);
      guardar(updated); setSeleccionada(updated.find(i => i.id === inc.id)); toast.show("Diagnóstico IA generado");
    } catch { toast.show("Error al generar diagnóstico"); }
    setCargandoIA(false);
  };
  const formatTiempo = (ts) => { const min = Math.floor((ahora - ts) / 60000); if (min < 60) return `Hace ${min}m`; const h = Math.floor(min / 60); if (h < 24) return `Hace ${h}h`; return `Hace ${Math.floor(h / 24)}d`; };

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.main__content}>
          <div className={styles.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>🛡️</span>
              <h1 className={styles.pageTitle}>Dashboard Incidencias</h1>
            </div>
            <p className={styles.pageSubtitle}>Registra, diagnostica y resuelve incidencias de equipos industriales</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewToggle__btn} ${modo === 'lista' ? styles['viewToggle__btn--active'] : ''}`} onClick={() => setModo('lista')}>Lista</button>
              <button className={`${styles.viewToggle__btn} ${modo === 'nueva' ? styles['viewToggle__btn--active'] : ''}`} onClick={() => setModo('nueva')}>Nueva</button>
            </div>
          </div>

          {/* Alerta crítica */}
          {criticas.length > 0 && (
            <div className={styles.alertBanner}>
              <div className={styles.alertBanner__title}>⚠ {criticas.length} incidencia{criticas.length > 1 ? "s" : ""} crítica{criticas.length > 1 ? "s" : ""} sin atender +2h</div>
              <div className={styles.alertBanner__text}>{criticas.map(i => i.equipo.split("—")[0].trim()).join(" · ")}</div>
            </div>
          )}

          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {[{ label: "Críticas", valor: kpis.criticas, cls: kpis.criticas > 0 ? 'kpiCard--critico' : '' }, { label: "Abiertas", valor: kpis.abiertas }, { label: "Diagnóstico", valor: kpis.enDiag }, { label: "Resueltas", valor: kpis.resueltas }].map(({ label, valor, cls }) => (
              <div key={label} className={`${styles.kpiCard} ${cls || ''}`}>
                <div className={styles.kpiCard__value}>{valor}</div>
                <div className={styles.kpiCard__label}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── NUEVA INCIDENCIA ── */}
          {modo === 'nueva' && (
            <div className={styles.formCard}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Registrar nueva incidencia</h3>
              <div className={styles.formCard__group}>
                <label className={styles.formCard__label}>Equipo / Referencia</label>
                <Input value={form.equipo} onChange={e => setForm(p => ({ ...p, equipo: e.target.value }))} placeholder="Variador ATV320..." />
              </div>
              <div className={styles.formCard__group}>
                <label className={styles.formCard__label}>Operario que reporta</label>
                <Input value={form.operario} onChange={e => setForm(p => ({ ...p, operario: e.target.value }))} placeholder="Nombre del operario" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formCard__group}>
                  <label className={styles.formCard__label}>Zona</label>
                  <select className={styles.formCard__select} value={form.zona} onChange={e => setForm(p => ({ ...p, zona: e.target.value }))}>{ZONAS.map(z => <option key={z}>{z}</option>)}</select>
                </div>
                <div className={styles.formCard__group}>
                  <label className={styles.formCard__label}>Severidad</label>
                  <select className={styles.formCard__select} value={form.severidad} onChange={e => setForm(p => ({ ...p, severidad: e.target.value }))}>{SEVERIDADES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
              </div>
              <div className={styles.formCard__group}>
                <label className={styles.formCard__label}>Síntoma</label>
                <textarea className={styles.formCard__textarea} value={form.sintoma} rows={4} placeholder="Describe el síntoma con detalle..." onChange={e => setForm(p => ({ ...p, sintoma: e.target.value }))} />
              </div>
              <Button variant="primary" size="md" onClick={crearIncidencia} style={{ width: '100%' }}>Registrar incidencia</Button>
            </div>
          )}

          {/* ── LISTA + DETALLE ── */}
          {modo === 'lista' && (
            <div style={{ display: seleccionada && modo !== 'nueva' ? 'grid' : 'flex', gridTemplateColumns: seleccionada && modo !== 'nueva' ? '1fr 1fr' : '1fr', gap: '24px' }}>
              {/* Lista */}
              <div>
                {/* Filtros */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Estado</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {["Todas", ...ESTADOS].map(e => (
                        <button key={e} className={`${styles.badge} ${filtroEstado === e ? 'badge--abierta' : ''}`} style={{ background: filtroEstado === e ? 'var(--blue-50)' : 'var(--gray-50)', color: filtroEstado === e ? 'var(--blue-800)' : 'var(--gray-400)', border: 'none', cursor: 'pointer', padding: '4px 10px' }} onClick={() => setFiltroEstado(e)}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Severidad</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {["Todas", ...SEVERIDADES].map(s => (
                        <button key={s} className={styles.badge} style={{ background: filtroSev === s ? 'var(--blue-50)' : 'var(--gray-50)', color: filtroSev === s ? 'var(--blue-800)' : 'var(--gray-400)', border: 'none', cursor: 'pointer', padding: '4px 10px' }} onClick={() => setFiltroSev(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.incidenciasList}>
                  {filtradas.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyState__icon}>🔍</div>
                      <div className={styles.emptyState__title}>Sin incidencias</div>
                      <div className={styles.emptyState__text}>No hay incidencias con estos filtros</div>
                    </div>
                  ) : (
                    filtradas.map((inc) => (
                      <button key={inc.id} className={styles.incidenciaItem} onClick={() => { setSeleccionada(inc); }} style={{ borderColor: seleccionada?.id === inc.id ? 'var(--blue-200)' : 'var(--gray-100)' }}>
                        <div className={styles.incidenciaItem__info}>
                          <div className={styles.incidenciaItem__equipo}>{inc.equipo}</div>
                          <div className={styles.incidenciaItem__sintoma}>{inc.sintoma.slice(0, 80)}{inc.sintoma.length > 80 ? "..." : ""}</div>
                          <div className={styles.incidenciaItem__meta}>{inc.zona.split("—")[0].trim()} · {formatTiempo(inc.fechaCreacion)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <SevBadge sev={inc.severidad} />
                          <EstBadge est={inc.estado} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Detalle */}
              {seleccionada && modo === 'lista' && (
                <div>
                  <button onClick={() => setSeleccionada(null)} style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>← Volver a la lista</button>
                  <div className={styles.detalleCard}>
                    <div className={styles.detalleCard__header}>
                      <div>
                        <span className={styles.badge} style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>INCIDENCIA #{seleccionada.id.toString().slice(-4)}</span>
                        <div className={styles.detalleCard__title} style={{ marginTop: '8px' }}>{seleccionada.equipo}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}><SevBadge sev={seleccionada.severidad} /><EstBadge est={seleccionada.estado} /></div>
                      </div>
                    </div>

                    <div className={styles.detalleCard__section}>
                      <div className={styles.detalleCard__label}>Síntoma</div>
                      <div className={styles.detalleCard__text}>{seleccionada.sintoma}</div>
                    </div>

                    <div className={styles.detalleCard__section}>
                      <div className={styles.detalleCard__label}>Cambiar estado</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ESTADOS.filter(e => e !== seleccionada.estado).map(e => (
                          <Button key={e} variant="secondary" size="sm" onClick={() => cambiarEstado(seleccionada.id, e)}>{e}</Button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.detalleCard__section}>
                      <div className={styles.detalleCard__label}>Observaciones</div>
                      <ObservacionesEditor initial={seleccionada.observaciones} onSave={(texto) => guardarObservacion(seleccionada.id, texto)} />
                    </div>

                    {/* Diagnóstico IA */}
                    <div className={styles.detalleCard__section}>
                      <div className={styles.detalleCard__label}>Diagnóstico IA</div>
                      {!seleccionada.diagnostico ? (
                        <Button variant="primary" size="md" onClick={() => generarDiagnostico(seleccionada)} loading={cargandoIA} style={{ width: '100%' }}>
                          {cargandoIA ? "Analizando..." : "Generar diagnóstico IA"}
                        </Button>
                      ) : (
                        <div className={styles.diagnosticoCard}>
                          <div className={styles.diagnosticoCard__item}>
                            <div className={styles.diagnosticoCard__itemLabel}>Causa probable</div>
                            <div className={styles.diagnosticoCard__itemText}>{seleccionada.diagnostico.causa_probable}</div>
                          </div>
                          <div className={styles.diagnosticoCard__item}>
                            <div className={styles.diagnosticoCard__itemLabel}>Pasos de verificación</div>
                            <ul className={styles.diagnosticoCard__steps}>
                              {seleccionada.diagnostico.pasos_verificacion?.map((item, i) => (
                                <li key={i} className={styles.diagnosticoCard__step}><span className={styles.diagnosticoCard__stepNum}>{i + 1}</span><span>{item}</span></li>
                              ))}
                            </ul>
                          </div>
                          <div className={styles.diagnosticoCard__item}>
                            <div className={styles.diagnosticoCard__itemLabel}>Solución</div>
                            <div className={styles.diagnosticoCard__itemText}>{seleccionada.diagnostico.solucion}</div>
                          </div>
                          <div className={styles.diagnosticoCard__item}>
                            <div className={styles.diagnosticoCard__itemLabel}>Medidas preventivas</div>
                            <ul className={styles.diagnosticoCard__steps}>
                              {seleccionada.diagnostico.medidas_preventivas?.map((item, i) => (
                                <li key={i} className={styles.diagnosticoCard__step}><span className={styles.diagnosticoCard__stepNum}>{i + 1}</span><span>{item}</span></li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estado vacío sin incidencias */}
          {modo === 'lista' && incidencias.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyState__icon}>🛡️</div>
              <div className={styles.emptyState__title}>Sin incidencias</div>
              <div className={styles.emptyState__text}>No hay incidencias registradas. Crea una nueva o cambia a la pestaña "Nueva".</div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
