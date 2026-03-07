import { useState, useEffect } from "react";

const CATEGORIAS = ["Todas", "Variadores", "Contactores", "Sensores", "PLCs", "Protección", "Cables", "Automatización"];

const ACCESOS_RAPIDOS = [
  "Variador ATV320 2.2kW monofásico",
  "Contactor LC1D40 bobina 220V",
  "Sensor inductivo IF5932 M12",
  "PLC Modicon M241 24E/S",
  "Guardamotor GV2ME10 4-6.3A",
  "Relé de fase RM35TF30",
];

const PROMPT_FICHA = (consulta) => `Eres un técnico especialista en material eléctrico e industrial de Sonepar España con 15 años de experiencia. El técnico de mostrador te consulta sobre: "${consulta}"

Si la consulta es demasiado vaga para identificar un producto concreto (una sola palabra genérica, síntoma sin contexto, o descripción que aplica a decenas de productos), responde ÚNICAMENTE con este JSON:
{"error": true, "mensaje": "descripción breve del problema con la consulta", "sugerencias": ["consulta más específica 1", "consulta más específica 2", "consulta más específica 3"]}

Si la consulta identifica un producto concreto, responde ÚNICAMENTE con este JSON (sin backticks ni markdown):
{
  "nombre": "nombre comercial completo",
  "referencia": "referencia fabricante",
  "fabricante": "fabricante",
  "categoria": "categoría",
  "precio_orientativo": "rango orientativo en € sin IVA (ej: 45–65€)",
  "descripcion": "descripción técnica de 2-3 frases",
  "caracteristicas": ["característica técnica 1", "característica técnica 2", "característica técnica 3", "característica técnica 4"],
  "aplicaciones": ["aplicación 1", "aplicación 2", "aplicación 3"],
  "compatibilidades": ["compatible con 1", "compatible con 2"],
  "normas": ["norma 1", "norma 2"],
  "consejo_tecnico": "consejo práctico de instalación o selección en 1-2 frases",
  "nivel_stock": "Alto / Medio / Bajo",
  "tiempo_entrega": "plazo orientativo"
}`;

const PROMPT_COMPARATIVA = (fichaA, fichaB) => `Eres un técnico especialista en material eléctrico de Sonepar España. Compara estos dos productos para ayudar al técnico de mostrador a recomendar uno al cliente.

Producto A: ${fichaA.nombre} (${fichaA.referencia})
Producto B: ${fichaB.nombre} (${fichaB.referencia})

Responde ÚNICAMENTE con este JSON (sin backticks ni markdown):
{
  "resumen": "frase de resumen de la comparativa",
  "criterios": [
    {"criterio": "nombre del criterio", "producto_a": "valor o descripción para A", "producto_b": "valor o descripción para B", "ventaja": "A o B o empate"},
    {"criterio": "Precio", "producto_a": "${fichaA.precio_orientativo || 'N/D'}", "producto_b": "${fichaB.precio_orientativo || 'N/D'}", "ventaja": "A o B o empate"},
    {"criterio": "Disponibilidad stock", "producto_a": "${fichaA.nivel_stock}", "producto_b": "${fichaB.nivel_stock}", "ventaja": "A o B o empate"}
  ],
  "recomendacion_general": "recomendación clara de cuál elegir y en qué contexto",
  "casos_uso_a": "cuándo elegir el producto A",
  "casos_uso_b": "cuándo elegir el producto B"
}
Incluye entre 5 y 7 criterios relevantes para estos productos específicos.`;

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
    setCargando(true);
    setResultado(null);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_FICHA(q) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (parsed.error) {
        setError(parsed);
      } else {
        setResultado(parsed);
        guardarHistorial(q, parsed);
      }
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
      "",
      resultado.descripcion,
      "",
      "CARACTERÍSTICAS:",
      ...(resultado.caracteristicas || []).map(c => `· ${c}`),
      "",
      "APLICACIONES:",
      ...(resultado.aplicaciones || []).map(a => `· ${a}`),
      "",
      "NORMATIVAS:",
      ...(resultado.normas || []).map(n => `· ${n}`),
      "",
      `CONSEJO TÉCNICO: ${resultado.consejo_tecnico}`,
      "",
      "⚠ Precios y stock orientativos. Verificar disponibilidad y precios reales con Sonepar antes de presupuestar.",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(txt).then(() => showToast("Ficha copiada al portapapeles"));
  };

  const imprimirPDF = () => window.print();

  const añadirAComparativa = (ficha) => {
    if (!comparativa.a) {
      setComparativa({ a: ficha, b: null });
      setModo("comparativa");
      showToast("Producto A seleccionado — busca el producto B");
    } else if (!comparativa.b && ficha.referencia !== comparativa.a.referencia) {
      setComparativa(p => ({ ...p, b: ficha }));
      setModo("comparativa");
    } else {
      showToast("Ya tienes dos productos seleccionados");
    }
  };

  const generarComparativa = async () => {
    if (!comparativa.a || !comparativa.b) return;
    setCargandoComp(true);
    setResultadoComp(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_COMPARATIVA(comparativa.a, comparativa.b) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      setResultadoComp(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch { showToast("Error al generar la comparativa"); }
    setCargandoComp(false);
  };

  const S = {
    btn: (color = "#1a1a2e", full = false) => ({
      padding: "9px 20px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: color, color: "#fff", border: "none", cursor: "pointer",
      width: full ? "100%" : "auto",
    }),
    btnOutline: (color = "#1a1a2e") => ({
      padding: "7px 14px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer",
    }),
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a1a2e", color: "#e8a020", padding: "12px 20px", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Georgia', serif", color: "#1a1a2e" }}>

        <div className="no-print" style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: "3px solid #1a6040" }}>
          <div style={{ background: "#1a6040", padding: "16px 22px", display: "flex", alignItems: "center", marginRight: "20px" }}>
            <span style={{ fontWeight: "900", fontSize: "12px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <span style={{ color: "#4caf82", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>FICHAS TÉCNICAS</span>
            <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>ASISTENTE · v2</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setModo("busqueda")} style={{ ...S.btn(modo === "busqueda" ? "#1a6040" : "#2a2a3e") }}>BÚSQUEDA</button>
            <button onClick={() => setModo("comparativa")} style={{ ...S.btn(modo === "comparativa" ? "#1a6040" : "#2a2a3e") }}>
              COMPARATIVA {(comparativa.a || comparativa.b) ? `(${[comparativa.a, comparativa.b].filter(Boolean).length}/2)` : ""}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "calc(100vh - 67px)" }}>

          <div className="no-print" style={{ background: "#fff", borderRight: "1px solid #e0dbd4", padding: "20px", overflowY: "auto" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>CATEGORÍAS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "20px" }}>
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => setCategoria(c)}
                  style={{ padding: "7px 12px", textAlign: "left", fontSize: "12px", fontFamily: "'Georgia', serif", cursor: "pointer", background: categoria === c ? "#1a6040" : "transparent", color: categoria === c ? "#fff" : "#555", border: "none", fontWeight: categoria === c ? "700" : "400" }}>
                  {c}
                </button>
              ))}
            </div>

            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>ACCESOS RÁPIDOS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
              {ACCESOS_RAPIDOS.map(a => (
                <button key={a} onClick={() => { setConsulta(a); buscar(a); }}
                  style={{ padding: "8px 10px", textAlign: "left", fontSize: "11px", fontFamily: "'Courier New', monospace", cursor: "pointer", background: "#f4f1ec", color: "#555", border: "none", letterSpacing: "0.5px", lineHeight: "1.4" }}>
                  {a}
                </button>
              ))}
            </div>

            {historial.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>HISTORIAL ({historial.length})</div>
                  <button onClick={() => { setHistorial([]); try { localStorage.removeItem("sonepar_fichas_historial"); } catch {} }}
                    style={{ fontSize: "9px", color: "#ccc", fontFamily: "'Courier New', monospace", background: "none", border: "none", cursor: "pointer" }}>
                    LIMPIAR
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {historial.map((h, i) => (
                    <div key={i} onClick={() => { setResultado(h.resultado); setError(null); setModo("busqueda"); }}
                      style={{ padding: "8px 10px", fontSize: "11px", cursor: "pointer", background: "#fdfcfa", border: "1px solid #f0ebe0", color: "#555" }}>
                      <div style={{ fontWeight: "600", color: "#1a1a2e", marginBottom: "2px", fontSize: "10px" }}>{h.resultado?.nombre?.slice(0, 30)}...</div>
                      <div style={{ fontSize: "9px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{h.ts} · {h.resultado?.referencia}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ padding: "24px 32px", overflowY: "auto" }}>

            {modo === "busqueda" && (
              <>
                <div className="no-print" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  <input value={consulta} onChange={e => setConsulta(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && buscar()}
                    placeholder="Introduce referencia, nombre o descripción del producto..."
                    style={{ flex: 1, padding: "12px 16px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "'Georgia', serif", outline: "none", background: "#fff" }} />
                  <button onClick={() => buscar()} disabled={cargando}
                    style={{ ...S.btn(cargando ? "#aaa" : "#1a6040"), padding: "12px 24px" }}>
                    {cargando ? "BUSCANDO..." : "BUSCAR ›"}
                  </button>
                </div>

                {error && (
                  <div style={{ background: "#fff8e1", border: "1px solid #ffe082", padding: "20px 24px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#c07010", fontFamily: "'Courier New', monospace", marginBottom: "8px", fontWeight: "700" }}>⚠ CONSULTA DEMASIADO VAGA</div>
                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "16px" }}>{error.mensaje}</div>
                    {error.sugerencias?.length > 0 && (
                      <>
                        <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>PRUEBA CON:</div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {error.sugerencias.map((s, i) => (
                            <button key={i} onClick={() => { setConsulta(s); buscar(s); }}
                              style={{ ...S.btnOutline("#1a6040"), padding: "7px 14px", fontSize: "11px" }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {resultado && !error && (
                  <div>
                    <div style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "20px 24px", marginBottom: "1px", borderLeft: "4px solid #1a6040" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>{resultado.categoria?.toUpperCase()}</div>
                          <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", lineHeight: "1.2", marginBottom: "6px" }}>{resultado.nombre}</div>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", color: "#888", fontFamily: "'Courier New', monospace" }}>REF: {resultado.referencia}</span>
                            <span style={{ fontSize: "11px", color: "#888", fontFamily: "'Courier New', monospace" }}>{resultado.fabricante}</span>
                            {resultado.precio_orientativo && (
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#1a6040", fontFamily: "'Courier New', monospace" }}>{resultado.precio_orientativo} (sin IVA)</span>
                            )}
                          </div>
                        </div>
                        <div className="no-print" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button onClick={copiarFicha} style={{ ...S.btnOutline("#1a6040"), fontSize: "9px" }}>COPIAR</button>
                          <button onClick={imprimirPDF} style={{ ...S.btnOutline("#1a3a6a"), fontSize: "9px" }}>PDF</button>
                          <button onClick={() => añadirAComparativa(resultado)} style={{ ...S.btn("#c07010"), fontSize: "9px", padding: "7px 14px" }}>+ COMPARAR</button>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: "#fff", border: "1px solid #e0dbd4", borderTop: "none", padding: "10px 24px", marginBottom: "1px", display: "flex", gap: "24px" }}>
                      {[
                        { label: "STOCK", valor: resultado.nivel_stock, color: resultado.nivel_stock === "Alto" ? "#2e7d32" : resultado.nivel_stock === "Medio" ? "#f9a825" : "#c62828" },
                        { label: "ENTREGA", valor: resultado.tiempo_entrega, color: "#555" },
                      ].map(({ label, valor, color }) => (
                        <div key={label} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>{label}</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color }}>{valor}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: "#fff", border: "1px solid #e0dbd4", borderTop: "none", padding: "16px 24px", marginBottom: "1px" }}>
                      <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.7" }}>{resultado.descripcion}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", marginBottom: "1px" }}>
                      {[
                        { titulo: "CARACTERÍSTICAS TÉCNICAS", items: resultado.caracteristicas },
                        { titulo: "APLICACIONES", items: resultado.aplicaciones },
                        { titulo: "COMPATIBILIDADES", items: resultado.compatibilidades },
                        { titulo: "NORMATIVAS", items: resultado.normas },
                      ].map(({ titulo, items }) => (
                        <div key={titulo} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "16px 20px" }}>
                          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>{titulo}</div>
                          {(items || []).map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
                              <span style={{ color: "#1a6040", fontSize: "10px", paddingTop: "3px", flexShrink: 0 }}>–</span>
                              <span style={{ fontSize: "12px", color: "#444", lineHeight: "1.5" }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div style={{ background: "#f0f7f4", border: "1px solid #a5d6a7", padding: "14px 20px", marginBottom: "1px", borderLeft: "4px solid #1a6040" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#1a6040", fontFamily: "'Courier New', monospace", marginBottom: "6px", fontWeight: "700" }}>◈ CONSEJO TÉCNICO</div>
                      <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.6" }}>{resultado.consejo_tecnico}</div>
                    </div>

                    <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderLeft: "4px solid #c07010", padding: "12px 20px" }}>
                      <div style={{ fontSize: "11px", color: "#c07010", lineHeight: "1.5" }}>
                        <strong>⚠ Precios y stock orientativos.</strong> Los datos de precio, disponibilidad y tiempo de entrega son estimaciones generadas con IA. Verificar disponibilidad y precios reales con Sonepar antes de presentar cualquier presupuesto al cliente.
                      </div>
                    </div>
                  </div>
                )}

                {!resultado && !error && !cargando && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", flexDirection: "column", gap: "12px" }}>
                    <div style={{ fontSize: "40px", opacity: 0.1 }}>◈</div>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#ccc", fontFamily: "'Courier New', monospace" }}>INTRODUCE UNA REFERENCIA O DESCRIPCIÓN</div>
                  </div>
                )}
              </>
            )}

            {modo === "comparativa" && (
              <div>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "20px" }}>MODO COMPARATIVA</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {["a", "b"].map((slot) => {
                    const ficha = comparativa[slot];
                    return (
                      <div key={slot} style={{ background: "#fff", border: `2px solid ${ficha ? "#1a6040" : "#e0dbd4"}`, padding: "16px 20px" }}>
                        <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>PRODUCTO {slot.toUpperCase()}</div>
                        {ficha ? (
                          <>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>{ficha.nombre}</div>
                            <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>{ficha.referencia}</div>
                            <button onClick={() => { setComparativa(p => ({ ...p, [slot]: null })); setResultadoComp(null); }}
                              style={{ ...S.btnOutline("#c62828"), fontSize: "9px", padding: "4px 10px" }}>QUITAR</button>
                          </>
                        ) : (
                          <div style={{ fontSize: "12px", color: "#ccc" }}>
                            Ve a búsqueda y pulsa <strong style={{ color: "#c07010" }}>+ COMPARAR</strong> en una ficha
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {comparativa.a && comparativa.b && !resultadoComp && (
                  <button onClick={generarComparativa} disabled={cargandoComp}
                    style={{ ...S.btn(cargandoComp ? "#aaa" : "#1a6040"), padding: "12px 28px", marginBottom: "20px" }}>
                    {cargandoComp ? "GENERANDO COMPARATIVA..." : "GENERAR COMPARATIVA IA ›"}
                  </button>
                )}

                {resultadoComp && (
                  <div>
                    <div style={{ background: "#f0f7f4", border: "1px solid #a5d6a7", padding: "14px 20px", marginBottom: "16px", borderLeft: "4px solid #1a6040" }}>
                      <div style={{ fontSize: "13px", color: "#333", fontStyle: "italic" }}>{resultadoComp.resumen}</div>
                    </div>

                    <div style={{ background: "#fff", border: "1px solid #e0dbd4", marginBottom: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", background: "#1a1a2e", padding: "10px 16px", fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace" }}>
                        <div>CRITERIO</div>
                        <div style={{ color: "#81c784" }}>A · {comparativa.a?.nombre?.slice(0, 20)}</div>
                        <div style={{ color: "#ffb74d" }}>B · {comparativa.b?.nombre?.slice(0, 20)}</div>
                      </div>
                      {(resultadoComp.criterios || []).map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", padding: "12px 16px", borderTop: "1px solid #f5f0e8", alignItems: "center" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e" }}>{c.criterio}</div>
                          <div style={{ padding: "6px 10px", background: c.ventaja === "A" ? "#e8f5e9" : "#fff", fontSize: "12px", color: "#333", display: "flex", gap: "6px", alignItems: "center" }}>
                            {c.ventaja === "A" && <span style={{ color: "#2e7d32", fontWeight: "700" }}>▶</span>}
                            {c.producto_a}
                          </div>
                          <div style={{ padding: "6px 10px", background: c.ventaja === "B" ? "#e8f5e9" : "#fff", fontSize: "12px", color: "#333", display: "flex", gap: "6px", alignItems: "center" }}>
                            {c.ventaja === "B" && <span style={{ color: "#2e7d32", fontWeight: "700" }}>▶</span>}
                            {c.producto_b}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      {[
                        { titulo: "RECOMENDACIÓN GENERAL", contenido: resultadoComp.recomendacion_general, color: "#1a6040" },
                        { titulo: "CUÁNDO ELEGIR A", contenido: resultadoComp.casos_uso_a, color: "#1a3a6a" },
                        { titulo: "CUÁNDO ELEGIR B", contenido: resultadoComp.casos_uso_b, color: "#c07010" },
                      ].map(({ titulo, contenido, color }) => (
                        <div key={titulo} style={{ background: "#fff", border: "1px solid #e0dbd4", padding: "16px", borderTop: `3px solid ${color}` }}>
                          <div style={{ fontSize: "9px", letterSpacing: "2px", color, fontFamily: "'Courier New', monospace", marginBottom: "8px", fontWeight: "700" }}>{titulo}</div>
                          <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>{contenido}</div>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => { setComparativa({ a: null, b: null }); setResultadoComp(null); }}
                      style={{ ...S.btnOutline("#aaa"), marginTop: "12px", fontSize: "9px" }}>
                      NUEVA COMPARATIVA
                    </button>
                  </div>
                )}

                {(!comparativa.a || !comparativa.b) && !resultadoComp && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      Ve a la pestaña <strong>BÚSQUEDA</strong>, encuentra un producto y pulsa el botón <strong style={{ color: "#c07010" }}>+ COMPARAR</strong> para añadirlo a los slots.
                    </div>
                    <button onClick={() => setModo("busqueda")} style={{ ...S.btn("#1a6040"), alignSelf: "flex-start" }}>
                      IR A BÚSQUEDA ›
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
