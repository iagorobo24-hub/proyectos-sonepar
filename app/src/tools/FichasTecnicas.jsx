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

const CATEGORIAS = ["Todas", "Variadores", "Contactores", "Sensores", "PLCs", "Protección", "Cables", "Automatización"];

const ACCESOS_RAPIDOS = [
  "Variador ATV320 2.2kW monofásico",
  "Contactor LC1D40 bobina 220V",
  "Sensor inductivo IF5932 M12",
  "PLC Modicon M241 24E/S",
  "Guardamotor GV2ME10 4-6.3A",
  "Relé de fase RM35TF30",
];

const PROMPT_FICHA = (consulta) => `Eres un técnico especialista en material eléctrico e industrial de Sonepar España con 15 años de experiencia. El técnico de mostrador te consulta sobre: "${consulta}"\n\nSi la consulta es demasiado vaga para identificar un producto concreto (una sola palabra genérica, síntoma sin contexto, o descripción que aplica a decenas de productos), responde ÚNICAMENTE con este JSON:\n{"error": true, "mensaje": "descripción breve del problema con la consulta", "sugerencias": ["consulta más específica 1", "consulta más específica 2", "consulta más específica 3"]}\n\nSi la consulta identifica un producto concreto, responde ÚNICAMENTE con este JSON (sin backticks ni markdown):\n{\n  "nombre": "nombre comercial completo",\n  "referencia": "referencia fabricante",\n  "fabricante": "fabricante",\n  "categoria": "categoría",\n  "precio_orientativo": "rango orientativo en € sin IVA (ej: 45–65€)",\n  "descripcion": "descripción técnica de 2-3 frases",\n  "caracteristicas": ["característica técnica 1", "característica técnica 2", "característica técnica 3", "característica técnica 4"],\n  "aplicaciones": ["aplicación 1", "aplicación 2", "aplicación 3"],\n  "compatibilidades": ["compatible con 1", "compatible con 2"],\n  "normas": ["norma 1", "norma 2"],\n  "consejo_tecnico": "consejo práctico de instalación o selección en 1-2 frases",\n  "nivel_stock": "Alto / Medio / Bajo",\n  "tiempo_entrega": "plazo orientativo"\n}`;

const PROMPT_COMPARATIVA = (fichaA, fichaB) => `Eres un técnico especialista en material eléctrico de Sonepar España. Compara estos dos productos para ayudar al técnico de mostrador a recomendar uno al cliente.\n\nProducto A: ${fichaA.nombre} (${fichaA.referencia})\nProducto B: ${fichaB.nombre} (${fichaB.referencia})\n\nResponde ÚNICAMENTE con este JSON (sin backticks ni markdown):\n{\n  "resumen": "frase de resumen de la comparativa",\n  "criterios": [\n    {"criterio": "nombre del criterio", "producto_a": "valor o descripción para A", "producto_b": "valor o descripción para B", "ventaja": "A o B o empate"},\n    {"criterio": "Precio", "producto_a": "${fichaA.precio_orientativo || 'N/D'}", "producto_b": "${fichaB.precio_orientativo || 'N/D'}", "ventaja": "A o B o empate"},\n    {"criterio": "Disponibilidad stock", "producto_a": "${fichaA.nivel_stock}", "producto_b": "${fichaB.nivel_stock}", "ventaja": "A o B o empate"}\n  ],\n  "recomendacion_general": "recomendación clara de cuál elegir y en qué contexto",\n  "casos_uso_a": "cuándo elegir el producto A",\n  "casos_uso_b": "cuándo elegir el producto B"\n}\nIncluye entre 5 y 7 criterios relevantes para estos productos específicos.`;

// ── Stock badge ────────────────────────────────────────────────────────────
const StockBadge = ({ nivel }) => {
  const cfg = {
    "Alto":  { bg: C.optimalBg, color: C.optimal },
    "Medio": { bg: C.acceptBg,  color: C.accept  },
    "Bajo":  { bg: C.criticalBg, color: C.critical },
  };
  const { bg, color } = cfg[nivel] || cfg["Medio"];
  return (
    <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: bg, color, letterSpacing: "0.5px" }}>
      {nivel}
    </span>
  );
};

export default function FichasTecnicas() {
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [modo, setModo] = useState("busqueda");
  const [comparativa, setComparativa] = useState({ a: null, b: null });
  const [resultadoComp, setResultadoComp] = useState(null);
  const [cargandoComp, setCargandoComp] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const h = localStorage.getItem("sonepar_fichas_historial");
      if (h) setHistorial(JSON.parse(h));
    } catch {}
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const guardarHistorial = (query, ficha) => {
    const yaExiste = historial.some(h => h.resultado?.referencia === ficha.referencia);
    if (yaExiste) return;
    const nueva = { query, resultado: ficha, ts: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) };
    const nuevo = [nueva, ...historial].slice(0, 10);
    setHistorial(nuevo);
    try { localStorage.setItem("sonepar_fichas_historial", JSON.stringify(nuevo)); } catch {}
  };

  const buscar = async (q = consulta) => {
    if (!q.trim()) return;
    setCargando(true); setResultado(null); setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_FICHA(q) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (parsed.error) { setError(parsed); }
      else { setResultado(parsed); guardarHistorial(q, parsed); }
    } catch { setError({ error: true, mensaje: "Error al procesar la respuesta.", sugerencias: [] }); }
    setCargando(false);
  };

  const copiarFicha = () => {
    if (!resultado) return;
    const txt = [
      `FICHA TÉCNICA — ${resultado.nombre}`,
      `Referencia: ${resultado.referencia}`,
      `Fabricante: ${resultado.fabricante}`,
      `Categoría: ${resultado.categoria}`,
      resultado.precio_orientativo ? `Precio orientativo: ${resultado.precio_orientativo} (sin IVA)` : "",
      "", resultado.descripcion, "",
      "CARACTERÍSTICAS:", ...(resultado.caracteristicas || []).map(c => `· ${c}`),
      "", "APLICACIONES:", ...(resultado.aplicaciones || []).map(a => `· ${a}`),
      "", "NORMATIVAS:", ...(resultado.normas || []).map(n => `· ${n}`),
      "", `CONSEJO TÉCNICO: ${resultado.consejo_tecnico}`,
      "", "⚠ Precios y stock orientativos. Verificar disponibilidad y precios reales con Sonepar antes de presupuestar.",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(txt).then(() => showToast("Ficha copiada al portapapeles"));
  };

  const añadirAComparativa = (ficha) => {
    if (!comparativa.a) {
      setComparativa({ a: ficha, b: null }); setModo("comparativa");
      showToast("Producto A seleccionado — busca el producto B");
    } else if (!comparativa.b && ficha.referencia !== comparativa.a.referencia) {
      setComparativa(p => ({ ...p, b: ficha })); setModo("comparativa");
    } else { showToast("Ya tienes dos productos seleccionados"); }
  };

  const generarComparativa = async () => {
    if (!comparativa.a || !comparativa.b) return;
    setCargandoComp(true); setResultadoComp(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_COMPARATIVA(comparativa.a, comparativa.b) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      setResultadoComp(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch { showToast("Error al generar la comparativa"); }
    setCargandoComp(false);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui,-apple-system,sans-serif; }
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: C.navy, color: C.white, padding: "12px 20px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,48,135,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: C.bg, color: C.textPri,
        fontFamily: "system-ui,-apple-system,sans-serif" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="no-print" style={{ background: C.navy, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.blue}, #7BB8F0, ${C.blue})` }} />
          <div style={{ padding: "0 28px", display: "flex", alignItems: "center", height: 56, gap: 16 }}>
            <SvgLogo />
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>Fichas Técnicas</div>
              <div style={{ color: C.blue, fontSize: 10, letterSpacing: "1px", marginTop: 1 }}>
                SONEPAR ESPAÑA · ASISTENTE v3
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => setModo("busqueda")}
              style={{ padding: "6px 16px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer", letterSpacing: "0.8px",
                background: modo === "busqueda" ? C.blue : "rgba(255,255,255,0.1)", color: C.white }}>
              BÚSQUEDA
            </button>
            <button onClick={() => setModo("comparativa")}
              style={{ padding: "6px 16px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer", letterSpacing: "0.8px",
                background: modo === "comparativa" ? C.blue : "rgba(255,255,255,0.1)", color: C.white }}>
              COMPARATIVA {(comparativa.a || comparativa.b) ? `(${[comparativa.a, comparativa.b].filter(Boolean).length}/2)` : ""}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 59px)" }}>

          {/* ── Sidebar ───────────────────────────────────── */}
          <div className="no-print" style={{ background: C.white, borderRight: `1px solid ${C.border}`,
            padding: 20, overflowY: "auto" }}>

            <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: "1.5px", marginBottom: 8 }}>
              CATEGORÍAS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => setCategoria(c)}
                  style={{ padding: "7px 12px", textAlign: "left", fontSize: 13, cursor: "pointer",
                    borderRadius: 6, border: "none", transition: "all 0.15s",
                    background: categoria === c ? C.navy : "transparent",
                    color: categoria === c ? C.white : C.textSec,
                    fontWeight: categoria === c ? 700 : 400 }}>
                  {c}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: "1.5px", marginBottom: 8 }}>
              ACCESOS RÁPIDOS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
              {ACCESOS_RAPIDOS.map(a => (
                <button key={a} onClick={() => { setConsulta(a); buscar(a); }}
                  style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, cursor: "pointer",
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                    color: C.textSec, lineHeight: 1.4, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}>
                  {a}
                </button>
              ))}
            </div>

            {historial.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: "1.5px" }}>
                    HISTORIAL ({historial.length})
                  </div>
                  <button onClick={() => { setHistorial([]); try { localStorage.removeItem("sonepar_fichas_historial"); } catch {} }}
                    style={{ fontSize: 10, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>
                    Limpiar
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {historial.map((h, i) => (
                    <div key={i} onClick={() => { setResultado(h.resultado); setError(null); setModo("busqueda"); }}
                      style={{ padding: "8px 10px", fontSize: 11, cursor: "pointer",
                        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, color: C.textPri, marginBottom: 2, fontSize: 11 }}>
                        {h.resultado?.nombre?.slice(0, 28)}...
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>
                        {h.ts} · {h.resultado?.referencia}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Contenido principal ───────────────────────── */}
          <div style={{ padding: "24px 28px", overflowY: "auto" }}>

            {/* ════ BÚSQUEDA ════ */}
            {modo === "busqueda" && (
              <>
                {/* Buscador */}
                <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <input value={consulta} onChange={e => setConsulta(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && buscar()}
                    placeholder="Introduce referencia, nombre o descripción del producto..."
                    style={{ flex: 1, padding: "11px 16px", border: `1px solid ${C.border}`, borderRadius: 6,
                      fontSize: 14, color: C.textPri, outline: "none", background: C.white,
                      fontFamily: "system-ui,sans-serif" }} />
                  <button onClick={() => buscar()} disabled={cargando}
                    style={{ padding: "11px 24px", border: "none", borderRadius: 6,
                      background: cargando ? C.border : C.navy, color: C.white,
                      fontSize: 12, fontWeight: 700, cursor: cargando ? "default" : "pointer",
                      letterSpacing: "0.8px" }}>
                    {cargando ? "Buscando..." : "Buscar ›"}
                  </button>
                </div>

                {/* Error / sugerencias */}
                {error && (
                  <div style={{ background: C.acceptBg, border: `1px solid ${C.accept}30`,
                    borderLeft: `4px solid ${C.accept}`, borderRadius: 8, padding: "18px 22px", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.accept, letterSpacing: "1px", marginBottom: 6 }}>
                      ⚠ CONSULTA DEMASIADO VAGA
                    </div>
                    <div style={{ fontSize: 13, color: C.textSec, marginBottom: 14 }}>{error.mensaje}</div>
                    {error.sugerencias?.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px", marginBottom: 8 }}>
                          PRUEBA CON:
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {error.sugerencias.map((s, i) => (
                            <button key={i} onClick={() => { setConsulta(s); buscar(s); }}
                              style={{ padding: "7px 14px", border: `1px solid ${C.accept}`, borderRadius: 5,
                                background: C.white, color: C.accept, fontSize: 11, fontWeight: 600,
                                cursor: "pointer" }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Resultado */}
                {resultado && !error && (
                  <div>
                    {/* Header ficha */}
                    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`,
                      borderLeft: `4px solid ${C.navy}`, padding: "18px 24px", marginBottom: 1,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1.5px", marginBottom: 4 }}>
                            {resultado.categoria?.toUpperCase()}
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: C.textPri,
                            lineHeight: 1.2, marginBottom: 8 }}>{resultado.nombre}</div>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: C.textMuted }}>REF: {resultado.referencia}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{resultado.fabricante}</span>
                            {resultado.precio_orientativo && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>
                                {resultado.precio_orientativo} (sin IVA)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="no-print" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={copiarFicha}
                            style={{ padding: "7px 14px", border: `1px solid ${C.border}`, borderRadius: 5,
                              background: C.white, color: C.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Copiar
                          </button>
                          <button onClick={() => window.print()}
                            style={{ padding: "7px 14px", border: `1px solid ${C.border}`, borderRadius: 5,
                              background: C.white, color: C.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            PDF
                          </button>
                          <button onClick={() => añadirAComparativa(resultado)}
                            style={{ padding: "7px 14px", border: "none", borderRadius: 5,
                              background: C.navy, color: C.white, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            + Comparar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stock & entrega */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none",
                      padding: "10px 24px", marginBottom: 1, display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px" }}>STOCK</span>
                        <StockBadge nivel={resultado.nivel_stock} />
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "1px" }}>ENTREGA</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>{resultado.tiempo_entrega}</span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none",
                      padding: "14px 24px", marginBottom: 1 }}>
                      <div style={{ fontSize: 13, color: C.textPri, lineHeight: 1.7 }}>{resultado.descripcion}</div>
                    </div>

                    {/* Grid de specs */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 1 }}>
                      {[
                        { titulo: "CARACTERÍSTICAS TÉCNICAS", items: resultado.caracteristicas },
                        { titulo: "APLICACIONES",             items: resultado.aplicaciones    },
                        { titulo: "COMPATIBILIDADES",         items: resultado.compatibilidades },
                        { titulo: "NORMATIVAS",               items: resultado.normas           },
                      ].map(({ titulo, items }) => (
                        <div key={titulo} style={{ background: C.white, border: `1px solid ${C.border}`,
                          padding: "16px 20px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.navy,
                            letterSpacing: "1.5px", marginBottom: 10 }}>{titulo}</div>
                          {(items || []).map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                              <span style={{ color: C.blue, fontSize: 14, flexShrink: 0, marginTop: 1 }}>–</span>
                              <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Consejo técnico */}
                    <div style={{ background: C.blueBg, border: `1px solid ${C.blue}30`,
                      borderLeft: `4px solid ${C.blue}`, borderRadius: "0 0 8px 8px",
                      padding: "14px 20px", marginBottom: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.navy,
                        letterSpacing: "1.5px", marginBottom: 7 }}>◈ CONSEJO TÉCNICO</div>
                      <div style={{ fontSize: 13, color: C.textPri, lineHeight: 1.6 }}>{resultado.consejo_tecnico}</div>
                    </div>

                    {/* Disclaimer */}
                    <div style={{ background: C.acceptBg, border: `1px solid ${C.accept}20`,
                      borderLeft: `4px solid ${C.accept}`, borderRadius: 6, padding: "11px 18px" }}>
                      <div style={{ fontSize: 11, color: C.accept, lineHeight: 1.5 }}>
                        <strong>⚠ Precios y stock orientativos.</strong> Los datos de precio, disponibilidad y tiempo de entrega son estimaciones generadas con IA. Verificar disponibilidad y precios reales con Sonepar antes de presentar cualquier presupuesto al cliente.
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado vacío */}
                {!resultado && !error && !cargando && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                    height: 280, flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 48, opacity: 0.08 }}>◈</div>
                    <div style={{ fontSize: 12, color: C.textMuted, letterSpacing: "1.5px" }}>
                      INTRODUCE UNA REFERENCIA O DESCRIPCIÓN
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ════ COMPARATIVA ════ */}
            {modo === "comparativa" && (
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "1px", marginBottom: 20 }}>
                  MODO COMPARATIVA
                </div>

                {/* Slots */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {["a", "b"].map((slot) => {
                    const ficha = comparativa[slot];
                    return (
                      <div key={slot} style={{ background: C.white, borderRadius: 8,
                        border: `2px solid ${ficha ? C.navy : C.border}`, padding: "16px 20px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.navy,
                          letterSpacing: "1.5px", marginBottom: 10 }}>PRODUCTO {slot.toUpperCase()}</div>
                        {ficha ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{ficha.nombre}</div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>{ficha.referencia}</div>
                            <button onClick={() => { setComparativa(p => ({ ...p, [slot]: null })); setResultadoComp(null); }}
                              style={{ padding: "5px 12px", border: `1px solid ${C.critical}30`, borderRadius: 5,
                                background: C.criticalBg, color: C.critical, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                              Quitar
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                            Ve a búsqueda y pulsa <strong style={{ color: C.navy }}>+ Comparar</strong> en una ficha
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {comparativa.a && comparativa.b && !resultadoComp && (
                  <button onClick={generarComparativa} disabled={cargandoComp}
                    style={{ padding: "11px 28px", border: "none", borderRadius: 6, marginBottom: 20,
                      background: cargandoComp ? C.border : C.navy, color: C.white,
                      fontSize: 12, fontWeight: 700, cursor: cargandoComp ? "default" : "pointer" }}>
                    {cargandoComp ? "Generando comparativa..." : "Generar comparativa IA ›"}
                  </button>
                )}

                {resultadoComp && (
                  <div>
                    {/* Resumen */}
                    <div style={{ background: C.blueBg, border: `1px solid ${C.blue}30`,
                      borderLeft: `4px solid ${C.blue}`, borderRadius: 8, padding: "14px 20px", marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: C.textPri, fontStyle: "italic" }}>
                        {resultadoComp.resumen}
                      </div>
                    </div>

                    {/* Tabla de criterios */}
                    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`,
                      overflow: "hidden", marginBottom: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr",
                        background: C.navy, padding: "10px 16px", fontSize: 10, letterSpacing: "1.5px", color: "#8A9CC2" }}>
                        <div>CRITERIO</div>
                        <div style={{ color: "#81C784" }}>A · {comparativa.a?.nombre?.slice(0, 18)}</div>
                        <div style={{ color: "#FFB74D" }}>B · {comparativa.b?.nombre?.slice(0, 18)}</div>
                      </div>
                      {(resultadoComp.criterios || []).map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr",
                          padding: "11px 16px", borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.textPri }}>{c.criterio}</div>
                          <div style={{ padding: "6px 10px", borderRadius: 5, fontSize: 12, color: C.textSec,
                            background: c.ventaja === "A" ? C.optimalBg : "transparent",
                            display: "flex", gap: 6, alignItems: "center" }}>
                            {c.ventaja === "A" && <span style={{ color: C.optimal, fontWeight: 800 }}>▶</span>}
                            {c.producto_a}
                          </div>
                          <div style={{ padding: "6px 10px", borderRadius: 5, fontSize: 12, color: C.textSec,
                            background: c.ventaja === "B" ? C.optimalBg : "transparent",
                            display: "flex", gap: 6, alignItems: "center" }}>
                            {c.ventaja === "B" && <span style={{ color: C.optimal, fontWeight: 800 }}>▶</span>}
                            {c.producto_b}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recomendaciones */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      {[
                        { titulo: "RECOMENDACIÓN GENERAL", contenido: resultadoComp.recomendacion_general, color: C.navy   },
                        { titulo: "CUÁNDO ELEGIR A",       contenido: resultadoComp.casos_uso_a,           color: C.blueMid },
                        { titulo: "CUÁNDO ELEGIR B",       contenido: resultadoComp.casos_uso_b,           color: C.accept  },
                      ].map(({ titulo, contenido, color }) => (
                        <div key={titulo} style={{ background: C.white, borderRadius: 8,
                          border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, padding: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "1.5px", marginBottom: 8 }}>
                            {titulo}
                          </div>
                          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>{contenido}</div>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => { setComparativa({ a: null, b: null }); setResultadoComp(null); }}
                      style={{ marginTop: 12, padding: "7px 16px", border: `1px solid ${C.border}`,
                        borderRadius: 5, background: C.white, color: C.textSec, fontSize: 11, cursor: "pointer" }}>
                      Nueva comparativa
                    </button>
                  </div>
                )}

                {(!comparativa.a || !comparativa.b) && !resultadoComp && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
                      Ve a la pestaña <strong>Búsqueda</strong>, encuentra un producto y pulsa el botón <strong style={{ color: C.navy }}>+ Comparar</strong> para añadirlo a los slots.
                    </div>
                    <button onClick={() => setModo("busqueda")}
                      style={{ padding: "9px 20px", border: "none", borderRadius: 6, alignSelf: "flex-start",
                        background: C.navy, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Ir a búsqueda ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
