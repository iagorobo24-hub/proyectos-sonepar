import { useState, useEffect } from "react";
import { GraduationCap } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import WelcomeState from '../components/ui/WelcomeState'
import { useToast } from '../contexts/ToastContext'
import styles from './FormacionInterna.module.css'

const AREAS = ["Almacén", "Comercial", "Técnico", "Seguridad", "Sistemas"];
const ROLES = ["Operario", "Técnico", "Comercial", "Responsable"];

const MODULOS_INIT = [
  { id: "m1",  nombre: "Recepción de mercancía",        area: "Almacén",    horas: 4,  obligatorio: true  },
  { id: "m2",  nombre: "Gestión de ubicaciones WMS",    area: "Almacén",    horas: 6,  obligatorio: true  },
  { id: "m3",  nombre: "Proceso de picking",            area: "Almacén",    horas: 5,  obligatorio: true  },
  { id: "m4",  nombre: "Expedición y embalaje",         area: "Almacén",    horas: 3,  obligatorio: true  },
  { id: "m5",  nombre: "Atención al cliente B2B",       area: "Comercial",  horas: 8,  obligatorio: false },
  { id: "m6",  nombre: "Catálogo eléctrico industrial", area: "Técnico",    horas: 12, obligatorio: false },
  { id: "m7",  nombre: "PRL — Almacén logístico",       area: "Seguridad",  horas: 8,  obligatorio: true  },
  { id: "m8",  nombre: "ERP — Consulta de stock",       area: "Sistemas",   horas: 4,  obligatorio: false },
  { id: "m9",  nombre: "Vehículo eléctrico y carga",    area: "Técnico",    horas: 6,  obligatorio: false },
];

const EMPLEADOS_INIT = () => [
  { id: "e1", nombre: "María Fernández",  rol: "Operario",    departamento: "Almacén",   fechaAlta: Date.now() - 5184000000 },
  { id: "e2", nombre: "Alejandro López",  rol: "Técnico",     departamento: "Mostrador", fechaAlta: Date.now() - 2592000000 },
  { id: "e3", nombre: "Roberto Martínez", rol: "Operario",    departamento: "Almacén",   fechaAlta: Date.now() - 7776000000 },
  { id: "e4", nombre: "Carmen González",  rol: "Comercial",   departamento: "Ventas",    fechaAlta: Date.now() - 1296000000 },
  { id: "e5", nombre: "José Rodríguez",   rol: "Responsable", departamento: "Logística", fechaAlta: Date.now() - 10368000000 },
];

const progresoInicial = (modulos) => Object.fromEntries(modulos.map(m => [m.id, "pendiente"]));

const PROMPT_PLAN = (emp, modulos, progreso) => {
  const completados = modulos.filter(m => progreso[m.id] === "completado").map(m => m.nombre);
  const enCurso    = modulos.filter(m => progreso[m.id] === "en_curso").map(m => m.nombre);
  const pendientes = modulos.filter(m => progreso[m.id] === "pendiente").map(m => m.nombre);
  return `Eres el responsable de formación de una delegación de Sonepar España. Genera un plan de desarrollo personalizado.\n\nEmpleado: ${emp.nombre} — ${emp.rol} — ${emp.departamento}\nCompletados: ${completados.join(", ") || "ninguno"}\nEn curso: ${enCurso.join(", ") || "ninguno"}\nPendientes: ${pendientes.join(", ") || "ninguno"}\n\nGenera un plan en 3 párrafos: (1) valoración del progreso actual, (2) módulos prioritarios a completar y por qué, (3) recomendación de siguiente paso concreto esta semana. Tono directo y motivador.`;
};

// ── Badge de estado ────────────────────────────────────────────────────────
const Badge = ({ estado }) => {
  const estadoClass = {
    completado: styles.badgeCompletado,
    en_curso:   styles.badgeEnCurso,
    pendiente:  styles.badgePendiente,
  };
  return (
    <span className={`${styles.badge} ${estadoClass[estado] || styles.badgePendiente}`}>
      {estado === "en_curso" ? "EN CURSO" : estado === "completado" ? "COMPLETADO" : "PENDIENTE"}
    </span>
  );
};

// ── Barra de progreso ──────────────────────────────────────────────────────
const ProgressBar = ({ pct }) => {
  const color = pct >= 70 ? "var(--color-brand)" : pct >= 40 ? "var(--color-text)" : "var(--color-text-2)";
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressBarHeader}>
        <span className={styles.progressBarLabel}>Progreso</span>
        <span className={styles.progressBarValue}>{pct}%</span>
      </div>
      <div className={styles.progressBarTrack}>
        <div 
          className={styles.progressBarFill}
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
        />
      </div>
    </div>
  );
};

export default function FormacionInterna() {
  const { toast } = useToast();
  const [empleados, setEmpleados] = useState([]);
  const [modulos, setModulos] = useState([]);
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
      const mod = localStorage.getItem("sonepar_formacion_modulos");
      const prg = localStorage.getItem("sonepar_formacion_progresos");
      const fec = localStorage.getItem("sonepar_formacion_fechas");
      const mods = mod ? JSON.parse(mod) : MODULOS_INIT;
      const emps = emp ? JSON.parse(emp) : EMPLEADOS_INIT();
      const prgs = prg ? JSON.parse(prg) : {};
      const fecs = fec ? JSON.parse(fec) : {};
      const prgsCompleto = {};
      emps.forEach(e => {
        prgsCompleto[e.id] = {};
        mods.forEach(m => { prgsCompleto[e.id][m.id] = prgs[e.id]?.[m.id] || "pendiente"; });
      });
      setModulos(mods); setEmpleados(emps); setProgresos(prgsCompleto); setFechasCompletado(fecs);
    } catch {
      const mods = MODULOS_INIT, emps = EMPLEADOS_INIT();
      setModulos(mods); setEmpleados(emps);
      const prgs = {};
      emps.forEach(e => { prgs[e.id] = progresoInicial(mods); });
      setProgresos(prgs);
    }
  }, []);

  const guardar = (emps, mods, prgs, fecs) => {
    try {
      localStorage.setItem("sonepar_formacion_empleados", JSON.stringify(emps));
      localStorage.setItem("sonepar_formacion_modulos", JSON.stringify(mods));
      localStorage.setItem("sonepar_formacion_progresos", JSON.stringify(prgs));
      localStorage.setItem("sonepar_formacion_fechas", JSON.stringify(fecs));
    } catch {}
  };

  const cambiarProgreso = (empId, modId, nuevoEstado) => {
    const nuevosProgresos = { ...progresos, [empId]: { ...progresos[empId], [modId]: nuevoEstado } };
    const nuevasFechas = { ...fechasCompletado };
    if (nuevoEstado === "completado") {
      if (!nuevasFechas[empId]) nuevasFechas[empId] = {};
      nuevasFechas[empId][modId] = Date.now();
    } else {
      if (nuevasFechas[empId]) delete nuevasFechas[empId][modId];
    }
    setProgresos(nuevosProgresos); setFechasCompletado(nuevasFechas);
    guardar(empleados, modulos, nuevosProgresos, nuevasFechas);
    toast.show("Progreso actualizado");
  };

  const añadirModulo = () => {
    if (!formModulo.nombre) return;
    const nuevo = { id: `m${Date.now()}`, ...formModulo, horas: parseInt(formModulo.horas) || 4, custom: true };
    const nuevos = [...modulos, nuevo];
    const nuevosProgresos = { ...progresos };
    empleados.forEach(e => { nuevosProgresos[e.id] = { ...nuevosProgresos[e.id], [nuevo.id]: "pendiente" }; });
    setModulos(nuevos); setProgresos(nuevosProgresos);
    guardar(empleados, nuevos, nuevosProgresos, fechasCompletado);
    setFormModulo({ nombre: "", area: AREAS[0], horas: "4", obligatorio: false });
    toast.show(`Módulo "${nuevo.nombre}" añadido`);
  };

  const añadirEmpleado = () => {
    if (!formEmpleado.nombre || !formEmpleado.departamento) return;
    const nuevo = { id: `e${Date.now()}`, ...formEmpleado, fechaAlta: Date.now() };
    const nuevos = [...empleados, nuevo];
    const nuevosProgresos = { ...progresos, [nuevo.id]: progresoInicial(modulos) };
    setEmpleados(nuevos); setProgresos(nuevosProgresos);
    guardar(nuevos, modulos, nuevosProgresos, fechasCompletado);
    setFormEmpleado({ nombre: "", rol: ROLES[0], departamento: "" });
    toast.show(`Empleado "${nuevo.nombre}" añadido`);
  };

  const generarPlan = async (emp) => {
    setCargandoIA(true); setPlanIA("");
    try {
      const res = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_PLAN(emp, modulos, progresos[emp.id] || {}) }],
        }),
      });
      const data = await res.json();
      setPlanIA(data.content?.map(i => i.text || "").join("") || "");
    } catch { setPlanIA("Error al generar el plan."); }
    setCargandoIA(false);
  };

  // KPIs globales
  const totalPosible = empleados.length * modulos.length;
  const completadosGlobal = empleados.reduce((acc, e) =>
    acc + modulos.filter(m => progresos[e.id]?.[m.id] === "completado").length, 0);
  const pctGlobal = totalPosible > 0 ? Math.round((completadosGlobal / totalPosible) * 100) : 0;
  const empleadosAlerta = empleados.filter(e => {
    const dias = (Date.now() - e.fechaAlta) / 86400000;
    return dias > 30 && modulos.filter(m => m.obligatorio && progresos[e.id]?.[m.id] !== "completado").length > 0;
  });
  const pctEmpleado = (empId) => {
    const total = modulos.length;
    if (!total) return 0;
    return Math.round(modulos.filter(m => progresos[empId]?.[m.id] === "completado").length / total * 100);
  };
  const hrasArea = (area) => empleados.reduce((acc, e) =>
    acc + modulos.filter(m => m.area === area && progresos[e.id]?.[m.id] === "completado").reduce((s, m) => s + m.horas, 0), 0);

  return (
    <div className={styles.layout}>
      {/* ── Panel izquierdo — lista y filtros ── */}
      <div className={styles.panelBusqueda}>
        {/* Tabs DASHBOARD / MATRIZ / AJUSTES */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.tab} ${vista === 'dashboard' ? styles.tabActivo : ''}`}
            onClick={() => setVista('dashboard')}
          >
            Equipo
          </button>
          <button
            className={`${styles.tab} ${vista === 'matriz' ? styles.tabActivo : ''}`}
            onClick={() => setVista('matriz')}
          >
            Matriz
          </button>
          <button
            className={`${styles.tab} ${vista === 'ajustes' ? styles.tabActivo : ''}`}
            onClick={() => setVista('ajustes')}
          >
            Ajustes
          </button>
        </div>

        {/* Alerta obligatorios */}
        {empleadosAlerta.length > 0 && (
          <div className={styles.seccion} style={{ background: 'var(--color-surface)', borderLeft: '3px solid var(--color-brand)', margin: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)', marginBottom: 4 }}>⚠ ALERTA</div>
            <div style={{ fontSize: 11, color: 'var(--color-text)', marginBottom: 2 }}>
              {empleadosAlerta.length} empleado{empleadosAlerta.length > 1 ? "s" : ""} con módulos obligatorios pendientes
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-2)' }}>
              {empleadosAlerta.map(e => e.nombre.split(" ")[0]).join(" · ")}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>Resumen</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Progreso global", valor: `${pctGlobal}%` },
              { label: "Empleados", valor: empleados.length },
              { label: "Módulos", valor: modulos.length },
              { label: "Con alerta", valor: empleadosAlerta.length },
            ].map(({ label, valor }) => (
              <div key={label} className={styles.card} style={{ padding: "12px" }}>
                <div style={{ fontSize: 9, color: "var(--color-text-2)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)" }}>{valor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Horas por área */}
        {vista === 'dashboard' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Horas por área</div>
            {AREAS.map(area => (
              <div key={area} className={styles.card} style={{ padding: "10px", marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: "var(--color-text-2)", marginBottom: 2 }}>
                  {area.toUpperCase()}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)" }}>{hrasArea(area)}h</div>
              </div>
            ))}
          </div>
        )}

        {/* Lista empleados */}
        {vista === 'dashboard' && (
          <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
            {empleados.map(emp => {
              const pct = pctEmpleado(emp.id);
              const dias = Math.floor((Date.now() - emp.fechaAlta) / 86400000);
              const obligPend = modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] !== "completado").length;
              const alerta = dias > 30 && obligPend > 0;
              return (
                <div
                  key={emp.id}
                  className={styles.card}
                  onClick={() => { setSeleccionado(emp); setVista('detalle'); setPlanIA(""); }}
                  style={{ 
                    borderLeft: `4px solid ${alerta ? 'var(--color-brand)' : 'var(--color-brand)'}`,
                    background: seleccionado?.id === emp.id ? 'var(--color-surface)' : 'var(--color-bg)'
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <span className={styles.cardTitle}>{emp.nombre}</span>
                        {alerta && (
                          <span style={{ padding: "2px 7px", background: 'var(--color-surface)', color: 'var(--color-brand)',
                            borderRadius: 4, fontSize: 9, fontWeight: 700 }}>ALERTA</span>
                        )}
                      </div>
                      <div className={styles.cardMeta}>
                        {emp.rol} · {emp.departamento} · {dias}d
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-brand)", fontWeight: 700 }}>Ver ficha ›</div>
                  </div>
                  <ProgressBar pct={pct} />
                  <div className={styles.cardMeta} style={{ marginTop: 8 }}>
                    {modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] === "completado").length}/
                    {modulos.filter(m => m.obligatorio).length} oblig.
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulario módulo */}
        {vista === 'ajustes' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Añadir módulo</div>
            <div style={{ marginBottom: 12 }}>
              <Input
                value={formModulo.nombre}
                onChange={e => setFormModulo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del módulo"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <select 
                value={formModulo.area} 
                className={styles.select}
                onChange={e => setFormModulo(p => ({ ...p, area: e.target.value }))}
              >
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <input 
                value={formModulo.horas} 
                type="number" 
                min="1"
                className={styles.input}
                onChange={e => setFormModulo(p => ({ ...p, horas: e.target.value }))} 
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input 
                type="checkbox" 
                id="oblig" 
                checked={formModulo.obligatorio}
                onChange={e => setFormModulo(p => ({ ...p, obligatorio: e.target.checked }))} 
              />
              <label htmlFor="oblig" style={{ fontSize: 13, color: "var(--color-text)", cursor: "pointer" }}>
                Módulo obligatorio
              </label>
            </div>
            <Button variant="primary" size="md" onClick={añadirModulo} style={{ width: "100%" }}>
              Añadir módulo
            </Button>
          </div>
        )}

        {/* Formulario empleado */}
        {vista === 'ajustes' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Añadir empleado</div>
            <div style={{ marginBottom: 12 }}>
              <Input
                value={formEmpleado.nombre}
                onChange={e => setFormEmpleado(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Input
                value={formEmpleado.departamento}
                onChange={e => setFormEmpleado(p => ({ ...p, departamento: e.target.value }))}
                placeholder="Departamento"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <select 
                value={formEmpleado.rol} 
                className={styles.select}
                onChange={e => setFormEmpleado(p => ({ ...p, rol: e.target.value }))}
              >
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <Button variant="primary" size="md" onClick={añadirEmpleado} style={{ width: "100%" }}>
              Añadir empleado
            </Button>
          </div>
        )}
      </div>

      {/* ── Panel derecho — detalle ── */}
      <div className={styles.panelResultado}>
        {/* Vista detalle empleado */}
        {vista === 'detalle' && seleccionado ? (
          <div>
            {/* Header */}
            <div className={styles.cardHeader} style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--color-text-2)", letterSpacing: "1px", marginBottom: 4 }}>
                  EMPLEADO #{seleccionado.id.toString().slice(-2)}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{seleccionado.nombre}</div>
                <div className={styles.cardMeta}>
                  {seleccionado.rol} · {seleccionado.departamento} · Alta hace {Math.floor((Date.now() - seleccionado.fechaAlta) / 86400000)} días
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "var(--color-brand)" }}>{pctEmpleado(seleccionado.id)}%</div>
                <div style={{ fontSize: 10, color: "var(--color-text-2)", letterSpacing: "1px" }}>COMPLETADO</div>
              </div>
            </div>

            {/* Módulos por área */}
            {AREAS.map(area => {
              const modsArea = modulos.filter(m => m.area === area);
              if (!modsArea.length) return null;
              return (
                <div key={area} style={{ marginBottom: 16 }}>
                  <div className={styles.seccionLabel}>
                    {area.toUpperCase()} — {modsArea.length} MÓDULOS
                  </div>
                  {modsArea.map(mod => {
                    const estado = progresos[seleccionado.id]?.[mod.id] || "pendiente";
                    const fechaComp = fechasCompletado[seleccionado.id]?.[mod.id];
                    return (
                      <div key={mod.id} className={styles.card} style={{ padding: "12px", marginBottom: 6 }}>
                        <div className={styles.moduloItem}>
                          <div className={styles.moduloInfo}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                              <span className={styles.moduloNombre}>{mod.nombre}</span>
                              {mod.obligatorio && (
                                <span style={{ padding: "1px 6px", background: 'var(--color-surface)', color: 'var(--color-brand)',
                                  borderRadius: 4, fontSize: 9, fontWeight: 700 }}>OBL</span>
                              )}
                              {mod.custom && (
                                <span style={{ padding: "1px 6px", background: 'var(--color-surface)', color: 'var(--color-text)',
                                  borderRadius: 4, fontSize: 9, fontWeight: 700 }}>CUSTOM</span>
                              )}
                            </div>
                            <div className={styles.moduloMeta}>
                              {mod.horas}h {fechaComp ? `· Completado: ${new Date(fechaComp).toLocaleDateString("es-ES")}` : ""}
                            </div>
                          </div>
                          <div className={styles.moduloActions}>
                            <Badge estado={estado} />
                            <div style={{ display: "flex", gap: 4 }}>
                              {["pendiente", "en_curso", "completado"].filter(e => e !== estado).map(s => (
                                <Button key={s} variant="secondary" size="sm" onClick={() => cambiarProgreso(seleccionado.id, mod.id, s)}>
                                  {s === "en_curso" ? "En curso" : s === "completado" ? "Completar" : "Pendiente"}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Plan IA */}
            <div className={styles.planSection}>
              <div className={styles.seccionLabel}>PLAN DE DESARROLLO IA</div>
              {!planIA ? (
                <Button 
                  variant="primary" 
                  onClick={() => generarPlan(seleccionado)} 
                  loading={cargandoIA}
                  style={{ width: "100%" }}
                >
                  {cargandoIA ? "Generando plan..." : "Generar plan de desarrollo"}
                </Button>
              ) : (
                <div>
                  <div className={styles.planSectionContent} style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>
                    {planIA}
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => generarPlan(seleccionado)} 
                    loading={cargandoIA}
                  >
                    Regenerar
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : vista === 'matriz' ? (
          <div>
            <div className={styles.seccionLabel}>
              MATRIZ DE FORMACIÓN — {empleados.length} empleados × {modulos.length} módulos
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              {[
                { label: "Completado", style: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } },
                { label: "En curso",   style: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } },
                { label: "Pendiente",  style: { background: 'var(--color-bg)', border: '1px solid var(--color-border)' } },
              ].map(({ label, style }) => (
                <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, ...style }} />
                  <span style={{ fontSize: 11, color: "var(--color-text)" }}>{label}</span>
                </div>
              ))}
            </div>
            <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 16px", background: 'var(--color-surface)', color: "var(--color-text-2)",
                      fontSize: 10, letterSpacing: "1.5px", textAlign: "left" }}>EMPLEADO</th>
                    {modulos.map(m => (
                      <th key={m.id} style={{ padding: "8px 4px", background: 'var(--color-surface)', color: "var(--color-text-2)",
                        fontSize: 9, textAlign: "center" }}>
                        <div style={{ fontSize: 8, lineHeight: 1.2 }}>
                          {m.nombre.slice(0, 15)}
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: "10px 12px", background: 'var(--color-surface)', color: "var(--color-text-2)",
                      fontSize: 10, letterSpacing: "1px" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map((emp, i) => (
                    <tr key={emp.id} style={{ background: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)' }}>
                      <td 
                        onClick={() => { setSeleccionado(emp); setVista('detalle'); setPlanIA(""); }}
                        style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600,
                          borderBottom: "1px solid var(--color-border)", cursor: "pointer",
                          color: "var(--color-text)" }}
                      >
                        {emp.nombre.split(" ")[0]}
                        <div style={{ fontSize: 9, color: "var(--color-text-2)", letterSpacing: "0.5px" }}>{emp.rol}</div>
                      </td>
                      {modulos.map(m => {
                        const estado = progresos[emp.id]?.[m.id] || "pendiente";
                        const bgColor = estado === "completado" ? 'var(--color-surface)' : estado === "en_curso" ? 'var(--color-surface)' : 'var(--color-bg)';
                        return (
                          <td key={m.id} style={{ padding: 4, textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>
                            <div 
                              title={`${emp.nombre} — ${m.nombre}: ${estado}`}
                              style={{ width: 28, height: 28, borderRadius: 5, background: bgColor,
                                margin: "0 auto", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 12, cursor: "pointer", border: "1px solid var(--color-border)" }}
                              onClick={() => { setSeleccionado(emp); setVista('detalle'); setPlanIA(""); }}
                            >
                              {estado === "completado" ? "✓" : estado === "en_curso" ? "◉" : ""}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 800, color: "var(--color-brand)",
                        borderBottom: "1px solid var(--color-border)" }}>{pctEmpleado(emp.id)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <WelcomeState
            icon={GraduationCap}
            title="Formación Interna"
            subtitle="Selecciona un empleado para ver su progreso, módulos completados y el plan de formación personalizado generado por IA."
            chips={[
              'Ver empleados con alerta',
              'Módulos obligatorios',
              'Generar plan IA',
              'Matriz de competencias →'
            ]}
            onChipClick={() => {}}
          />
        )}
      </div>
    </div>
  );
}
