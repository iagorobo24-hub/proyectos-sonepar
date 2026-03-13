import { useState, useEffect, useRef, useCallback } from "react";

// ── Paleta (coherente con la suite Sonepar) ─────────────────────────────────
const V = {
  verde:      "#1a6040",
  verdeMed:   "#245c3a",
  verdeAct:   "#4caf82",
  verdeSuave: "#e8f5ee",
  fondo:      "#f4f1ec",
  blanco:     "#ffffff",
  texto:      "#1a1a2e",
  textoSec:   "#555",
  textTer:    "#999",
  borde:      "#e0dbd4",
  bordeAct:   "#4caf82",
};

// ── Categorías y accesos rápidos ────────────────────────────────────────────
const CATEGORIAS = [
  "Todas", "Variadores", "Contactores", "Sensores",
  "PLCs", "Protección", "Cables", "Automatización",
  "Vehículo Eléctrico", "Energías Renovables",
];

const ACCESOS_RAPIDOS = [
  "Variador ATV320 2.2kW monofásico",
  "Contactor LC1D40 bobina 220V",
  "Sensor inductivo IF5932 M12",
  "PLC Modicon M241 24E/S",
  "Guardamotor GV2ME10 4-6.3A",
  "Relé de fase RM35TF30",
];

// ── Prompts ─────────────────────────────────────────────────────────────────
const PROMPT_FICHA = (consulta, categoria) =>
  `Eres un técnico especialista en material eléctrico e industrial de Sonepar España con 15 años de experiencia. El técnico de mostrador te consulta sobre: "${consulta}"${categoria && categoria !== "Todas" ? ` (categoría: ${categoria})` : ""}

Si la consulta es demasiado vaga para identificar un producto concreto (una sola palabra genérica o descripción que aplica a decenas de productos), responde ÚNICAMENTE con este JSON:
{"error": true, "mensaje": "descripción breve del problema", "sugerencias": ["consulta 1", "consulta 2", "consulta 3"]}

Si la consulta identifica un producto concreto, responde ÚNICAMENTE con este JSON (sin backticks ni markdown):
{
  "nombre": "nombre comercial completo",
  "referencia": "referencia fabricante",
  "fabricante": "fabricante",
  "categoria": "categoría",
  "precio_orientativo": "rango en € sin IVA",
  "descripcion": "descripción técnica de 2-3 frases",
  "caracteristicas": ["característica 1", "característica 2", "característica 3", "característica 4", "característica 5"],
  "aplicaciones": ["aplicación 1", "aplicación 2", "aplicación 3"],
  "compatibilidades": ["compatible con 1", "compatible con 2", "compatible con 3"],
  "normas": ["norma 1", "norma 2"],
  "consejo_tecnico": "consejo práctico de instalación o selección en 1-2 frases",
  "nivel_stock": "Alto",
  "tiempo_entrega": "plazo orientativo"
}
Para nivel_stock usa SIEMPRE exactamente: "Alto", "Medio" o "Bajo".`;

const PROMPT_COMPARATIVA = (fichaA, fichaB) =>
  `Eres un técnico especialista en material eléctrico de Sonepar España.

Producto A: ${fichaA.nombre} (${fichaA.referencia})
Producto B: ${fichaB.nombre} (${fichaB.referencia})

Responde ÚNICAMENTE con este JSON (sin backticks ni markdown):
{
  "resumen": "frase de resumen de la comparativa",
  "criterios": [
    {"criterio": "nombre", "producto_a": "valor A", "producto_b": "valor B", "ventaja": "A"},
    {"criterio": "Precio", "producto_a": "${fichaA.precio_orientativo || 'N/D'}", "producto_b": "${fichaB.precio_orientativo || 'N/D'}", "ventaja": "empate"},
    {"criterio": "Stock", "producto_a": "${fichaA.nivel_stock}", "producto_b": "${fichaB.nivel_stock}", "ventaja": "A"}
  ],
  "recomendacion_general": "cuál elegir y en qué contexto",
  "casos_uso_a": "cuándo elegir A",
  "casos_uso_b": "cuándo elegir B"
}
Incluye entre 5 y 7 criterios relevantes para estos productos.`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const colorStock = (nivel) => {
  if (!nivel) return { color: V.textTer, bg: "#f5f5f5", dot: "#ccc" };
  const n = nivel.toLowerCase();
  if (n === "alto")  return { color: "#1a6040", bg: "#e8f5ee", dot: "#4caf82" };
  if (n === "medio") return { color: "#7a5a00", bg: "#fff8e1", dot: "#ffb300" };
  return { color: "#8b1a1a", bg: "#fdecea", dot: "#e53935" };
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function FichasTecnicas() {
  const [consulta, setConsulta]         = useState("");
  const [categoria, setCategoria]       = useState("Todas");
  const [resultado, setResultado]       = useState(null);
  const [streamText, setStreamText]     = useState("");   // texto acumulado en streaming
  const [cargando, setCargando]         = useState(false);
  const [historial, setHistorial]       = useState([]);
  const [modo, setModo]                 = useState("busqueda"); // busqueda | comparativa
  const [sesion, setSesion]             = useState([]);          // fichas de la sesión actual
  const [comparativa, setComparativa]   = useState({ a: null, b: null });
  const [resultComp, setResultComp]     = useState(null);
  const [cargandoComp, setCargandoComp] = useState(false);
  const [toast, setToast]               = useState("");
  const [verSesion, setVerSesion]       = useState(false);
  const inputRef = useRef(null);

  // Cargar historial desde localStorage al montar
  useEffect(() => {
    try {
      const h = localStorage.getItem("sonepar_fichas_historial_v3");
      if (h) setHistorial(JSON.parse(h));
    } catch {}
    inputRef.current?.focus();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Guardar en historial (sin duplicados por referencia)
  const guardarHistorial = (query, ficha) => {
    const yaExiste = historial.some(h => h.resultado?.referencia === ficha.referencia);
    if (yaExiste) return;
    const nueva = { query, resultado: ficha, ts: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) };
    const nuevo = [nueva, ...historial].slice(0, 20);
    setHistorial(nuevo);
    try { localStorage.setItem("sonepar_fichas_historial_v3", JSON.stringify(nuevo)); } catch {}
  };

  // Añadir a la sesión actual (max 8 fichas)
  const añadirASesion = (ficha) => {
    if (sesion.some(f => f.referencia === ficha.referencia)) {
      showToast("Ya está en la sesión");
      return;
    }
    if (sesion.length >= 8) {
      showToast("Máximo 8 fichas por sesión");
      return;
    }
    setSesion(prev => [...prev, ficha]);
    showToast(`✓ ${ficha.referencia} añadida a la sesión`);
  };

  // ── BÚSQUEDA CON STREAMING ──────────────────────────────────────────────
  const buscar = useCallback(async (q = consulta) => {
    if (!q.trim() || cargando) return;
    setCargando(true);
    setResultado(null);
    setStreamText("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "messages-2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          stream: true,
          messages: [{ role: "user", content: PROMPT_FICHA(q, categoria) }],
        }),
      });

      if (!response.ok) throw new Error("Error en la API");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";

      // Procesar el stream línea a línea
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              acumulado += parsed.delta.text;
              setStreamText(acumulado);
            }
          } catch {}
        }
      }

      // Parsear el JSON final acumulado
      const cleaned = acumulado.replace(/```json|```/g, "").trim();
      const ficha = JSON.parse(cleaned);

      setResultado(ficha);
      setStreamText("");

      if (!ficha.error) {
        guardarHistorial(q, ficha);
      }
    } catch (err) {
      // Fallback: llamada sin streaming si falla
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: PROMPT_FICHA(q, categoria) }],
          }),
        });
        const data = await res.json();
        const text = data.content?.map(i => i.text || "").join("") || "";
        const ficha = JSON.parse(text.replace(/```json|```/g, "").trim());
        setResultado(ficha);
        if (!ficha.error) guardarHistorial(q, ficha);
      } catch {
        setResultado({ error: true, mensaje: "Error de conexión. Inténtalo de nuevo.", sugerencias: [] });
      }
    } finally {
      setCargando(false);
      setStreamText("");
    }
  }, [consulta, categoria, cargando, historial]);

  // ── COMPARATIVA ─────────────────────────────────────────────────────────
  const generarComparativa = async () => {
    if (!comparativa.a || !comparativa.b) return;
    setCargandoComp(true);
    setResultComp(null);

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
      const comp = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResultComp(comp);
    } catch {
      setResultComp(null);
      showToast("Error al generar comparativa");
    } finally {
      setCargandoComp(false);
    }
  };

  // ── EXPORTAR SESIÓN A PDF ────────────────────────────────────────────────
  const exportarSesion = () => {
    if (sesion.length === 0) { showToast("La sesión está vacía"); return; }
    window.print();
  };

  // ── ESTILOS INLINE ───────────────────────────────────────────────────────
  const S = {
    btn: (bg = V.verde, color = "#fff") => ({
      padding: "8px 18px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: bg, color, border: "none", cursor: "pointer",
    }),
    tag: (color = "#555", bg = "#f0f0f0") => ({
      display: "inline-block", padding: "3px 10px", fontSize: "10px",
      background: bg, color, fontFamily: "'Courier New', monospace",
      letterSpacing: "0.5px", marginRight: "6px", marginBottom: "4px",
    }),
  };

  // ── INDICADOR DE STREAMING ───────────────────────────────────────────────
  const StreamIndicator = () => {
    if (!cargando && !streamText) return null;
    // Contar cuántos campos del JSON ya se han acumulado para mostrar progreso
    const campos = ["nombre", "referencia", "fabricante", "descripcion", "caracteristicas", "aplicaciones", "normas"];
    const completados = campos.filter(c => streamText.includes(`"${c}"`)).length;
    const pct = Math.round((completados / campos.length) * 100);

    return (
      <div style={{ background: V.blanco, border: `1px solid ${V.borde}`, borderLeft: `4px solid ${V.verdeAct}`, padding: "20px 24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: V.verdeAct, animation: "pulse 1s infinite" }} />
          <span style={{ fontSize: "10px", letterSpacing: "2px", fontFamily: "'Courier New', monospace", color: V.verde, fontWeight: "700" }}>
            GENERANDO FICHA TÉCNICA...
          </span>
        </div>
        {/* Barra de progreso */}
        <div style={{ background: "#e8f5ee", height: "3px", borderRadius: "2px", marginBottom: "10px" }}>
          <div style={{ background: V.verdeAct, height: "3px", borderRadius: "2px", width: `${Math.max(pct, 8)}%`, transition: "width 0.3s ease" }} />
        </div>
        {/* Campos completados */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {campos.map(c => (
            <span key={c} style={{ ...S.tag(
              streamText.includes(`"${c}"`) ? V.verde : V.textTer,
              streamText.includes(`"${c}"`) ? V.verdeSuave : "#f5f5f5"
            ) }}>
              {streamText.includes(`"${c}"`) ? "✓" : "○"} {c}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ── TARJETA DE RESULTADO ─────────────────────────────────────────────────
  const TarjetaFicha = ({ ficha, esSesion = false }) => {
    if (!ficha || ficha.error) return null;
    const stock = colorStock(ficha.nivel_stock);

    return (
      <div style={{ background: V.blanco, border: `1px solid ${V.borde}`, marginBottom: "12px" }}>
        {/* Cabecera */}
        <div style={{ background: V.verde, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: V.verdeAct, fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>
              {ficha.fabricante} · {ficha.categoria}
            </div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "16px", fontFamily: "'Georgia', serif", lineHeight: 1.3 }}>
              {ficha.nombre}
            </div>
            <div style={{ color: "#a5d6b8", fontFamily: "'Courier New', monospace", fontSize: "12px", marginTop: "4px" }}>
              REF: {ficha.referencia}
            </div>
          </div>
          {/* Semáforo de stock */}
          <div style={{ background: stock.bg, border: `1px solid ${stock.dot}`, padding: "8px 14px", textAlign: "center", minWidth: "80px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: stock.dot, margin: "0 auto 4px" }} />
            <div style={{ fontSize: "9px", letterSpacing: "1.5px", color: stock.color, fontFamily: "'Courier New', monospace", fontWeight: "700" }}>
              {ficha.nivel_stock || "N/D"}
            </div>
            <div style={{ fontSize: "8px", color: V.textTer, fontFamily: "'Courier New', monospace" }}>STOCK</div>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Precio + entrega */}
          <div style={{ display: "flex", gap: "24px", marginBottom: "16px", paddingBottom: "16px", borderBottom: `1px solid ${V.borde}` }}>
            {ficha.precio_orientativo && (
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "2px", color: V.textTer, fontFamily: "'Courier New', monospace", marginBottom: "3px" }}>PRECIO ORIENTATIVO</div>
                <div style={{ fontWeight: "700", color: V.verde, fontSize: "15px" }}>{ficha.precio_orientativo}</div>
              </div>
            )}
            {ficha.tiempo_entrega && (
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "2px", color: V.textTer, fontFamily: "'Courier New', monospace", marginBottom: "3px" }}>ENTREGA</div>
                <div style={{ fontWeight: "600", color: V.texto, fontSize: "13px" }}>{ficha.tiempo_entrega}</div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <p style={{ fontSize: "13px", color: V.textoSec, lineHeight: "1.7", marginBottom: "16px", fontStyle: "italic" }}>
            {ficha.descripcion}
          </p>

          {/* Grid características + aplicaciones */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {ficha.caracteristicas?.length > 0 && (
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "2px", color: V.textTer, fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>CARACTERÍSTICAS</div>
                {ficha.caracteristicas.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px", alignItems: "flex-start" }}>
                    <span style={{ color: V.verdeAct, fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: "12px", color: V.texto, lineHeight: 1.4 }}>{c}</span>
                  </div>
                ))}
              </div>
            )}
            {ficha.aplicaciones?.length > 0 && (
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "2px", color: V.textTer, fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>APLICACIONES</div>
                {ficha.aplicaciones.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px", alignItems: "flex-start" }}>
                    <span style={{ color: V.verdeAct, fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: "12px", color: V.texto, lineHeight: 1.4 }}>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compatibilidades */}
          {ficha.compatibilidades?.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "8px", letterSpacing: "2px", color: V.textTer, fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>COMPATIBILIDADES</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {ficha.compatibilidades.map((c, i) => (
                  <span key={i} style={S.tag(V.verde, V.verdeSuave)}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Normas */}
          {ficha.normas?.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "8px", letterSpacing: "2px", color: V.textTer, fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>NORMATIVA</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {ficha.normas.map((n, i) => (
                  <span key={i} style={S.tag("#555", "#f5f5f5")}>{n}</span>
                ))}
              </div>
            </div>
          )}

          {/* Consejo técnico */}
          {ficha.consejo_tecnico && (
            <div style={{ background: "#fffbf0", border: "1px solid #ffe082", borderLeft: "4px solid #ffb300", padding: "12px 16px" }}>
              <div style={{ fontSize: "8px", letterSpacing: "2px", color: "#7a5a00", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>💡 CONSEJO TÉCNICO</div>
              <p style={{ fontSize: "12px", color: "#5a4000", lineHeight: "1.6", margin: 0 }}>{ficha.consejo_tecnico}</p>
            </div>
          )}

          {/* Acciones (solo en modo búsqueda, no en panel sesión) */}
          {!esSesion && (
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${V.borde}` }}>
              <button onClick={() => añadirASesion(ficha)} style={S.btn(V.verde)}>
                + AÑADIR A SESIÓN
              </button>
              {(comparativa.a === null || comparativa.b === null) && (
                <button
                  onClick={() => {
                    if (!comparativa.a) { setComparativa(p => ({ ...p, a: ficha })); showToast("Producto A asignado"); }
                    else if (!comparativa.b && comparativa.a.referencia !== ficha.referencia) { setComparativa(p => ({ ...p, b: ficha })); showToast("Producto B asignado"); }
                    else showToast("Ya tienes los dos productos para comparar");
                  }}
                  style={S.btn("#2a2a3e")}
                >
                  COMPARAR
                </button>
              )}
              <button onClick={() => window.print()} style={S.btn("transparent", V.verde)}>
                EXPORTAR PDF
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── PANEL SESIÓN ─────────────────────────────────────────────────────────
  const PanelSesion = () => (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "420px", background: V.blanco, borderLeft: `2px solid ${V.verde}`, zIndex: 100, overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)" }}>
      <div style={{ background: V.verde, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 1 }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: V.verdeAct, fontFamily: "'Courier New', monospace" }}>FICHAS DE SESIÓN</div>
          <div style={{ color: "#fff", fontWeight: "700", fontFamily: "'Georgia', serif" }}>{sesion.length} producto{sesion.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={exportarSesion} style={S.btn(V.verdeAct, "#fff")}>PDF</button>
          <button onClick={() => setVerSesion(false)} style={S.btn("#2a2a3e", "#fff")}>✕</button>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        {sesion.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: V.textTer, fontFamily: "'Courier New', monospace", fontSize: "11px" }}>
            Añade fichas desde la búsqueda
          </div>
        ) : (
          sesion.map((ficha, i) => (
            <div key={ficha.referencia} style={{ background: "#f9f9f9", border: `1px solid ${V.borde}`, padding: "14px 16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: V.verde, fontFamily: "'Courier New', monospace" }}>{ficha.referencia}</div>
                  <div style={{ fontSize: "12px", color: V.texto, fontFamily: "'Georgia', serif", marginTop: "2px" }}>{ficha.nombre}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {/* Semáforo mini */}
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colorStock(ficha.nivel_stock).dot }} title={`Stock: ${ficha.nivel_stock}`} />
                  <button
                    onClick={() => setSesion(prev => prev.filter(f => f.referencia !== ficha.referencia))}
                    style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "14px" }}
                  >✕</button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: V.textoSec }}>
                <span>{ficha.fabricante}</span>
                <span style={{ fontWeight: "700", color: V.verde }}>{ficha.precio_orientativo}</span>
              </div>
              {/* Botón asignar a comparativa desde sesión */}
              {(comparativa.a?.referencia !== ficha.referencia && comparativa.b?.referencia !== ficha.referencia) && (
                <button
                  onClick={() => {
                    if (!comparativa.a) setComparativa(p => ({ ...p, a: ficha }));
                    else if (!comparativa.b) setComparativa(p => ({ ...p, b: ficha }));
                    showToast("Asignado a comparativa");
                  }}
                  style={{ marginTop: "8px", ...S.btn("#2a2a3e"), fontSize: "9px", padding: "5px 12px" }}
                >
                  COMPARAR
                </button>
              )}
            </div>
          ))
        )}
        {sesion.length > 0 && (
          <button
            onClick={() => { setSesion([]); showToast("Sesión limpiada"); }}
            style={{ width: "100%", marginTop: "8px", ...S.btn("transparent", "#999"), border: "1px solid #ddd" }}
          >
            LIMPIAR SESIÓN
          </button>
        )}
      </div>
    </div>
  );

  // ── RENDER PRINCIPAL ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: V.fondo, fontFamily: "'Georgia', serif", color: V.texto }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="no-print" style={{ background: "#1a1a2e", padding: "0 32px", display: "flex", alignItems: "stretch", borderBottom: `3px solid ${V.verde}`, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ background: V.verde, padding: "14px 22px", display: "flex", alignItems: "center", marginRight: "20px" }}>
            <span style={{ fontWeight: "900", fontSize: "12px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <span style={{ color: V.verdeAct, fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>FICHAS TÉCNICAS</span>
            <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>v3.0</span>
          </div>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {/* Botón sesión con contador */}
            <button
              className="no-print"
              onClick={() => setVerSesion(!verSesion)}
              style={{ ...S.btn(verSesion ? V.verde : "#2a2a3e"), position: "relative" }}
            >
              SESIÓN
              {sesion.length > 0 && (
                <span style={{ position: "absolute", top: "4px", right: "4px", background: V.verdeAct, color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
                  {sesion.length}
                </span>
              )}
            </button>
            <button onClick={() => setModo("busqueda")} style={S.btn(modo === "busqueda" ? V.verde : "#2a2a3e")}>BÚSQUEDA</button>
            <button onClick={() => setModo("comparativa")} style={S.btn(modo === "comparativa" ? V.verde : "#2a2a3e")}>
              COMPARATIVA {comparativa.a || comparativa.b ? `(${[comparativa.a, comparativa.b].filter(Boolean).length}/2)` : ""}
            </button>
          </div>
        </div>

        {/* ── Layout principal: sidebar + contenido ──────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 51px)" }}>

          {/* Sidebar */}
          <div className="no-print" style={{ background: V.blanco, borderRight: `1px solid ${V.borde}`, padding: "20px", overflowY: "auto" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>CATEGORÍAS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "20px" }}>
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => setCategoria(c)}
                  style={{ padding: "7px 12px", textAlign: "left", fontSize: "12px", fontFamily: "'Georgia', serif", cursor: "pointer", background: categoria === c ? V.verde : "transparent", color: categoria === c ? "#fff" : V.textoSec, border: "none", fontWeight: categoria === c ? "700" : "400", transition: "background 0.15s" }}>
                  {c}
                </button>
              ))}
            </div>

            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>ACCESOS RÁPIDOS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
              {ACCESOS_RAPIDOS.map(a => (
                <button key={a} onClick={() => { setConsulta(a); buscar(a); }}
                  style={{ padding: "8px 10px", textAlign: "left", fontSize: "11px", fontFamily: "'Courier New', monospace", cursor: "pointer", background: "#f4f1ec", color: V.textoSec, border: "none", lineHeight: "1.4" }}>
                  {a}
                </button>
              ))}
            </div>

            {/* Historial */}
            {historial.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>HISTORIAL</div>
                  <button onClick={() => { setHistorial([]); try { localStorage.removeItem("sonepar_fichas_historial_v3"); } catch {} }}
                    style={{ fontSize: "9px", color: "#aaa", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
                    limpiar
                  </button>
                </div>
                {historial.slice(0, 10).map((h, i) => (
                  <button key={i} onClick={() => { setConsulta(h.query); setResultado(h.resultado); }}
                    style={{ width: "100%", textAlign: "left", padding: "7px 10px", marginBottom: "3px", background: "#f9f7f4", border: "none", cursor: "pointer", fontSize: "11px", fontFamily: "'Courier New', monospace", color: V.textoSec, lineHeight: "1.3" }}>
                    <span style={{ color: V.verde, fontWeight: "700" }}>{h.resultado?.referencia || "—"}</span>
                    <br /><span style={{ color: "#bbb", fontSize: "9px" }}>{h.ts}</span>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Área central */}
          <div style={{ padding: "24px 32px", overflowY: "auto" }}>

            {/* ── Modo búsqueda ─────────────────────────────────────────── */}
            {modo === "busqueda" && (
              <>
                {/* Barra de búsqueda */}
                <div className="no-print" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  <input
                    ref={inputRef}
                    value={consulta}
                    onChange={e => setConsulta(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && buscar()}
                    placeholder="Referencia, descripción o modelo…"
                    style={{ flex: 1, padding: "12px 16px", fontSize: "13px", fontFamily: "'Georgia', serif", border: `1px solid ${V.borde}`, background: V.blanco, color: V.texto, outline: "none" }}
                  />
                  <button onClick={() => buscar()} disabled={cargando}
                    style={{ ...S.btn(cargando ? "#aaa" : V.verde), padding: "12px 28px" }}>
                    {cargando ? "..." : "BUSCAR →"}
                  </button>
                </div>

                {/* Indicador streaming */}
                <StreamIndicator />

                {/* Error con sugerencias */}
                {resultado?.error && (
                  <div style={{ background: "#fff8f0", border: "1px solid #ffe0b2", borderLeft: "4px solid #ff9800", padding: "20px 24px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#e65100", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>CONSULTA INCOMPLETA</div>
                    <p style={{ fontSize: "13px", color: V.textoSec, marginBottom: "12px" }}>{resultado.mensaje}</p>
                    {resultado.sugerencias?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {resultado.sugerencias.map((s, i) => (
                          <button key={i} onClick={() => { setConsulta(s); buscar(s); }}
                            style={{ ...S.btn("#f5f5f5", V.verde), border: `1px solid ${V.verdeAct}` }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ficha resultado */}
                {resultado && !resultado.error && <TarjetaFicha ficha={resultado} />}

                {/* Estado vacío */}
                {!resultado && !cargando && !streamText && (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: V.textTer }}>
                    <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔍</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>FICHAS TÉCNICAS v3.0</div>
                    <p style={{ fontSize: "13px", maxWidth: "400px", margin: "0 auto", lineHeight: "1.7" }}>
                      Introduce una referencia, modelo o descripción de producto y obtén la ficha técnica completa en segundos.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── Modo comparativa ──────────────────────────────────────── */}
            {modo === "comparativa" && (
              <>
                {/* Selector de productos */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {["a", "b"].map(slot => (
                    <div key={slot} style={{ background: V.blanco, border: `2px solid ${comparativa[slot] ? V.verdeAct : V.borde}`, padding: "16px 20px" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>
                        PRODUCTO {slot.toUpperCase()}
                      </div>
                      {comparativa[slot] ? (
                        <div>
                          <div style={{ fontWeight: "700", color: V.verde, fontSize: "13px", fontFamily: "'Courier New', monospace" }}>{comparativa[slot].referencia}</div>
                          <div style={{ fontSize: "12px", color: V.textoSec, marginTop: "2px" }}>{comparativa[slot].nombre}</div>
                          <button onClick={() => { setComparativa(p => ({ ...p, [slot]: null })); setResultComp(null); }}
                            style={{ marginTop: "8px", ...S.btn("transparent", "#aaa"), fontSize: "9px", padding: "3px 8px" }}>
                            cambiar
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: V.textTer, fontSize: "12px", fontStyle: "italic" }}>
                          Busca un producto y pulsa "COMPARAR"
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {comparativa.a && comparativa.b && (
                  <div style={{ marginBottom: "20px" }}>
                    <button onClick={generarComparativa} disabled={cargandoComp}
                      style={{ ...S.btn(cargandoComp ? "#aaa" : V.verde), padding: "11px 32px" }}>
                      {cargandoComp ? "GENERANDO..." : "GENERAR COMPARATIVA IA →"}
                    </button>
                  </div>
                )}

                {resultComp && (
                  <div>
                    {/* Resumen */}
                    <div style={{ background: V.verdeSuave, border: `1px solid #a5d6a7`, borderLeft: `4px solid ${V.verde}`, padding: "14px 20px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "12px", color: V.verde, fontStyle: "italic" }}>{resultComp.resumen}</div>
                    </div>

                    {/* Tabla de criterios */}
                    <div style={{ background: V.blanco, border: `1px solid ${V.borde}`, marginBottom: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", background: "#1a1a2e", padding: "10px 16px", fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace" }}>
                        <div>CRITERIO</div>
                        <div style={{ color: "#81c784" }}>A · {comparativa.a?.referencia}</div>
                        <div style={{ color: "#ffb74d" }}>B · {comparativa.b?.referencia}</div>
                      </div>
                      {(resultComp.criterios || []).map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", padding: "11px 16px", borderTop: `1px solid ${V.borde}`, alignItems: "center" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: V.texto }}>{c.criterio}</div>
                          <div style={{ padding: "5px 10px", background: c.ventaja === "A" ? "#e8f5e9" : "#fff", fontSize: "12px", color: V.texto, display: "flex", gap: "6px", alignItems: "center" }}>
                            {c.ventaja === "A" && <span style={{ color: "#2e7d32", fontWeight: "700" }}>▶</span>}
                            {c.producto_a}
                          </div>
                          <div style={{ padding: "5px 10px", background: c.ventaja === "B" ? "#fff8e1" : "#fff", fontSize: "12px", color: V.texto, display: "flex", gap: "6px", alignItems: "center" }}>
                            {c.ventaja === "B" && <span style={{ color: "#f57f17", fontWeight: "700" }}>▶</span>}
                            {c.producto_b}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recomendación */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      {[
                        { label: "RECOMENDACIÓN GENERAL", text: resultComp.recomendacion_general, color: V.verde, bg: V.verdeSuave },
                        { label: `ELIGE ${comparativa.a?.referencia}`, text: resultComp.casos_uso_a, color: "#1a6040", bg: "#f0f7f4" },
                        { label: `ELIGE ${comparativa.b?.referencia}`, text: resultComp.casos_uso_b, color: "#7a5a00", bg: "#fffbf0" },
                      ].map(({ label, text, color, bg }) => (
                        <div key={label} style={{ background: bg, border: `1px solid ${V.borde}`, padding: "14px 16px" }}>
                          <div style={{ fontSize: "8px", letterSpacing: "2px", color, fontFamily: "'Courier New', monospace", fontWeight: "700", marginBottom: "8px" }}>{label}</div>
                          <p style={{ fontSize: "12px", color: V.textoSec, lineHeight: "1.6", margin: 0 }}>{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado vacío comparativa */}
                {!comparativa.a && !comparativa.b && (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: V.textTer }}>
                    <div style={{ fontSize: "32px", marginBottom: "16px" }}>⚖️</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>COMPARATIVA DE PRODUCTOS</div>
                    <p style={{ fontSize: "13px", maxWidth: "380px", margin: "0 auto", lineHeight: "1.7" }}>
                      Busca productos en modo Búsqueda y pulsa "COMPARAR" para añadirlos aquí.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Panel lateral de sesión (overlay) ────────────────────────── */}
        {verSesion && <PanelSesion />}

        {/* ── Toast de notificaciones ───────────────────────────────────── */}
        {toast && (
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: V.verde, color: "#fff", padding: "10px 24px", fontSize: "12px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
