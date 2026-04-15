import { useState, useEffect } from "react";
import { GraduationCap } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './FormacionInterna.module.css'

const AREAS = ["Almacén", "Comercial", "Técnico", "Seguridad", "Sistemas"];
const ROLES = ["Operario", "Técnico", "Comercial", "Responsable"];

const MODULOS_INIT = [
  { id: "m1", nombre: "Recepción de mercancía", area: "Almacén", horas: 4, obligatorio: true },
  { id: "m2", nombre: "Gestión de ubicaciones WMS", area: "Almacén", horas: 6, obligatorio: true },
  { id: "m3", nombre: "Proceso de picking", area: "Almacén", horas: 5, obligatorio: true },
  { id: "m4", nombre: "Expedición y embalaje", area: "Almacén", horas: 3, obligatorio: true },
  { id: "m5", nombre: "Atención al cliente B2B", area: "Comercial", horas: 8, obligatorio: false },
  { id: "m6", nombre: "Catálogo eléctrico industrial", area: "Técnico", horas: 12, obligatorio: false },
  { id: "m7", nombre: "PRL — Almacén logístico", area: "Seguridad", horas: 8, obligatorio: true },
];

const EMPLEADOS_INIT = () => [
  { id: "e1", nombre: "María Fernández", rol: "Operario", departamento: "Almacén", fechaAlta: Date.now() - 5184000000 },
];

const progresoInicial = (modulos) => Object.fromEntries(modulos.map(m => [m.id, "pendiente"]));

const PROMPT_PLAN = (emp, modulos, progreso) => {
  const completados = modulos.filter(m => progreso[m.id] === "completado").map(m => m.nombre);
  const pendientes = modulos.filter(m => progreso[m.id] === "pendiente").map(m => m.nombre);
  return `Eres el responsable de formación de Sonepar España.\nEmpleado: ${emp.nombre} — ${emp.rol}\nCompletados: ${completados.join(", ") || "ninguno"}\nPendientes: ${pendientes.join(", ") || "ninguno"}\n\nPlan en 3 párrafos: (1) valoración, (2) módulos prioritarios, (3) recomendación semanal.`;
};

export default function FormacionInterna() {
  const { toast } = useToast();
  const [empleados, setEmpleados] = useState([]);
  const [modulos, setModulos] = useState(MODULOS_INIT);
  const [progresos, setProgresos] = useState({});
  const [fechasCompletado, setFechasCompletado] = useState({});
  const [seleccionado, setSeleccionado] = useState(null);
  const [vista, setVista] = useState("dashboard");
  const [planIA, setPlanIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [formModulo, setFormModulo] = useState({ nombre: "", area: AREAS[0], horas: "4", obligatorio: false });
  const [formEmpleado, setFormEmpleado] = useState({ nombre: "", rol: ROLES[0], departamento: "" });

  useEffect(() => {
    try {
      const emp = localStorage.getItem("sonepar_formacion_empleados");
      const prg = localStorage.getItem("sonepar_formacion_progresos");
      const fec = localStorage.getItem("sonepar_formacion_fechas");
      const emps = emp ? JSON.parse(emp) : EMPLEADOS_INIT();
      const prgs = prg ? JSON.parse(prg) : {};
      const fecs = fec ? JSON.parse(fec) : {};
      const prgsCompleto = {};
      emps.forEach(e => { prgsCompleto[e.id] = {}; MODULOS_INIT.forEach(m => { prgsCompleto[e.id][m.id] = prgs[e.id]?.[m.id] || "pendiente"; }); });
      setEmpleados(emps); setProgresos(prgsCompleto); setFechasCompletado(fecs);
    } catch {
      const emps = EMPLEADOS_INIT();
      setEmpleados(emps);
      const prgs = {}; emps.forEach(e => { prgs[e.id] = progresoInicial(MODULOS_INIT); });
      setProgresos(prgs);
    }
  }, []);

  const guardar = (emps, prgs, fecs) => {
    try { localStorage.setItem("sonepar_formacion_empleados", JSON.stringify(emps)); localStorage.setItem("sonepar_formacion_progresos", JSON.stringify(prgs)); localStorage.setItem("sonepar_formacion_fechas", JSON.stringify(fecs)); } catch {}
  };

  const cambiarProgreso = (empId, modId, nuevoEstado) => {
    const nuevosProgresos = { ...progresos, [empId]: { ...progresos[empId], [modId]: nuevoEstado } };
    const nuevasFechas = { ...fechasCompletado };
    if (nuevoEstado === "completado") { if (!nuevasFechas[empId]) nuevasFechas[empId] = {}; nuevasFechas[empId][modId] = Date.now(); }
    else { if (nuevasFechas[empId]) delete nuevasFechas[empId][modId]; }
    setProgresos(nuevosProgresos); setFechasCompletado(nuevasFechas); guardar(empleados, nuevosProgresos, nuevasFechas); toast.show("Progreso actualizado");
  };

  const añadirModulo = () => {
    if (!formModulo.nombre) return;
    const nuevo = { id: `m${Date.now()}`, ...formModulo, horas: parseInt(formModulo.horas) || 4, custom: true };
    const nuevos = [...modulos, nuevo];
    const nuevosProgresos = { ...progresos };
    empleados.forEach(e => { nuevosProgresos[e.id] = { ...nuevosProgresos[e.id], [nuevo.id]: "pendiente" }; });
    setModulos(nuevos); setProgresos(nuevosProgresos); guardar(empleados, nuevosProgresos, fechasCompletado); setFormModulo({ nombre: "", area: AREAS[0], horas: "4", obligatorio: false }); toast.show(`Módulo "${nuevo.nombre}" añadido`);
  };

  const añadirEmpleado = () => {
    if (!formEmpleado.nombre || !formEmpleado.departamento) return;
    const nuevo = { id: `e${Date.now()}`, ...formEmpleado, fechaAlta: Date.now() };
    const nuevos = [...empleados, nuevo];
    setEmpleados(nuevos); setProgresos({ ...progresos, [nuevo.id]: progresoInicial(modulos) }); guardar(nuevos, { ...progresos, [nuevo.id]: progresoInicial(modulos) }, fechasCompletado); setFormEmpleado({ nombre: "", rol: ROLES[0], departamento: "" }); toast.show(`Empleado "${nuevo.nombre}" añadido`);
  };

  const generarPlan = async (emp) => {
    setCargandoIA(true); setPlanIA("");
    try {
      const { callAnthropicAI } = await import('../services/anthropicService');
      const { text } = await callAnthropicAI({ model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: "Eres el responsable de formación de Sonepar España.", messages: [{ role: "user", content: PROMPT_PLAN(emp, modulos, progresos[emp.id] || {}) }] });
      setPlanIA(text || "Error al generar el plan.");
    } catch { setPlanIA("Error al generar el plan."); }
    setCargandoIA(false);
  };

  const totalPosible = empleados.length * modulos.length;
  const completadosGlobal = empleados.reduce((acc, e) => acc + modulos.filter(m => progresos[e.id]?.[m.id] === "completado").length, 0);
  const pctGlobal = totalPosible > 0 ? Math.round((completadosGlobal / totalPosible) * 100) : 0;
  const empleadosAlerta = empleados.filter(e => { const dias = (Date.now() - e.fechaAlta) / 86400000; return dias > 30 && modulos.filter(m => m.obligatorio && progresos[e.id]?.[m.id] !== "completado").length > 0; });
  const pctEmpleado = (empId) => { if (!modulos.length) return 0; return Math.round(modulos.filter(m => progresos[empId]?.[m.id] === "completado").length / modulos.length * 100); };

  const estadoBadge = (estado) => {
    const map = { completado: 'badge--completado', en_curso: 'badge--en_curso', pendiente: 'badge--pendiente' };
    return <span className={`${styles.badge} ${styles[map[estado]] || styles['badge--pendiente']}`}>{estado === 'en_curso' ? 'EN CURSO' : estado === 'completado' ? 'COMPLETADO' : 'PENDIENTE'}</span>;
  };

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.main__content}>
          <div className={styles.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>🎓</span>
              <h1 className={styles.pageTitle}>Formación Interna</h1>
            </div>
            <p className={styles.pageSubtitle}>Gestiona la formación del equipo por empleado</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewToggle__btn} ${vista === 'dashboard' ? styles['viewToggle__btn--active'] : ''}`} onClick={() => { setVista('dashboard'); setSeleccionado(null); }}>Equipo</button>
              <button className={`${styles.viewToggle__btn} ${vista === 'ajustes' ? styles['viewToggle__btn--active'] : ''}`} onClick={() => setVista('ajustes')}>Ajustes</button>
            </div>
          </div>

          {/* Alerta */}
          {empleadosAlerta.length > 0 && (
            <div className={styles.alertBanner}>
              <div className={styles.alertBanner__title}>⚠ {empleadosAlerta.length} empleado{empleadosAlerta.length > 1 ? 's' : ''} con módulos obligatorios pendientes</div>
              <div className={styles.alertBanner__text}>{empleadosAlerta.map(e => e.nombre.split(' ')[0]).join(' · ')}</div>
            </div>
          )}

          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {[{ label: "Progreso global", valor: `${pctGlobal}%` }, { label: "Empleados", valor: empleados.length }, { label: "Módulos", valor: modulos.length }, { label: "Con alerta", valor: empleadosAlerta.length }].map(({ label, valor }) => (
              <div key={label} className={styles.kpiCard}>
                <div className={styles.kpiCard__value}>{valor}</div>
                <div className={styles.kpiCard__label}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── DASHBOARD ─ */}
          {vista === 'dashboard' && (
            <>
              <div className={styles.empleadosGrid}>
                {empleados.map(emp => {
                  const pct = pctEmpleado(emp.id);
                  const dias = Math.floor((Date.now() - emp.fechaAlta) / 86400000);
                  const obligPend = modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] !== "completado").length;
                  const alerta = dias > 30 && obligPend > 0;
                  return (
                    <button key={emp.id} className={styles.empleadoCard} onClick={() => { setSeleccionado(emp); setPlanIA(""); setVista('detalle'); }} style={{ borderColor: alerta ? 'var(--warning)' : 'var(--gray-100)' }}>
                      <div className={styles.empleadoCard__header}>
                        <div>
                          <div className={styles.empleadoCard__nombre}>{emp.nombre}</div>
                          <div className={styles.empleadoCard__meta}>{emp.rol} · {emp.departamento} · {dias}d</div>
                        </div>
                        <div className={styles.empleadoCard__pct}>{pct}%</div>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressBar__fill} style={{ width: `${pct}%` }} />
                      </div>
                      {alerta && <span className={styles.badge} style={{ background: 'var(--warning-soft)', color: 'var(--warning)', fontSize: '0.625rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>ALERTA</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── DETALLE EMPLEADO ─ */}
          {vista === 'detalle' && seleccionado && (
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <button onClick={() => setVista('dashboard')} style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>← Volver al equipo</button>

              <div className={styles.detalleHeader}>
                <div className={styles.detalleHeader__info}>
                  <div className={styles.detalleHeader__nombre}>{seleccionado.nombre}</div>
                  <div className={styles.detalleHeader__meta}>{seleccionado.rol} · {seleccionado.departamento} · Alta hace {Math.floor((Date.now() - seleccionado.fechaAlta) / 86400000)} días</div>
                </div>
                <div className={styles.detalleHeader__pct}>{pctEmpleado(seleccionado.id)}%</div>
              </div>

              {/* Módulos por área */}
              {AREAS.map(area => {
                const modsArea = modulos.filter(m => m.area === area);
                if (!modsArea.length) return null;
                return (
                  <div key={area} className={styles.modulosSection}>
                    <div className={styles.modulosSection__title}>{area}</div>
                    {modsArea.map(mod => {
                      const estado = progresos[seleccionado.id]?.[mod.id] || "pendiente";
                      const fechaComp = fechasCompletado[seleccionado.id]?.[mod.id];
                      return (
                        <div key={mod.id} className={styles.moduloCard}>
                          <div className={styles.moduloCard__info}>
                            <div className={styles.moduloCard__nombre}>{mod.nombre} {mod.obligatorio && <span className={styles.badge} style={{ background: 'var(--blue-50)', color: 'var(--blue-800)', fontSize: '0.625rem', fontWeight: 600, padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>OBL</span>}</div>
                            <div className={styles.moduloCard__meta}>{mod.horas}h {fechaComp ? `· Completado: ${new Date(fechaComp).toLocaleDateString('es-ES')}` : ''}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {estadoBadge(estado)}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {['pendiente', 'en_curso', 'completado'].filter(s => s !== estado).map(s => (
                                <Button key={s} variant="secondary" size="sm" onClick={() => cambiarProgreso(seleccionado.id, mod.id, s)}>{s === 'en_curso' ? 'En curso' : s === 'completado' ? 'Completar' : 'Pendiente'}</Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Plan IA */}
              <div className={styles.planCard}>
                <div className={styles.planCard__title}>📝 Plan de desarrollo IA</div>
                {!planIA ? (
                  <Button variant="primary" size="md" onClick={() => generarPlan(seleccionado)} loading={cargandoIA} style={{ width: '100%' }}>Generar plan de desarrollo</Button>
                ) : (
                  <div>
                    <div className={styles.planCard__text}>{planIA}</div>
                    <Button variant="secondary" size="sm" onClick={() => generarPlan(seleccionado)} loading={cargandoIA} style={{ marginTop: '12px' }}>Regenerar</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AJUSTES ─ */}
          {vista === 'ajustes' && (
            <>
              <div className={styles.formCard} style={{ maxWidth: 500, margin: '0 auto 24px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>Añadir módulo</h3>
                <div className={styles.formCard__group}>
                  <label className={styles.formCard__label}>Nombre del módulo</label>
                  <input className={styles.formCard__input} value={formModulo.nombre} onChange={e => setFormModulo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del módulo" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formCard__group}>
                    <label className={styles.formCard__label}>Área</label>
                    <select className={styles.formCard__select} value={formModulo.area} onChange={e => setFormModulo(p => ({ ...p, area: e.target.value }))}>{AREAS.map(a => <option key={a}>{a}</option>)}</select>
                  </div>
                  <div className={styles.formCard__group}>
                    <label className={styles.formCard__label}>Horas</label>
                    <input className={styles.formCard__input} type="number" value={formModulo.horas} onChange={e => setFormModulo(p => ({ ...p, horas: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input type="checkbox" id="oblig" checked={formModulo.obligatorio} onChange={e => setFormModulo(p => ({ ...p, obligatorio: e.target.checked }))} />
                  <label htmlFor="oblig" style={{ fontSize: '0.8125rem', color: 'var(--gray-700)', cursor: 'pointer' }}>Módulo obligatorio</label>
                </div>
                <Button variant="primary" size="md" onClick={añadirModulo} style={{ width: '100%' }}>Añadir módulo</Button>
              </div>

              <div className={styles.formCard} style={{ maxWidth: 500, margin: '0 auto' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>Añadir empleado</h3>
                <div className={styles.formCard__group}>
                  <label className={styles.formCard__label}>Nombre completo</label>
                  <input className={styles.formCard__input} value={formEmpleado.nombre} onChange={e => setFormEmpleado(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre completo" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formCard__group}>
                    <label className={styles.formCard__label}>Departamento</label>
                    <input className={styles.formCard__input} value={formEmpleado.departamento} onChange={e => setFormEmpleado(p => ({ ...p, departamento: e.target.value }))} placeholder="Departamento" />
                  </div>
                  <div className={styles.formCard__group}>
                    <label className={styles.formCard__label}>Rol</label>
                    <select className={styles.formCard__select} value={formEmpleado.rol} onChange={e => setFormEmpleado(p => ({ ...p, rol: e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
                  </div>
                </div>
                <Button variant="primary" size="md" onClick={añadirEmpleado} style={{ width: '100%', marginTop: '8px' }}>Añadir empleado</Button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
