import { useState, useRef, useEffect } from "react";

const EJEMPLOS = [
  "Variador ATV320 7,5kW trifásico",
  "PLC Modicon M241",
  "Contactor LC1D25 bobina 230V",
  "Guardamotor GV2ME10",
  "Relé térmico LRD16",
  "Interruptor diferencial iID 40A 30mA",
];

const CATEGORIAS = ["Todo", "Variadores", "PLC", "Contactores", "Protección", "Automatización"];

export default function FichasTecnicas() {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todo");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buscar = async (q = query) => {
    if (!q.trim()) return;
    setCargando(true);
    setError("");
    setResultado(null);

    const prompt = `Eres un experto técnico en material eléctrico industrial, especializado en productos de automatización, distribución y control (Schneider Electric, Siemens, ABB, Legrand, etc.). Trabajas en el mostrador técnico de una delegación de distribución eléctrica.

El técnico/instalador ha preguntado por: "${q}"
${categoria !== "Todo" ? `Categoría filtrada: ${categoria}` : ""}

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con esta estructura exacta:
{
  "nombre": "nombre comercial completo del producto",
  "referencia": "referencia/código de producto más común",
  "fabricante": "marca fabricante",
  "categoria": "categoría técnica",
  "descripcion": "descripción técnica en 2 frases claras",
  "caracteristicas": [
    "característica técnica clave 1",
    "característica técnica clave 2",
    "característica técnica clave 3",
    "característica técnica clave 4"
  ],
  "aplicaciones": [
    "aplicación típica 1",
    "aplicación típica 2",
    "aplicación típica 3"
  ],
  "compatibilidades": [
    "producto o sistema compatible 1",
    "producto o sistema compatible 2",
    "producto o sistema compatible 3"
  ],
  "normas": ["norma o certificación 1", "norma 2"],
  "consejo_tecnico": "consejo práctico breve para el instalador sobre este producto",
  "nivel_stock": "alto",
  "tiempo_entrega": "24-48h"
}

Si el producto no existe o la consulta es demasiado vaga, devuelve:
{"error": "descripción del problema y qué datos adicionales necesitas"}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (parsed.error) {
        setError(parsed.error);
      } else {
        setResultado(parsed);
        setHistorial(prev => [{ query: q, resultado: parsed }, ...prev].slice(0, 6));
      }
    } catch (e) {
      setError("Error al procesar la consulta. Inténtalo de nuevo.");
    }

    setCargando(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") buscar();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f1ec",
      fontFamily: "'Georgia', serif",
      color: "#1a1a1a",
    }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e",
        padding: "0 40px",
        display: "flex",
        alignItems: "stretch",
        gap: "0",
        borderBottom: "3px solid #e8a020",
      }}>
        <div style={{
          background: "#e8a020",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginRight: "24px",
        }}>
          <span style={{ fontWeight: "900", fontSize: "15px", letterSpacing: "3px", color: "#000", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#e8a020", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>
            ASISTENTE DE FICHAS TÉCNICAS
          </span>
          <span style={{ color: "#555", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>
            IA · MOSTRADOR TÉCNICO
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "#444", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>
            A CORUÑA · DELEGACIÓN
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: "calc(100vh - 61px)" }}>

        {/* Main */}
        <div style={{ padding: "32px 40px" }}>

          {/* Buscador */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#999", marginBottom: "10px", fontFamily: "'Courier New', monospace" }}>
              REFERENCIA O DESCRIPCIÓN DEL PRODUCTO
            </div>
            <div style={{ display: "flex", gap: "0", boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ej: variador 7,5kW trifásico, PLC Modicon, contactor 25A..."
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  fontSize: "15px",
                  border: "2px solid #ddd",
                  borderRight: "none",
                  outline: "none",
                  fontFamily: "'Georgia', serif",
                  background: "#fff",
                  color: "#1a1a1a",
                }}
              />
              <button
                onClick={() => buscar()}
                disabled={cargando || !query.trim()}
                style={{
                  background: cargando ? "#ccc" : "#1a1a2e",
                  color: "#fff",
                  border: "none",
                  padding: "16px 28px",
                  fontSize: "12px",
                  letterSpacing: "2px",
                  fontFamily: "'Courier New', monospace",
                  cursor: cargando ? "not-allowed" : "pointer",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                }}
              >
                {cargando ? "BUSCANDO..." : "CONSULTAR ›"}
              </button>
            </div>

            {/* Categorías */}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              {CATEGORIAS.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  style={{
                    padding: "5px 14px",
                    fontSize: "10px",
                    letterSpacing: "1.5px",
                    fontFamily: "'Courier New', monospace",
                    border: categoria === c ? "1px solid #1a1a2e" : "1px solid #ddd",
                    background: categoria === c ? "#1a1a2e" : "#fff",
                    color: categoria === c ? "#e8a020" : "#888",
                    cursor: "pointer",
                  }}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Ejemplos rápidos */}
            <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>RÁPIDO:</span>
              {EJEMPLOS.map(e => (
                <button
                  key={e}
                  onClick={() => { setQuery(e); buscar(e); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "10px",
                    background: "#fff",
                    border: "1px solid #e8a020",
                    color: "#c07010",
                    cursor: "pointer",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fff3cd",
              border: "1px solid #e8a020",
              padding: "16px 20px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#7a4f00",
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Cargando */}
          {cargando && (
            <div style={{
              textAlign: "center",
              padding: "60px",
              color: "#aaa",
              fontFamily: "'Courier New', monospace",
              fontSize: "12px",
              letterSpacing: "3px",
            }}>
              CONSULTANDO BASE DE DATOS TÉCNICA...
              <div style={{ marginTop: "16px", fontSize: "24px", animation: "spin 1s linear infinite" }}>◌</div>
            </div>
          )}

          {/* Resultado */}
          {resultado && !cargando && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Cabecera producto */}
              <div style={{
                background: "#fff",
                borderTop: "4px solid #e8a020",
                padding: "24px 28px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>
                      {resultado.fabricante?.toUpperCase()} · {resultado.categoria?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>
                      {resultado.nombre}
                    </div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", color: "#e8a020", fontWeight: "700" }}>
                      REF: {resultado.referencia}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      padding: "4px 12px",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      fontFamily: "'Courier New', monospace",
                      marginBottom: "6px",
                    }}>
                      STOCK {resultado.nivel_stock?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace" }}>
                      Entrega: {resultado.tiempo_entrega}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "14px", fontSize: "14px", color: "#555", lineHeight: "1.6", borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
                  {resultado.descripcion}
                </div>
              </div>

              {/* Grid de datos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>

                {[
                  { titulo: "CARACTERÍSTICAS TÉCNICAS", items: resultado.caracteristicas, color: "#1a1a2e" },
                  { titulo: "APLICACIONES TÍPICAS", items: resultado.aplicaciones, color: "#1a6040" },
                  { titulo: "COMPATIBILIDADES", items: resultado.compatibilidades, color: "#4a2080" },
                ].map(({ titulo, items, color }) => (
                  <div key={titulo} style={{
                    background: "#fff",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    borderTop: `3px solid ${color}`,
                  }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: color, fontFamily: "'Courier New', monospace", marginBottom: "14px", fontWeight: "700" }}>
                      {titulo}
                    </div>
                    {items?.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                        <span style={{ color: color, fontSize: "10px", marginTop: "3px", flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: "12px", color: "#444", lineHeight: "1.5" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Normativas + Consejo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div style={{ background: "#fff", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#999", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>NORMATIVAS / CERT.</div>
                  {resultado.normas?.map((n, i) => (
                    <div key={i} style={{
                      display: "inline-block",
                      background: "#f4f1ec",
                      border: "1px solid #ddd",
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontFamily: "'Courier New', monospace",
                      marginRight: "6px",
                      marginBottom: "6px",
                      color: "#666",
                    }}>
                      {n}
                    </div>
                  ))}
                </div>

                <div style={{
                  background: "#1a1a2e",
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#e8a020", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>
                    ◈ CONSEJO TÉCNICO
                  </div>
                  <div style={{ fontSize: "13px", color: "#d0d0d0", lineHeight: "1.7", fontStyle: "italic" }}>
                    "{resultado.consejo_tecnico}"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estado inicial */}
          {!resultado && !cargando && !error && (
            <div style={{
              textAlign: "center",
              padding: "80px 40px",
              color: "#ccc",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>⚡</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", letterSpacing: "4px", color: "#bbb" }}>
                INTRODUCE UNA REFERENCIA O DESCRIPCIÓN
              </div>
              <div style={{ fontSize: "12px", color: "#ddd", marginTop: "8px" }}>
                Nombre comercial, referencia, o descripción de lo que necesitas
              </div>
            </div>
          )}
        </div>

        {/* Sidebar historial */}
        <div style={{
          background: "#1a1a2e",
          padding: "24px 20px",
          borderLeft: "1px solid #2a2a3e",
        }}>
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#e8a020", fontFamily: "'Courier New', monospace", marginBottom: "20px" }}>
            CONSULTAS RECIENTES
          </div>

          {historial.length === 0 ? (
            <div style={{ fontSize: "11px", color: "#444", fontFamily: "'Courier New', monospace" }}>
              Sin historial aún
            </div>
          ) : (
            historial.map((h, i) => (
              <div
                key={i}
                onClick={() => { setQuery(h.query); setResultado(h.resultado); }}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #2a2a3e",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#2a2a3e"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: "10px", color: "#e8a020", fontFamily: "'Courier New', monospace", marginBottom: "3px" }}>
                  {h.resultado.referencia}
                </div>
                <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.4" }}>
                  {h.resultado.nombre}
                </div>
                <div style={{ fontSize: "9px", color: "#555", marginTop: "3px", fontFamily: "'Courier New', monospace" }}>
                  {h.resultado.fabricante}
                </div>
              </div>
            ))
          )}

          {historial.length > 0 && (
            <button
              onClick={() => setHistorial([])}
              style={{
                marginTop: "16px",
                background: "transparent",
                border: "1px solid #333",
                color: "#555",
                padding: "6px 12px",
                fontSize: "9px",
                letterSpacing: "2px",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
                width: "100%",
              }}
            >
              LIMPIAR HISTORIAL
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #bbb; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
