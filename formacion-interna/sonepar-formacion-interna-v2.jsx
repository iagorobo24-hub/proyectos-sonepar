import { useState, useEffect } from "react";

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
  { id: "e1", nombre: "María Fernández",  rol: "Operario",     departamento: "Almacén",   fechaAlta: Date.now() - 5184000000 },
  { id: "e2", nombre: "Alejandro López",  rol: "Técnico",      departamento: "Mostrador", fechaAlta: Date.now() - 2592000000 },
  { id: "e3", nombre: "Roberto Martínez", rol: "Operario",     departamento: "Almacén",   fechaAlta: Date.now() - 7776000000 },
  { id: "e4", nombre: "Carmen González",  rol: "Comercial",    departamento: "Ventas",    fechaAlta: Date.now() - 1296000000 },
  { id: "e5", nombre: "José Rodríguez",   rol: "Responsable",  departamento: "Logística", fechaAlta: Date.now() - 10368000000 },
];

const progresoInicial = (modulos) => Object.fromEntries(modulos.map(m => [m.id, "pendiente"]));

const PROMPT_PLAN = (emp, modulos, progreso) => {
  const completados = modulos.filter(m => progreso[m.id] === "completado").map(m => m.nombre);
  const enCurso    = modulos.filter(m => progreso[m.id] === "en_curso").map(m => m.nombre);
  const pendientes = modulos.filter(m => progreso[m.id] === "pendiente").map(m => m.nombre);
  return `Eres el responsable de formación de una delegación de Sonepar España. Genera un plan de desarrollo personalizado.

Empleado: ${emp.nombre} — ${emp.rol} — ${emp.departamento}
Completados: ${completados.join(", ") || "ninguno"}
En curso: ${enCurso.join(", ") || "ninguno"}
Pendientes: ${pendientes.join(", ") || "ninguno"}

Genera un plan en 3 párrafos: (1) valoración del progreso actual, (2) módulos prioritarios a completar y por qué, (3) recomendación de siguiente paso concreto esta semana. Tono directo y motivador.`;
};

export default function FormacionInterna() {
  const [empleados, setEmpleados] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [progresos, setProgresos] = useState({});
  const [fechasCompletado, setFechasCompletado] = useState({});
  const [seleccionado, setSeleccionado] = useState(null);
  const [vista, setVista] = useState("dashboard"); // dashboard | detalle | matriz | ajustes
  const [planIA, setPlanIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [toast, setToast] = useState("");
  const [formModulo, setFormModulo] = useState({ nombre: "", area: AREAS[0], horas: "4", obligatorio: false });
  const [formEmpleado, setFormEmpleado] = useState({ nombre: "", rol: ROLES[0], departamento: "" });

  // Cargar desde localStorage
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

      // Migración: asegurar que todos los empleados tienen progresos para todos los módulos
      const prgsCompleto = {};
      emps.forEach(e => {
        prgsCompleto[e.id] = {};
        mods.forEach(m => {
          prgsCompleto[e.id][m.id] = prgs[e.id]?.[m.id] || "pendiente";
        });
      });

      setModulos(mods);
      setEmpleados(emps);
      setProgresos(prgsCompleto);
      setFechasCompletado(fecs);
    } catch {
      const mods = MODULOS_INIT;
      const emps = EMPLEADOS_INIT();
      setModulos(mods);
      setEmpleados(emps);
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
    setProgresos(nuevosProgresos);
    setFechasCompletado(nuevasFechas);
    guardar(empleados, modulos, nuevosProgresos, nuevasFechas);
    if (seleccionado?.id === empId) setSeleccionado(empleados.find(e => e.id === empId));
    showToast("Progreso actualizado");
  };

  const añadirModulo = () => {
    if (!formModulo.nombre) return;
    const nuevo = { id: `m${Date.now()}`, ...formModulo, horas: parseInt(formModulo.horas) || 4, custom: true };
    const nuevos = [...modulos, nuevo];
    const nuevosProgresos = { ...progresos };
    empleados.forEach(e => { nuevosProgresos[e.id] = { ...nuevosProgresos[e.id], [nuevo.id]: "pendiente" }; });
    setModulos(nuevos);
    setProgresos(nuevosProgresos);
    guardar(empleados, nuevos, nuevosProgresos, fechasCompletado);
    setFormModulo({ nombre: "", area: AREAS[0], horas: "4", obligatorio: false });
    showToast(`Módulo "${nuevo.nombre}" añadido a todos los empleados`);
  };

  const añadirEmpleado = () => {
    if (!formEmpleado.nombre || !formEmpleado.departamento) return;
    const nuevo = { id: `e${Date.now()}`, ...formEmpleado, fechaAlta: Date.now() };
    const nuevos = [...empleados, nuevo];
    const nuevosProgresos = { ...progresos, [nuevo.id]: progresoInicial(modulos) };
    setEmpleados(nuevos);
    setProgresos(nuevosProgresos);
    guardar(nuevos, modulos, nuevosProgresos, fechasCompletado);
    setFormEmpleado({ nombre: "", rol: ROLES[0], departamento: "" });
    showToast(`Empleado "${nuevo.nombre}" añadido`);
  };

  const generarPlan = async (emp) => {
    setCargandoIA(true);
    setPlanIA("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_PLAN(emp, modulos, progresos[emp.id] || {}) }],
        }),
      });
      const data = await res.json();
      setPlanIA(data.content?.map(i => i.text || "").join("") || "");
    } catch { setPlanIA("Error al generar el plan."); }
    setCargandoIA(false);
  };

  // KPIs globales
  const totalModulos = modulos.length;
  const completadosGlobal = empleados.reduce((acc, e) => acc + modulos.filter(m => progresos[e.id]?.[m.id] === "completado").length, 0);
  const totalPosible = empleados.length * totalModulos;
  const pctGlobal = totalPosible > 0 ? Math.round((completadosGlobal / totalPosible) * 100) : 0;

  // Empleados con alerta: >30 días y obligatorios sin completar
  const empleadosAlerta = empleados.filter(e => {
    const diasAlta = (Date.now() - e.fechaAlta) / 86400000;
    const obligatoriosPendientes = modulos.filter(m => m.obligatorio && progresos[e.id]?.[m.id] !== "completado").length;
    return diasAlta > 30 && obligatoriosPendientes > 0;
  });

  const pctEmpleado = (empId) => {
    const total = modulos.length;
    if (total === 0) return 0;
    const comp = modulos.filter(m => progresos[empId]?.[m.id] === "completado").length;
    return Math.round((comp / total) * 100);
  };

  const colorEstado = { "completado": "#2e7d32", "en_curso": "#1565c0", "pendiente": "#e0e0e0" };
  const bgEstado    = { "completado": "#e8f5e9", "en_curso": "#e3f2fd", "pendiente": "#f5f5f5" };

  const S = {
    btn: (color = "#1a1a2e", full = false) => ({
      padding: "8px 18px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: color, color: "#fff", border: "none", cursor: "pointer",
      width: full ? "100%" : "auto",
    }),
    btnOutline: (color = "#1a1a2e") => ({
      padding: "6px 14px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer",
    }),
  };

  const hrasArea = (area) => empleados.reduce((acc, e) =>
    acc + modulos.filter(m => m.area === area && progresos[e.id]?.[m.id] === "completado").reduce((s, m) => s + m.horas, 0), 0);

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a1a2e", color: "#e8a020", padding: "12px 20px", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Georgia', serif", color: "#1a1a2e" }}>

        {/* Header */}
        <div style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: "3px solid #3949ab" }}>
          <div style={{ background: "#3949ab", padding: "16px 22px", display: "flex", alignItems: "center", marginRight: "20px" }}>
            <span style={{ fontWeight: "900", fontSize: "12px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <span style={{ color: "#7986cb", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>FORMACIÓN INTERNA</span>
            <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>TRACKER · v2</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[
              { id: "dashboard", label: "EQUIPO" },
              { id: "matriz",    label: "MATRIZ" },
              { id: "ajustes",   label: "AJUSTES" },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => { setVista(id); setSeleccionado(null); setPlanIA(""); }}
                style={{ ...S.btn(vista === id ? "#3949ab" : "#2a2a3e") }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Alerta obligatorios */}
        {empleadosAlerta.length > 0 && (
          <div style={{ background: "#c62828", padding: "10px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#fff", fontFamily: "'Courier New', monospace", fontSize: "11px", fontWeight: "700", letterSpacing: "1px" }}>
              ⚠ {empleadosAlerta.length} EMPLEADO{empleadosAlerta.length > 1 ? "S" : ""} CON OBLIGATORIOS PENDIENTES (+30 DÍAS):
            </span>
            <span style={{ color: "#ffcdd2", fontFamily: "'Courier New', monospace", fontSize: "11px" }}>
              {empleadosAlerta.map(e => e.nombre.split(" ")[0]).join(" · ")}
            </span>
          </div>
        )}

        {/* KPIs globales */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "#e0dbd4", borderBottom: "1px solid #e0dbd4" }}>
          {[
            { label: "PROGRESO GLOBAL", valor: `${pctGlobal}%`, color: pctGlobal > 70 ? "#2e7d32" : pctGlobal > 40 ? "#f9a825" : "#c62828" },
            { label: "EMPLEADOS",       valor: empleados.length, color: "#1a1a2e" },
            { label: "MÓDULOS",         valor: modulos.length,   color: "#1a1a2e" },
            { label: "CON ALERTA",      valor: empleadosAlerta.length, color: empleadosAlerta.length > 0 ? "#c62828" : "#2e7d32" },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{ background: "#fff", padding: "18px 24px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{label}</div>
              <div style={{ fontSize: "32px", fontWeight: "700", color }}>{valor}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 32px" }}>

          {/* ══════════ DASHBOARD ══════════ */}
          {vista === "dashboard" && !seleccionado && (
            <>
              <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>
                EQUIPO — {empleados.length} EMPLEADOS
              </div>

              {/* Horas por área */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                {AREAS.map(area => {
                  const horas = hrasArea(area);
                  return (
                    <div key={area} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "10px 16px", minWidth: "120px" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "1px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>{area.toUpperCase()}</div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#3949ab" }}>{horas}h</div>
                    </div>
                  );
                })}
              </div>

              {/* Lista empleados */}
              <div style={{ display: "grid", gap: "8px" }}>
                {empleados.map(emp => {
                  const pct = pctEmpleado(emp.id);
                  const diasAlta = Math.floor((Date.now() - emp.fechaAlta) / 86400000);
                  const obligPendientes = modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] !== "completado").length;
                  const tieneAlerta = diasAlta > 30 && obligPendientes > 0;
                  return (
                    <div key={emp.id}
                      onClick={() => { setSeleccionado(emp); setVista("detalle"); setPlanIA(""); }}
                      style={{ background: "#fff", border: `1px solid ${tieneAlerta ? "#ffcdd2" : "#e0dbd4"}`, borderLeft: `4px solid ${tieneAlerta ? "#c62828" : "#3949ab"}`, padding: "14px 20px", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr 200px 140px 100px", alignItems: "center", gap: "16px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fdfcfa"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "2px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e" }}>{emp.nombre}</span>
                          {tieneAlerta && <span style={{ padding: "2px 8px", background: "#c62828", color: "#fff", fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700" }}>ALERTA</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                          {emp.rol.toUpperCase()} · {emp.departamento} · {diasAlta}d en el sistema
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>PROGRESO</span>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: pct > 70 ? "#2e7d32" : pct > 40 ? "#f9a825" : "#c62828" }}>{pct}%</span>
                        </div>
                        <div style={{ height: "4px", background: "#f0ebe0", borderRadius: "2px" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct > 70 ? "#2e7d32" : pct > 40 ? "#f9a825" : "#c62828", borderRadius: "2px" }} />
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", fontFamily: "'Courier New', monospace" }}>
                        {modulos.filter(m => m.obligatorio && progresos[emp.id]?.[m.id] === "completado").length}/{modulos.filter(m => m.obligatorio).length} oblig.
                      </div>
                      <div style={{ fontSize: "11px", color: "#3949ab", fontFamily: "'Courier New', monospace", fontWeight: "700" }}>
                        VER FICHA ›
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ══════════ DETALLE EMPLEADO ══════════ */}
          {vista === "detalle" && seleccionado && (
            <div style={{ maxWidth: "900px" }}>
              <button onClick={() => { setVista("dashboard"); setSeleccionado(null); setPlanIA(""); }}
                style={{ ...S.btnOutline("#aaa"), marginBottom: "16px", fontSize: "9px" }}>
                ← VOLVER AL EQUIPO
              </button>

              <div style={{ background: "#fff", border: "1px solid #e0dbd4", borderLeft: "4px solid #3949ab", padding: "20px 24px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", marginBottom: "6px" }}>{seleccionado.nombre}</div>
                    <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                      {seleccionado.rol.toUpperCase()} · {seleccionado.departamento} · Alta hace {Math.floor((Date.now() - seleccionado.fechaAlta) / 86400000)} días
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "36px", fontWeight: "700", color: "#3949ab" }}>{pctEmpleado(seleccionado.id)}%</div>
                    <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>COMPLETADO</div>
                  </div>
                </div>
              </div>

              {/* Módulos por área */}
              {AREAS.map(area => {
                const modsArea = modulos.filter(m => m.area === area);
                if (modsArea.length === 0) return null;
                return (
                  <div key={area} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>
                      {area.toUpperCase()} — {modsArea.length} MÓDULOS
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {modsArea.map(mod => {
                        const estado = progresos[seleccionado.id]?.[mod.id] || "pendiente";
                        const fechaComp = fechasCompletado[seleccionado.id]?.[mod.id];
                        return (
                          <div key={mod.id} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: "12px" }}>
                            <div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{mod.nombre}</span>
                                {mod.obligatorio && <span style={{ padding: "1px 6px", background: "#fff3e0", color: "#c07010", fontSize: "9px", fontFamily: "'Courier New', monospace" }}>OBL</span>}
                                {mod.custom && <span style={{ padding: "1px 6px", background: "#e8eaf6", color: "#3949ab", fontSize: "9px", fontFamily: "'Courier New', monospace" }}>CUSTOM</span>}
                              </div>
                              <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace", marginTop: "2px" }}>
                                {mod.horas}h {fechaComp ? `· Completado: ${new Date(fechaComp).toLocaleDateString("es-ES")}` : ""}
                              </div>
                            </div>
                            <div style={{ padding: "4px 10px", background: bgEstado[estado], color: colorEstado[estado], fontSize: "10px", fontFamily: "'Courier New', monospace", fontWeight: "700" }}>
                              {estado.toUpperCase().replace("_", " ")}
                            </div>
                            {["pendiente", "en_curso", "completado"].filter(e => e !== estado).map(nuevoEstado => (
                              <button key={nuevoEstado} onClick={() => cambiarProgreso(seleccionado.id, mod.id, nuevoEstado)}
                                style={{ ...S.btnOutline(colorEstado[nuevoEstado]), padding: "4px 10px", fontSize: "9px" }}>
                                {nuevoEstado === "en_curso" ? "EN CURSO" : nuevoEstado === "completado" ? "COMPLETAR" : "PENDIENTE"}
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
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px 24px", marginTop: "8px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>◈ PLAN DE DESARROLLO IA</div>
                {!planIA && (
                  <button onClick={() => generarPlan(seleccionado)} disabled={cargandoIA}
                    style={{ ...S.btn(cargandoIA ? "#aaa" : "#3949ab", true), padding: "12px" }}>
                    {cargandoIA ? "GENERANDO PLAN..." : "GENERAR PLAN DE DESARROLLO ›"}
                  </button>
                )}
                {planIA && (
                  <>
                    <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.8", whiteSpace: "pre-wrap", marginBottom: "12px" }}>{planIA}</div>
                    <button onClick={() => generarPlan(seleccionado)} disabled={cargandoIA}
                      style={{ ...S.btnOutline("#aaa"), fontSize: "9px" }}>
                      REGENERAR
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════ MATRIZ ══════════ */}
          {vista === "matriz" && (
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>
                MATRIZ DE FORMACIÓN — {empleados.length} empleados × {modulos.length} módulos
              </div>

              {/* Leyenda */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                {[
                  { label: "Completado", color: "#2e7d32", bg: "#c8e6c9" },
                  { label: "En curso",   color: "#1565c0", bg: "#bbdefb" },
                  { label: "Pendiente",  color: "#aaa",    bg: "#e0e0e0" },
                ].map(({ label, color, bg }) => (
                  <div key={label} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <div style={{ width: "16px", height: "16px", background: bg, border: `1px solid ${color}` }} />
                    <span style={{ fontSize: "11px", color: "#888" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Tabla scrollable */}
              <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e0dbd4" }}>
                <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 16px", background: "#1a1a2e", color: "#888", fontSize: "9px", fontFamily: "'Courier New', monospace", letterSpacing: "2px", textAlign: "left", minWidth: "160px", position: "sticky", left: 0, zIndex: 1 }}>
                        EMPLEADO
                      </th>
                      {modulos.map(m => (
                        <th key={m.id} style={{ padding: "8px 6px", background: "#1a1a2e", color: "#666", fontSize: "9px", fontFamily: "'Courier New', monospace", textAlign: "center", minWidth: "80px", maxWidth: "100px", letterSpacing: "0.5px" }}>
                          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: "80px", display: "flex", alignItems: "center" }}>
                            {m.nombre.slice(0, 20)}
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: "10px 12px", background: "#1a1a2e", color: "#888", fontSize: "9px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map((emp, i) => (
                      <tr key={emp.id} style={{ background: i % 2 === 0 ? "#fff" : "#fdfcfa" }}>
                        <td style={{ padding: "10px 16px", fontSize: "12px", fontWeight: "600", color: "#1a1a2e", borderBottom: "1px solid #f5f0e8", position: "sticky", left: 0, background: i % 2 === 0 ? "#fff" : "#fdfcfa", cursor: "pointer" }}
                          onClick={() => { setSeleccionado(emp); setVista("detalle"); setPlanIA(""); }}>
                          {emp.nombre.split(" ")[0]}
                          <div style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{emp.rol}</div>
                        </td>
                        {modulos.map(m => {
                          const estado = progresos[emp.id]?.[m.id] || "pendiente";
                          const bgColor = estado === "completado" ? "#c8e6c9" : estado === "en_curso" ? "#bbdefb" : "#e0e0e0";
                          return (
                            <td key={m.id} style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f5f0e8" }}>
                              <div
                                onClick={() => { setSeleccionado(emp); setVista("detalle"); setPlanIA(""); }}
                                title={`${emp.nombre} — ${m.nombre}: ${estado}`}
                                style={{ width: "28px", height: "28px", background: bgColor, margin: "0 auto", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                                {estado === "completado" ? "✓" : estado === "en_curso" ? "◉" : ""}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", color: "#3949ab", fontFamily: "'Courier New', monospace", borderBottom: "1px solid #f5f0e8" }}>
                          {pctEmpleado(emp.id)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════ AJUSTES ══════════ */}
          {vista === "ajustes" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "900px" }}>

              {/* Añadir módulo */}
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px 24px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>AÑADIR MÓDULO PERSONALIZADO</div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>NOMBRE DEL MÓDULO</div>
                  <input value={formModulo.nombre} onChange={e => setFormModulo(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Manejo de carretilla elevadora"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>ÁREA</div>
                    <select value={formModulo.area} onChange={e => setFormModulo(p => ({ ...p, area: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }}>
                      {AREAS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>HORAS</div>
                    <input value={formModulo.horas} onChange={e => setFormModulo(p => ({ ...p, horas: e.target.value }))}
                      type="number" min="1"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <input type="checkbox" id="oblig" checked={formModulo.obligatorio} onChange={e => setFormModulo(p => ({ ...p, obligatorio: e.target.checked }))} />
                  <label htmlFor="oblig" style={{ fontSize: "12px", color: "#555", cursor: "pointer" }}>Módulo obligatorio</label>
                </div>
                <button onClick={añadirModulo} style={{ ...S.btn("#3949ab", true), padding: "10px" }}>
                  AÑADIR MÓDULO ›
                </button>

                {/* Lista módulos custom */}
                {modulos.filter(m => m.custom).length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>MÓDULOS PERSONALIZADOS</div>
                    {modulos.filter(m => m.custom).map(m => (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f0e8", fontSize: "12px" }}>
                        <span>{m.nombre}</span>
                        <span style={{ color: "#aaa", fontFamily: "'Courier New', monospace", fontSize: "10px" }}>{m.area} · {m.horas}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Añadir empleado */}
              <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px 24px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>AÑADIR EMPLEADO</div>
                {[
                  { key: "nombre",       label: "NOMBRE COMPLETO",  placeholder: "Nombre Apellidos" },
                  { key: "departamento", label: "DEPARTAMENTO",     placeholder: "Ej: Almacén, Ventas..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label}</div>
                    <input value={formEmpleado[key]} onChange={e => setFormEmpleado(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }} />
                  </div>
                ))}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>ROL</div>
                  <select value={formEmpleado.rol} onChange={e => setFormEmpleado(p => ({ ...p, rol: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={añadirEmpleado} style={{ ...S.btn("#3949ab", true), padding: "10px" }}>
                  AÑADIR EMPLEADO ›
                </button>

                {/* Lista empleados */}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>EMPLEADOS REGISTRADOS ({empleados.length})</div>
                  {empleados.map(e => (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f0e8", fontSize: "12px" }}>
                      <span>{e.nombre}</span>
                      <span style={{ color: "#aaa", fontFamily: "'Courier New', monospace", fontSize: "10px" }}>{e.rol}</span>
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
