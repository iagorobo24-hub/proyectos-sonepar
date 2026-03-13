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
};

const SvgLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="16" rx="14" ry="8" stroke="white" strokeWidth="1.8" fill="none"/>
    <ellipse cx="16" cy="16" rx="8" ry="14" stroke="white" strokeWidth="1.8" fill="none"/>
    <circle cx="16" cy="16" r="2.5" fill="white"/>
  </svg>
);

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
  const cfg = {
    completado: { bg: C.optimalBg,  color: C.optimal,   label: "COMPLETADO" },
    en_curso:   { bg: C.blueBg,     color: C.blueMid,   label: "EN CURSO"   },
    pendiente:  { bg: "#F0F1F5",    color: C.textMuted, label: "PENDIENTE"  },
  };
  const { bg, color, label } = cfg[estado] || cfg.pendiente;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: bg, color, letterSpacing: "0.8px", fontFamily: "system-ui,sans-serif" }}>
      {label}
    </span>
  );
};

// ── Barra de progreso ──────────────────────────────────────────────────────
const ProgressBar = ({ pct }) => {
  const color = pct >= 70 ? C.optimal : pct >= 40 ? C.accept : C.critical;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>Progreso</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, ${color}CC)`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
};

export default function FormacionInterna() {
  const [empleados, setEmpleados] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [progresos, setProgresos] = useState({});
  const [fechasCompletado, setFechasCompletado] = useState({});
  const [seleccionado, setSeleccionado] = useState(null);
  const [vista, setVista] = useState("dashboard");
  const [planIA, setPlanIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [toast, setToast] = useState("");
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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

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
    showToast("Progreso actualizado");
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
    showToast(`Módulo "${nuevo.nombre}" añadido`);
  };

  const añadirEmpleado = () => {
    if (!formEmpleado.nombre || !formEmpleado.departamento) return;
    const nuevo = { id: `e${Date.now()}`, ...formEmpleado, fechaAlta: Date.now() };
    const nuevos = [...empleados, nuevo];
    const nuevosProgresos = { ...progresos, [nuevo.id]: progresoInicial(modulos) };
    setEmpleados(nuevos); setProgresos(nuevosProgresos);
    guardar(nuevos, modulos, nuevosProgresos, fechasCompletado);
    setFormEmpleado({ nombre: "", rol: ROLES[0], departamento: "" });
    showToast(`Empleado "${nuevo.nombre}" añadido`);
  };

  const generarPlan = async (emp) => {
    setCargandoIA(true); setPlanIA("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const kpiColor = (v, thresholds) => v >= thresholds[0] ? C.optimal : v >= thresholds[1] ? C.accept : C.critical;

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`,
    borderRadius: 6, fontSize: 13, color: C.textPri, outline: "none",
    background: C.white, fontFamily: "system-ui,sans-serif",
  };
  const selectStyle = { ...inputStyle };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; }
        button { font-family: inherit; cursor: pointer; }
        input, select, textarea { font-family: inherit; }
        textarea { resize: vertical; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: C.navy, color: C.white, padding: "12px 20px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,48,135,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: C.bg, color: C.textPri }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ background: C.navy, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          {/* Accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.blue}, #7BB8F0, ${C.blue})` }} />
          <div style={{ padding: "0 28px", display: "flex", alignItems: "center", height: 56, gap: 16 }}>
            <SvgLogo />
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 700, letterSpacing: "0.3px" }}>
                Formación Interna
              </div>
              <div style={{ color: C.blue, fontSize: 10, letterSpacing: "1px", marginTop: 1 }}>
                SONEPAR ESPAÑA · TRACKER v3
              </div>
            </div>
            <div style={{ flex: 1 }} />
            {[
              { id: "dashboard", label: "EQUIPO" },
              { id: "matriz",    label: "MATRIZ" },
              { id: "ajustes",   label: "AJUSTES" },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => { setVista(id); setSeleccionado(null); setPlanIA(""); }}
                style={{
                  padding: "6px 16px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.8px", border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: vista === id ? C.blue : "rgba(255,255,255,0.1)",
                  color: C.white,
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerta obligatorios */}
        {empleadosAlerta.length > 0 && (
          <div style={{ background: C.criticalBg, borderBottom: `1px solid ${C.critical}30`,
            padding: "10px 28px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: C.critical, color: C.white, borderRadius: 4,
              padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>⚠ ALERTA</span>
            <span style={{ fontSize: 12, color: C.critical, fontWeight: 600 }}>
              {empleadosAlerta.length} empleado{empleadosAlerta.length > 1 ? "s" : ""} con módulos obligatorios pendientes (+30 días):
            </span>
            <span style={{ fontSize: 12, color: C.critical }}>
              {empleadosAlerta.map(e => e.nombre.split(" ")[0]).join(" · ")}
            </span>
          </div>
        )}

        {/* ── KPI row ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1,
          background: C.border, borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: "PROGRESO GLOBAL", valor: `${pctGlobal}%`, color: kpiColor(pctGlobal, [70, 40]) },
            { label: "EMPLEADOS",       valor: empleados.length, color: C.navy },
            { label: "MÓDULOS",         valor: modulos.length,   color: C.navy },
            { label: "CON ALERTA",      valor: empleadosAlerta.length,
              color: empleadosAlerta.length > 0 ? C.critical : C.optimal },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{ background: C.white, padding: "16px 24px" }}>
              <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{valor}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* ════════════ DASHBOARD ════════════ */}
          {vista === "dashboard" && !seleccionado && (
            <>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "1px", marginBottom: 16 }}>
                EQUIPO — {empleados.length} EMPLEADOS
              </div>

              {/* Horas por área */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {AREAS.map(area => (
                  <div key={area} style={{ background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "10px 16px", minWidth: 110 }}>
                    <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 4 }}>
                      {area.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{hrasArea(area)}h</div>
                  </div>
                ))}
              </div>

              {/* Lista empleados */}
              <div style={{ display: "grid", gap: 8 }}>
                {empleados.map(emp => {
                  const pct = pctEmpleado(emp.id);
                  const dias = Math.floor((Date.now() - emp.fechaAlta) / 86400000);
                  const obligPend = modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] !== "completado").length;
                  const alerta = dias > 30 && obligPend > 0;
                  return (
                    <div key={emp.id} onClick={() => { setSeleccionado(emp); setVista("detalle"); setPlanIA(""); }}
                      style={{ background: C.white, borderRadius: 8,
                        border: `1px solid ${alerta ? C.critical + "50" : C.border}`,
                        borderLeft: `4px solid ${alerta ? C.critical : C.navy}`,
                        padding: "14px 20px", cursor: "pointer",
                        display: "grid", gridTemplateColumns: "1fr 220px 150px 100px", alignItems: "center", gap: 16,
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,48,135,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                    >
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{emp.nombre}</span>
                          {alerta && (
                            <span style={{ padding: "2px 7px", background: C.criticalBg, color: C.critical,
                              borderRadius: 4, fontSize: 9, fontWeight: 700 }}>ALERTA</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>
                          {emp.rol} · {emp.departamento} · {dias}d en el sistema
                        </div>
                      </div>
                      <ProgressBar pct={pct} />
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        {modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] === "completado").length}/
                        {modulos.filter(m => m.obligatorio).length} oblig.
                      </div>
                      <div style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>Ver ficha ›</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ════════════ DETALLE EMPLEADO ════════════ */}
          {vista === "detalle" && seleccionado && (
            <div style={{ maxWidth: 900 }}>
              <button onClick={() => { setVista("dashboard"); setSeleccionado(null); setPlanIA(""); }}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "6px 14px",
                  fontSize: 12, color: C.textMuted, marginBottom: 16, cursor: "pointer" }}>
                ← Volver al equipo
              </button>

              {/* Header empleado */}
              <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.navy}`, padding: "18px 24px", marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{seleccionado.nombre}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    {seleccionado.rol} · {seleccionado.departamento} · Alta hace {Math.floor((Date.now() - seleccionado.fechaAlta) / 86400000)} días
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.navy }}>{pctEmpleado(seleccionado.id)}%</div>
                  <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px" }}>COMPLETADO</div>
                </div>
              </div>

              {/* Módulos por área */}
              {AREAS.map(area => {
                const modsArea = modulos.filter(m => m.area === area);
                if (!modsArea.length) return null;
                return (
                  <div key={area} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1.5px", marginBottom: 8 }}>
                      {area.toUpperCase()} — {modsArea.length} MÓDULOS
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {modsArea.map(mod => {
                        const estado = progresos[seleccionado.id]?.[mod.id] || "pendiente";
                        const fechaComp = fechasCompletado[seleccionado.id]?.[mod.id];
                        return (
                          <div key={mod.id} style={{ background: C.white, borderRadius: 7,
                            border: `1px solid ${C.border}`, padding: "12px 16px",
                            display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 10 }}>
                            <div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{mod.nombre}</span>
                                {mod.obligatorio && (
                                  <span style={{ padding: "1px 6px", background: C.acceptBg, color: C.accept,
                                    borderRadius: 4, fontSize: 9, fontWeight: 700 }}>OBL</span>
                                )}
                                {mod.custom && (
                                  <span style={{ padding: "1px 6px", background: C.blueBg, color: C.blueMid,
                                    borderRadius: 4, fontSize: 9, fontWeight: 700 }}>CUSTOM</span>
                                )}
                              </div>
                              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                                {mod.horas}h {fechaComp ? `· Completado: ${new Date(fechaComp).toLocaleDateString("es-ES")}` : ""}
                              </div>
                            </div>
                            <Badge estado={estado} />
                            {["pendiente", "en_curso", "completado"].filter(e => e !== estado).map(s => (
                              <button key={s} onClick={() => cambiarProgreso(seleccionado.id, mod.id, s)}
                                style={{ padding: "5px 10px", border: `1px solid ${C.border}`, borderRadius: 5,
                                  fontSize: 10, background: C.white, color: C.textSec, cursor: "pointer",
                                  transition: "all 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = C.navy}
                                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                                {s === "en_curso" ? "En curso" : s === "completado" ? "Completar" : "Pendiente"}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Plan IA */}
              <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: "1px" }}>
                    PLAN DE DESARROLLO IA
                  </span>
                </div>
                {!planIA && (
                  <button onClick={() => generarPlan(seleccionado)} disabled={cargandoIA}
                    style={{ width: "100%", padding: "11px", borderRadius: 6, border: "none",
                      background: cargandoIA ? C.border : C.navy, color: C.white,
                      fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", cursor: cargandoIA ? "default" : "pointer" }}>
                    {cargandoIA ? "Generando plan..." : "Generar plan de desarrollo ›"}
                  </button>
                )}
                {planIA && (
                  <>
                    <div style={{ fontSize: 13, color: C.textPri, lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 12,
                      padding: "14px", background: C.bg, borderRadius: 6 }}>
                      {planIA}
                    </div>
                    <button onClick={() => generarPlan(seleccionado)} disabled={cargandoIA}
                      style={{ padding: "7px 16px", border: `1px solid ${C.border}`, borderRadius: 5,
                        background: C.white, color: C.textSec, fontSize: 11, cursor: "pointer" }}>
                      Regenerar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════════ MATRIZ ════════════ */}
          {vista === "matriz" && (
            <div>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "1px", marginBottom: 16 }}>
                MATRIZ DE FORMACIÓN — {empleados.length} empleados × {modulos.length} módulos
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                {[
                  { label: "Completado", color: C.optimal,  bg: C.optimalBg },
                  { label: "En curso",   color: C.blueMid,  bg: C.blueBg    },
                  { label: "Pendiente",  color: C.textMuted, bg: "#F0F1F5"  },
                ].map(({ label, color, bg }) => (
                  <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: bg, border: `1px solid ${color}30` }} />
                    <span style={{ fontSize: 11, color: C.textSec }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ overflowX: "auto", background: C.white, borderRadius: 8,
                border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 16px", background: C.navy, color: C.textMuted,
                        fontSize: 10, letterSpacing: "1.5px", textAlign: "left", minWidth: 160,
                        position: "sticky", left: 0, zIndex: 1 }}>EMPLEADO</th>
                      {modulos.map(m => (
                        <th key={m.id} style={{ padding: "8px 4px", background: C.navy, color: "#8A9CC2",
                          fontSize: 9, textAlign: "center", minWidth: 76 }}>
                          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)",
                            height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {m.nombre.slice(0, 20)}
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: "10px 12px", background: C.navy, color: C.textMuted,
                        fontSize: 10, letterSpacing: "1px" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map((emp, i) => (
                      <tr key={emp.id} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                        <td onClick={() => { setSeleccionado(emp); setVista("detalle"); setPlanIA(""); }}
                          style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600,
                            borderBottom: `1px solid ${C.border}`, position: "sticky", left: 0,
                            background: i % 2 === 0 ? C.white : C.bg, cursor: "pointer",
                            color: C.textPri }}>
                          {emp.nombre.split(" ")[0]}
                          <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: "0.5px" }}>{emp.rol}</div>
                        </td>
                        {modulos.map(m => {
                          const estado = progresos[emp.id]?.[m.id] || "pendiente";
                          const bgColor = estado === "completado" ? C.optimalBg : estado === "en_curso" ? C.blueBg : "#F0F1F5";
                          return (
                            <td key={m.id} style={{ padding: 4, textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                              <div title={`${emp.nombre} — ${m.nombre}: ${estado}`}
                                style={{ width: 28, height: 28, borderRadius: 5, background: bgColor,
                                  margin: "0 auto", display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: 12, cursor: "pointer" }}
                                onClick={() => { setSeleccionado(emp); setVista("detalle"); setPlanIA(""); }}>
                                {estado === "completado" ? "✓" : estado === "en_curso" ? "◉" : ""}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 800, color: C.navy,
                          borderBottom: `1px solid ${C.border}` }}>{pctEmpleado(emp.id)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════ AJUSTES ════════════ */}
          {vista === "ajustes" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>

              {/* Añadir módulo */}
              <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: "1px", marginBottom: 16 }}>
                  AÑADIR MÓDULO PERSONALIZADO
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Nombre del módulo</div>
                  <input value={formModulo.nombre} onChange={e => setFormModulo(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Manejo de carretilla elevadora" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Área</div>
                    <select value={formModulo.area} onChange={e => setFormModulo(p => ({ ...p, area: e.target.value }))}
                      style={selectStyle}>
                      {AREAS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Horas</div>
                    <input value={formModulo.horas} type="number" min="1"
                      onChange={e => setFormModulo(p => ({ ...p, horas: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <input type="checkbox" id="oblig" checked={formModulo.obligatorio}
                    onChange={e => setFormModulo(p => ({ ...p, obligatorio: e.target.checked }))} />
                  <label htmlFor="oblig" style={{ fontSize: 13, color: C.textSec, cursor: "pointer" }}>
                    Módulo obligatorio
                  </label>
                </div>
                <button onClick={añadirModulo}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "none",
                    background: C.navy, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Añadir módulo ›
                </button>
                {modulos.filter(m => m.custom).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 8 }}>
                      MÓDULOS PERSONALIZADOS
                    </div>
                    {modulos.filter(m => m.custom).map(m => (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between",
                        padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                        <span>{m.nombre}</span>
                        <span style={{ color: C.textMuted, fontSize: 10 }}>{m.area} · {m.horas}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Añadir empleado */}
              <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: "1px", marginBottom: 16 }}>
                  AÑADIR EMPLEADO
                </div>
                {[
                  { key: "nombre",       label: "Nombre completo",  placeholder: "Nombre Apellidos" },
                  { key: "departamento", label: "Departamento",     placeholder: "Ej: Almacén, Ventas..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>{label}</div>
                    <input value={formEmpleado[key]}
                      onChange={e => setFormEmpleado(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Rol</div>
                  <select value={formEmpleado.rol} onChange={e => setFormEmpleado(p => ({ ...p, rol: e.target.value }))}
                    style={selectStyle}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={añadirEmpleado}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "none",
                    background: C.navy, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Añadir empleado ›
                </button>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 8 }}>
                    EMPLEADOS REGISTRADOS ({empleados.length})
                  </div>
                  {empleados.map(e => (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between",
                      padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                      <span>{e.nombre}</span>
                      <span style={{ color: C.textMuted, fontSize: 10 }}>{e.rol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
