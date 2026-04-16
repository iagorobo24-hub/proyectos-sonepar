import { useState } from "react";

const MODULOS = [
  { id: "prl", area: "Seguridad", nombre: "PRL y Seguridad en Almacén", horas: 8, obligatorio: true },
  { id: "sga", area: "Sistemas", nombre: "Sistema de Gestión de Almacén (SGA)", horas: 12, obligatorio: true },
  { id: "picking", area: "Operaciones", nombre: "Técnicas de Picking y Preparación", horas: 6, obligatorio: true },
  { id: "electrico_basico", area: "Técnico", nombre: "Material Eléctrico — Nivel Básico", horas: 10, obligatorio: false },
  { id: "automatizacion", area: "Técnico", nombre: "Automatización y Variadores", horas: 16, obligatorio: false },
  { id: "ve", area: "Técnico", nombre: "Vehículo Eléctrico e Infraestructura", horas: 8, obligatorio: false },
  { id: "solar", area: "Técnico", nombre: "Energías Renovables y Solar FV", horas: 10, obligatorio: false },
  { id: "atencion_cliente", area: "Comercial", nombre: "Atención al Cliente Técnico", horas: 6, obligatorio: false },
  { id: "erp", area: "Sistemas", nombre: "ERP y Herramientas Digitales", horas: 8, obligatorio: false },
];

const EMPLEADOS_DEMO = [
  { id: 1, nombre: "María López", rol: "Operario Almacén", delegacion: "A Coruña", incorporacion: "01/09/2024", completados: ["prl", "sga", "picking", "electrico_basico"], enCurso: ["automatizacion"] },
  { id: 2, nombre: "Roberto Fernández", rol: "Técnico Mostrador", delegacion: "A Coruña", incorporacion: "15/03/2023", completados: ["prl", "sga", "picking", "electrico_basico", "automatizacion", "ve", "atencion_cliente"], enCurso: [] },
  { id: 3, nombre: "Ana Martínez", rol: "Responsable Logística", delegacion: "A Coruña", incorporacion: "10/01/2022", completados: ["prl", "sga", "picking", "electrico_basico", "automatizacion", "ve", "solar", "atencion_cliente", "erp"], enCurso: [] },
  { id: 4, nombre: "Carlos Díaz", rol: "Operario Almacén", delegacion: "A Coruña", incorporacion: "01/11/2025", completados: ["prl"], enCurso: ["sga", "picking"] },
  { id: 5, nombre: "Iago Robo", rol: "Técnico Automatización", delegacion: "A Coruña", incorporacion: "01/03/2026", completados: ["prl", "sga"], enCurso: ["automatizacion", "electrico_basico"] },
];

const AREA_COLORES = {
  "Seguridad": { bg: "#fff0f0", color: "#c62828", border: "#ef9a9a" },
  "Sistemas": { bg: "#e8f4fd", color: "#0d47a1", border: "#90caf9" },
  "Operaciones": { bg: "#fff8e1", color: "#e65100", border: "#ffcc80" },
  "Técnico": { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
  "Comercial": { bg: "#f3e5f5", color: "#4a148c", border: "#ce93d8" },
};

export default function FormacionInterna() {
  const [empleados, setEmpleados] = useState(EMPLEADOS_DEMO);
  const [vista, setVista] = useState("dashboard"); // dashboard | empleado | nuevo
  const [seleccionado, setSeleccionado] = useState(null);
  const [analisisIA, setAnalisisIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [nuevoEmp, setNuevoEmp] = useState({ nombre: "", rol: "", delegacion: "A Coruña", incorporacion: "" });

  const roles = ["Todos", ...new Set(EMPLEADOS_DEMO.map(e => e.rol))];

  const getPorcentaje = (emp) => {
    const total = MODULOS.length;
    const hechos = emp.completados.length;
    return Math.round((hechos / total) * 100);
  };

  const getObligatoriosPendientes = (emp) => {
    return MODULOS.filter(m => m.obligatorio && !emp.completados.includes(m.id)).length;
  };

  const toggleModulo = (empId, moduloId, tipo) => {
    setEmpleados(prev => prev.map(e => {
      if (e.id !== empId) return e;
      if (tipo === "completar") {
        return { ...e, completados: [...e.completados, moduloId], enCurso: e.enCurso.filter(x => x !== moduloId) };
      } else if (tipo === "iniciar") {
        if (e.enCurso.includes(moduloId) || e.completados.includes(moduloId)) return e;
        return { ...e, enCurso: [...e.enCurso, moduloId] };
      } else if (tipo === "quitar") {
        return { ...e, completados: e.completados.filter(x => x !== moduloId), enCurso: e.enCurso.filter(x => x !== moduloId) };
      }
      return e;
    }));
    if (seleccionado?.id === empId) {
      setSeleccionado(prev => {
        if (tipo === "completar") return { ...prev, completados: [...prev.completados, moduloId], enCurso: prev.enCurso.filter(x => x !== moduloId) };
        if (tipo === "iniciar") return { ...prev, enCurso: [...prev.enCurso, moduloId] };
        if (tipo === "quitar") return { ...prev, completados: prev.completados.filter(x => x !== moduloId), enCurso: prev.enCurso.filter(x => x !== moduloId) };
        return prev;
      });
    }
  };

  const generarPlanIA = async (emp) => {
    setCargandoIA(true);
    setAnalisisIA("");
    const completados = MODULOS.filter(m => emp.completados.includes(m.id)).map(m => m.nombre);
    const enCurso = MODULOS.filter(m => emp.enCurso.includes(m.id)).map(m => m.nombre);
    const pendientes = MODULOS.filter(m => !emp.completados.includes(m.id) && !emp.enCurso.includes(m.id)).map(m => m.nombre);

    const prompt = `Eres un responsable de formación de Sonepar España. Genera un plan de desarrollo personalizado en español para este empleado:

Empleado: ${emp.nombre}
Rol: ${emp.rol}
Delegación: ${emp.delegacion}
Fecha incorporación: ${emp.incorporacion}
Progreso general: ${getPorcentaje(emp)}%

Módulos completados: ${completados.join(", ") || "ninguno"}
En curso: ${enCurso.join(", ") || "ninguno"}
Pendientes: ${pendientes.join(", ") || "ninguno"}

Genera el plan con estas 4 secciones exactas (texto plano):
VALORACIÓN ACTUAL: [evaluación del progreso actual para su rol y tiempo en empresa]
PRIORIDAD INMEDIATA: [2 módulos concretos que debería empezar/completar primero y por qué]
PLAN A 3 MESES: [ruta de formación recomendada con orden lógico]
PERFIL OBJETIVO: [qué competencias tendrá cuando complete la formación recomendada]`;

    try {
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
      setAnalisisIA(data.content?.map(i => i.text || "").join("") || "");
    } catch { setAnalisisIA("Error al generar el plan."); }
    setCargandoIA(false);
  };

  const crearEmpleado = () => {
    if (!nuevoEmp.nombre || !nuevoEmp.rol) return;
    const nuevo = { id: Date.now(), ...nuevoEmp, completados: [], enCurso: [] };
    setEmpleados(p => [...p, nuevo]);
    setNuevoEmp({ nombre: "", rol: "", delegacion: "A Coruña", incorporacion: "" });
    setVista("dashboard");
  };

  const empFiltrados = empleados.filter(e => filtroRol === "Todos" || e.rol === filtroRol);

  const statsGlobal = {
    total: empleados.length,
    completoObligatorio: empleados.filter(e => getObligatoriosPendientes(e) === 0).length,
    promedioProgreso: Math.round(empleados.reduce((a, e) => a + getPorcentaje(e), 0) / empleados.length),
    horasTotales: empleados.reduce((a, e) => a + e.completados.reduce((b, mid) => b + (MODULOS.find(m => m.id === mid)?.horas || 0), 0), 0),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1a1a2e" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf6", padding: "0 36px", display: "flex", alignItems: "stretch", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ background: "#3949ab", padding: "18px 22px", display: "flex", alignItems: "center", marginRight: "24px" }}>
          <span style={{ fontWeight: "900", fontSize: "13px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#3949ab", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>FORMACIÓN INTERNA</span>
          <span style={{ color: "#bbb", fontSize: "10px", fontFamily: "'Courier New', monospace" }}>PLAN DE DESARROLLO · IA</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {[["dashboard", "▤ DASHBOARD"], ["nuevo", "+ EMPLEADO"]].map(([v, l]) => (
            <button key={v} onClick={() => { setVista(v); setSeleccionado(null); setAnalisisIA(""); }} style={{
              background: vista === v ? "#3949ab" : "transparent",
              color: vista === v ? "#fff" : "#888",
              border: "1px solid " + (vista === v ? "#3949ab" : "#e0e0e0"),
              padding: "8px 16px", fontFamily: "'Courier New', monospace",
              fontSize: "10px", letterSpacing: "2px", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPIs globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "#3949ab", gap: "1px" }}>
        {[
          { label: "EMPLEADOS", val: statsGlobal.total, unit: "" },
          { label: "OBLIGATORIO COMPLETO", val: statsGlobal.completoObligatorio, unit: `/ ${statsGlobal.total}` },
          { label: "PROGRESO MEDIO", val: statsGlobal.promedioProgreso, unit: "%" },
          { label: "HORAS FORMADAS", val: statsGlobal.horasTotales, unit: "h" },
        ].map(({ label, val, unit }) => (
          <div key={label} style={{ background: "#3949ab", padding: "18px 28px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label}</div>
            <div style={{ fontSize: "30px", fontWeight: "900", color: "#fff", lineHeight: 1 }}>{val}<span style={{ fontSize: "14px", fontWeight: "400", color: "rgba(255,255,255,0.5)", marginLeft: "3px" }}>{unit}</span></div>
          </div>
        ))}
      </div>

      <div style={{ padding: "28px 36px" }}>

        {/* DASHBOARD */}
        {vista === "dashboard" && !seleccionado && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>ROL:</span>
              {roles.map(r => (
                <button key={r} onClick={() => setFiltroRol(r)} style={{
                  padding: "5px 14px", fontSize: "10px", letterSpacing: "1px", fontFamily: "'Courier New', monospace",
                  background: filtroRol === r ? "#3949ab" : "#fff", color: filtroRol === r ? "#fff" : "#888",
                  border: "1px solid " + (filtroRol === r ? "#3949ab" : "#e0e0e0"), cursor: "pointer",
                }}>{r.toUpperCase()}</button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {empFiltrados.map(emp => {
                const pct = getPorcentaje(emp);
                const oblPend = getObligatoriosPendientes(emp);
                return (
                  <div key={emp.id} onClick={() => { setSeleccionado(emp); setVista("empleado"); setAnalisisIA(""); }}
                    style={{
                      background: "#fff", padding: "18px 24px", cursor: "pointer",
                      border: "1px solid #e8eaf6", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      display: "grid", gridTemplateColumns: "200px 120px 1fr 160px 120px",
                      alignItems: "center", gap: "20px", transition: "all 0.15s",
                      borderLeft: `4px solid ${oblPend > 0 ? "#ef5350" : pct === 100 ? "#43a047" : "#3949ab"}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(57,73,171,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}
                  >
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a2e", marginBottom: "2px" }}>{emp.nombre}</div>
                      <div style={{ fontSize: "11px", color: "#888" }}>{emp.rol}</div>
                    </div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#aaa" }}>{emp.incorporacion}</div>
                    <div>
                      <div style={{ height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden", marginBottom: "4px" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#43a047" : "#3949ab", borderRadius: "3px", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ fontSize: "10px", color: "#aaa" }}>{emp.completados.length} de {MODULOS.length} módulos</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: pct === 100 ? "#43a047" : "#3949ab" }}>{pct}%</div>
                    </div>
                    <div>
                      {oblPend > 0 ? (
                        <span style={{ background: "#fff5f5", color: "#c62828", border: "1px solid #ef9a9a", padding: "3px 10px", fontSize: "9px", fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>
                          {oblPend} OBLIG. PEND.
                        </span>
                      ) : (
                        <span style={{ background: "#e8f5e9", color: "#1b5e20", border: "1px solid #a5d6a7", padding: "3px 10px", fontSize: "9px", fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>
                          ✓ OBLIG. OK
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FICHA EMPLEADO */}
        {vista === "empleado" && seleccionado && (
          <div>
            <button onClick={() => { setVista("dashboard"); setSeleccionado(null); setAnalisisIA(""); }}
              style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "2px", padding: "0", marginBottom: "20px" }}>
              ‹ VOLVER AL DASHBOARD
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Info empleado */}
                <div style={{ background: "#fff", padding: "24px", border: "1px solid #e8eaf6", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e" }}>{seleccionado.nombre}</div>
                      <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>{seleccionado.rol} · {seleccionado.delegacion}</div>
                      <div style={{ fontSize: "11px", color: "#bbb", fontFamily: "'Courier New', monospace", marginTop: "3px" }}>Incorporación: {seleccionado.incorporacion}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "42px", fontWeight: "900", color: "#3949ab", lineHeight: 1 }}>{getPorcentaje(seleccionado)}%</div>
                      <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>COMPLETADO</div>
                    </div>
                  </div>
                  <div style={{ height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${getPorcentaje(seleccionado)}%`, background: "linear-gradient(90deg, #3949ab, #7986cb)", borderRadius: "4px", transition: "width 0.5s" }} />
                  </div>
                </div>

                {/* Módulos por área */}
                {["Seguridad", "Sistemas", "Operaciones", "Técnico", "Comercial"].map(area => {
                  const mods = MODULOS.filter(m => m.area === area);
                  const col = AREA_COLORES[area];
                  return (
                    <div key={area} style={{ background: "#fff", border: "1px solid #e8eaf6", overflow: "hidden" }}>
                      <div style={{ background: col.bg, padding: "10px 20px", borderBottom: `1px solid ${col.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "9px", letterSpacing: "2px", color: col.color, fontFamily: "'Courier New', monospace", fontWeight: "700" }}>{area.toUpperCase()}</span>
                        <span style={{ fontSize: "10px", color: col.color, opacity: 0.7 }}>
                          {mods.filter(m => seleccionado.completados.includes(m.id)).length}/{mods.length} completados
                        </span>
                      </div>
                      {mods.map(mod => {
                        const completado = seleccionado.completados.includes(mod.id);
                        const enCurso = seleccionado.enCurso.includes(mod.id);
                        return (
                          <div key={mod.id} style={{
                            display: "flex", alignItems: "center", padding: "12px 20px",
                            borderBottom: "1px solid #f5f5f5", gap: "12px",
                            background: completado ? "#f8fff8" : enCurso ? "#f0f4ff" : "#fff",
                          }}>
                            <div style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                              background: completado ? "#43a047" : enCurso ? "#3949ab" : "#e0e0e0",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "10px", color: "#fff", fontWeight: "700",
                            }}>
                              {completado ? "✓" : enCurso ? "▶" : ""}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "13px", color: completado ? "#2e7d32" : "#1a1a2e", fontWeight: completado ? "600" : "400" }}>
                                {mod.nombre}
                                {mod.obligatorio && <span style={{ marginLeft: "6px", fontSize: "9px", color: "#c62828", fontFamily: "'Courier New', monospace" }}>OBLIG.</span>}
                              </div>
                              <div style={{ fontSize: "10px", color: "#aaa" }}>{mod.horas}h · {mod.area}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {!completado && !enCurso && (
                                <button onClick={() => toggleModulo(seleccionado.id, mod.id, "iniciar")}
                                  style={{ padding: "4px 10px", fontSize: "9px", letterSpacing: "1px", fontFamily: "'Courier New', monospace", background: "#f0f4ff", color: "#3949ab", border: "1px solid #c5cae9", cursor: "pointer" }}>
                                  INICIAR
                                </button>
                              )}
                              {enCurso && (
                                <button onClick={() => toggleModulo(seleccionado.id, mod.id, "completar")}
                                  style={{ padding: "4px 10px", fontSize: "9px", letterSpacing: "1px", fontFamily: "'Courier New', monospace", background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7", cursor: "pointer" }}>
                                  COMPLETAR ✓
                                </button>
                              )}
                              {(completado || enCurso) && (
                                <button onClick={() => toggleModulo(seleccionado.id, mod.id, "quitar")}
                                  style={{ padding: "4px 8px", fontSize: "9px", fontFamily: "'Courier New', monospace", background: "#fff", color: "#ccc", border: "1px solid #eee", cursor: "pointer" }}>
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Panel IA */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#3949ab", padding: "20px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>PLAN DE DESARROLLO IA</div>
                  <button onClick={() => generarPlanIA(seleccionado)} disabled={cargandoIA} style={{
                    width: "100%", background: cargandoIA ? "rgba(255,255,255,0.1)" : "#fff",
                    color: cargandoIA ? "rgba(255,255,255,0.4)" : "#3949ab",
                    border: "none", padding: "12px", fontSize: "11px", letterSpacing: "2px",
                    fontFamily: "'Courier New', monospace", cursor: cargandoIA ? "not-allowed" : "pointer", fontWeight: "700",
                  }}>
                    {cargandoIA ? "ANALIZANDO..." : "◈ GENERAR PLAN PERSONALIZADO"}
                  </button>
                  {analisisIA && (
                    <div style={{ marginTop: "16px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                      {analisisIA}
                    </div>
                  )}
                </div>

                {/* Stats rápidas */}
                <div style={{ background: "#fff", padding: "20px", border: "1px solid #e8eaf6" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "14px" }}>RESUMEN HORAS</div>
                  {["Seguridad", "Sistemas", "Operaciones", "Técnico", "Comercial"].map(area => {
                    const mods = MODULOS.filter(m => m.area === area);
                    const hComp = mods.filter(m => seleccionado.completados.includes(m.id)).reduce((a, m) => a + m.horas, 0);
                    const hTotal = mods.reduce((a, m) => a + m.horas, 0);
                    const col = AREA_COLORES[area];
                    return (
                      <div key={area} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "10px", color: "#888" }}>{area}</span>
                          <span style={{ fontSize: "10px", fontFamily: "'Courier New', monospace", color: col.color }}>{hComp}h / {hTotal}h</span>
                        </div>
                        <div style={{ height: "4px", background: "#f0f0f0", borderRadius: "2px" }}>
                          <div style={{ height: "100%", width: `${(hComp / hTotal) * 100}%`, background: col.color, borderRadius: "2px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NUEVO EMPLEADO */}
        {vista === "nuevo" && (
          <div style={{ maxWidth: "520px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "24px" }}>REGISTRAR NUEVO EMPLEADO</div>
            <div style={{ background: "#fff", padding: "32px", border: "1px solid #e8eaf6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                { key: "nombre", label: "Nombre completo", ph: "Ej: Juan García Pérez" },
                { key: "rol", label: "Rol / Puesto", ph: "Ej: Técnico Mostrador" },
                { key: "incorporacion", label: "Fecha incorporación", ph: "DD/MM/AAAA" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label.toUpperCase()}</div>
                  <input value={nuevoEmp[key]} onChange={e => setNuevoEmp(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e0e0e0", fontSize: "14px", outline: "none", fontFamily: "system-ui", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={crearEmpleado} disabled={!nuevoEmp.nombre || !nuevoEmp.rol} style={{
                background: !nuevoEmp.nombre || !nuevoEmp.rol ? "#e0e0e0" : "#3949ab",
                color: "#fff", border: "none", padding: "14px",
                fontSize: "11px", letterSpacing: "3px", fontFamily: "'Courier New', monospace",
                cursor: !nuevoEmp.nombre || !nuevoEmp.rol ? "not-allowed" : "pointer", fontWeight: "700",
              }}>REGISTRAR EMPLEADO ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
