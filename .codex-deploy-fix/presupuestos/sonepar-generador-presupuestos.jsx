import { useState } from "react";

const CATEGORIAS = [
  { id: "automatizacion", label: "Automatización Industrial", icon: "⚙" },
  { id: "iluminacion", label: "Iluminación", icon: "💡" },
  { id: "vehiculo_electrico", label: "Vehículo Eléctrico", icon: "⚡" },
  { id: "cuadro_electrico", label: "Cuadro Eléctrico", icon: "🔌" },
  { id: "energia_solar", label: "Energía Solar / FV", icon: "☀" },
  { id: "clima", label: "Climatización / HVAC", icon: "❄" },
];

const PREGUNTAS = {
  automatizacion: [
    { key: "potencia", label: "Potencia total motores (kW)", ph: "Ej: 37", tipo: "number" },
    { key: "num_motores", label: "Nº de motores a controlar", ph: "Ej: 3", tipo: "number" },
    { key: "plc", label: "¿Incluye PLC/automatismo?", tipo: "select", ops: ["No", "PLC básico", "PLC avanzado + HMI"] },
    { key: "zona_atex", label: "¿Zona ATEX?", tipo: "select", ops: ["No", "Zona 2", "Zona 1"] },
  ],
  iluminacion: [
    { key: "superficie", label: "Superficie a iluminar (m²)", ph: "Ej: 500", tipo: "number" },
    { key: "tipo_espacio", label: "Tipo de espacio", tipo: "select", ops: ["Oficinas", "Almacén industrial", "Exterior", "Parking"] },
    { key: "telegestión", label: "¿Con telegestión/DALI?", tipo: "select", ops: ["No", "Sí básico", "Sí avanzado"] },
    { key: "emergencias", label: "¿Incluye emergencias?", tipo: "select", ops: ["No", "Sí"] },
  ],
  vehiculo_electrico: [
    { key: "num_puntos", label: "Nº de puntos de recarga", ph: "Ej: 4", tipo: "number" },
    { key: "potencia_punto", label: "Potencia por punto (kW)", tipo: "select", ops: ["7,4 kW (modo 2)", "11 kW (modo 3)", "22 kW (modo 3)", "50 kW (DC rápido)"] },
    { key: "gestion", label: "¿Gestión de carga?", tipo: "select", ops: ["No", "Básica", "Smart + App"] },
    { key: "instalacion", label: "Tipo de instalación", tipo: "select", ops: ["Garaje residencial", "Parking empresa", "Vía pública"] },
  ],
  cuadro_electrico: [
    { key: "potencia_contratada", label: "Potencia contratada (kW)", ph: "Ej: 100", tipo: "number" },
    { key: "num_circuitos", label: "Nº de circuitos", ph: "Ej: 24", tipo: "number" },
    { key: "protecciones", label: "Nivel de protecciones", tipo: "select", ops: ["Básico (IGA + diferencial)", "Estándar + selectividad", "Completo + monitorización"] },
    { key: "tension", label: "Tensión", tipo: "select", ops: ["230V monofásico", "400V trifásico", "BT industrial"] },
  ],
  energia_solar: [
    { key: "potencia_pico", label: "Potencia pico instalación (kWp)", ph: "Ej: 20", tipo: "number" },
    { key: "tipo", label: "Tipo de instalación", tipo: "select", ops: ["Autoconsumo sin batería", "Autoconsumo con batería", "Aislada"] },
    { key: "fases", label: "Conexión red", tipo: "select", ops: ["Monofásico", "Trifásico"] },
    { key: "monitorización", label: "¿Monitorización remota?", tipo: "select", ops: ["No", "Sí"] },
  ],
  clima: [
    { key: "superficie", label: "Superficie a climatizar (m²)", ph: "Ej: 200", tipo: "number" },
    { key: "tipo_sistema", label: "Sistema", tipo: "select", ops: ["Split 1x1", "Multi-split", "VRF/VRV", "Fancoil + enfriadora"] },
    { key: "uso", label: "Uso principal", tipo: "select", ops: ["Residencial", "Comercial", "Industrial"] },
    { key: "aero", label: "¿Aerotermia ACS?", tipo: "select", ops: ["No", "Sí"] },
  ],
};

export default function GeneradorPresupuesto() {
  const [paso, setPaso] = useState(1); // 1 categoria, 2 parametros, 3 resultado
  const [categoria, setCategoria] = useState(null);
  const [cliente, setCliente] = useState({ nombre: "", empresa: "", email: "" });
  const [params, setParams] = useState({});
  const [presupuesto, setPresupuesto] = useState(null);
  const [generando, setGenerando] = useState(false);

  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const seleccionarCategoria = (cat) => {
    setCategoria(cat);
    setParams({});
    setPaso(2);
  };

  const generarPresupuesto = async () => {
    setGenerando(true);
    const cat = CATEGORIAS.find(c => c.id === categoria);
    const pregs = PREGUNTAS[categoria] || [];

    const detallesParams = pregs.map(p => `${p.label}: ${params[p.key] || "no especificado"}`).join("\n");

    const prompt = `Eres un experto comercial técnico de Sonepar España, especializado en presupuestación de material eléctrico e industrial.

Genera un presupuesto estimado detallado para una instalación de "${cat.label}" con estos parámetros:
${detallesParams}

Cliente: ${cliente.nombre || "Sin especificar"} ${cliente.empresa ? `(${cliente.empresa})` : ""}

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "resumen": "descripción breve de la instalación en 1-2 frases",
  "partidas": [
    {
      "descripcion": "nombre de la partida",
      "detalle": "descripción técnica breve",
      "cantidad": "número o descripción",
      "precio_unitario": número_en_euros,
      "precio_total": número_en_euros,
      "referencia_tipo": "tipo de producto Sonepar/fabricante"
    }
  ],
  "subtotal_material": número,
  "mano_obra_estimada": número,
  "total_estimado": número,
  "plazo_entrega_material": "plazo en días",
  "validez_presupuesto": "30 días",
  "notas_tecnicas": ["nota técnica relevante 1", "nota 2"],
  "productos_destacados": ["producto/marca recomendado 1", "producto 2", "producto 3"]
}

Los precios deben ser realistas para el mercado español 2025 (precio de distribuidor, sin IVA). Incluye entre 4 y 7 partidas detalladas.`;

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
      const text = data.content?.map(i => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setPresupuesto(parsed);
      setPaso(3);
    } catch (e) {
      alert("Error al generar presupuesto. Inténtalo de nuevo.");
    }
    setGenerando(false);
  };

  const reiniciar = () => {
    setPaso(1); setCategoria(null); setParams({});
    setPresupuesto(null); setCliente({ nombre: "", empresa: "", email: "" });
  };

  const preguntas = categoria ? PREGUNTAS[categoria] : [];
  const cat = CATEGORIAS.find(c => c.id === categoria);

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "'Palatino Linotype', 'Book Antiqua', serif", color: "#1a1a1a" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e0d0", padding: "0 40px", display: "flex", alignItems: "stretch" }}>
        <div style={{ background: "#2d5016", padding: "18px 22px", display: "flex", alignItems: "center", marginRight: "24px" }}>
          <span style={{ fontWeight: "900", fontSize: "13px", letterSpacing: "3px", color: "#f0c040", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#2d5016", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>GENERADOR DE PRESUPUESTOS</span>
          <span style={{ color: "#bbb", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>INSTALADORES · ESTIMACIÓN IA</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: paso >= n ? "#2d5016" : "#e8e0d0",
                color: paso >= n ? "#f0c040" : "#aaa",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: "700",
              }}>{n}</div>
              {n < 3 && <div style={{ width: "20px", height: "1px", background: paso > n ? "#2d5016" : "#e8e0d0" }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 32px" }}>

        {/* PASO 1: Selección categoría */}
        {paso === 1 && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>PASO 1 DE 3</div>
              <div style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a" }}>¿Qué tipo de instalación necesitas presupuestar?</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
              {CATEGORIAS.map(c => (
                <div key={c.id} onClick={() => seleccionarCategoria(c.id)} style={{
                  background: "#fff", border: "2px solid #e8e0d0", padding: "24px 20px",
                  cursor: "pointer", transition: "all 0.2s", textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#2d5016"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e0d0"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>{c.icon}</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: Parámetros */}
        {paso === 2 && cat && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <button onClick={() => setPaso(1)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "12px", fontFamily: "'Courier New', monospace", letterSpacing: "2px", padding: "0", marginBottom: "12px" }}>
                ‹ CAMBIAR CATEGORÍA
              </button>
              <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>PASO 2 DE 3 · {cat.icon} {cat.label.toUpperCase()}</div>
              <div style={{ fontSize: "22px", fontWeight: "700" }}>Parámetros de la instalación</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
              {/* Datos cliente */}
              {[
                { key: "nombre", label: "Nombre del cliente", ph: "Ej: Juan García" },
                { key: "empresa", label: "Empresa (opcional)", ph: "Ej: Instalaciones Norte S.L." },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "2px", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>{label.toUpperCase()}</div>
                  <input value={cliente[key]} onChange={e => setCliente(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e8e0d0", fontSize: "14px", outline: "none", fontFamily: "'Palatino Linotype', serif", boxSizing: "border-box", background: "#fff" }} />
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e8e0d0", padding: "28px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "20px", borderBottom: "1px solid #f0ebe0", paddingBottom: "12px" }}>
                ESPECIFICACIONES TÉCNICAS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {preguntas.map(preg => (
                  <div key={preg.key}>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>{preg.label}</div>
                    {preg.tipo === "number" ? (
                      <input type="number" value={params[preg.key] || ""} onChange={e => setP(preg.key, e.target.value)} placeholder={preg.ph}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e8e0d0", fontSize: "15px", fontWeight: "600", outline: "none", fontFamily: "'Courier New', monospace", boxSizing: "border-box", background: "#fafaf8" }} />
                    ) : (
                      <select value={params[preg.key] || ""} onChange={e => setP(preg.key, e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e8e0d0", fontSize: "13px", outline: "none", fontFamily: "'Palatino Linotype', serif", background: "#fafaf8", cursor: "pointer" }}>
                        <option value="">Seleccionar...</option>
                        {preg.ops.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={generarPresupuesto} disabled={generando}
              style={{
                background: generando ? "#ccc" : "#2d5016", color: generando ? "#fff" : "#f0c040",
                border: "none", padding: "16px 40px", fontSize: "12px", letterSpacing: "3px",
                fontFamily: "'Courier New', monospace", cursor: generando ? "not-allowed" : "pointer", fontWeight: "700",
                boxShadow: generando ? "none" : "0 4px 16px rgba(45,80,22,0.3)",
              }}>
              {generando ? "GENERANDO PRESUPUESTO IA..." : "GENERAR PRESUPUESTO ›"}
            </button>
          </div>
        )}

        {/* PASO 3: Resultado */}
        {paso === 3 && presupuesto && (
          <div>
            {/* Cabecera presupuesto */}
            <div style={{ background: "#2d5016", padding: "28px 32px", marginBottom: "0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#a0c060", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>
                  PRESUPUESTO ESTIMADO · {cat?.label.toUpperCase()}
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>
                  {cliente.nombre || "Cliente"}{cliente.empresa ? ` — ${cliente.empresa}` : ""}
                </div>
                <div style={{ fontSize: "13px", color: "#a0c060", fontStyle: "italic" }}>{presupuesto.resumen}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", color: "#a0c060", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>TOTAL ESTIMADO (sin IVA)</div>
                <div style={{ fontSize: "36px", fontWeight: "900", color: "#f0c040" }}>
                  {presupuesto.total_estimado?.toLocaleString("es-ES")} €
                </div>
                <div style={{ fontSize: "10px", color: "#a0c060", fontFamily: "'Courier New', monospace" }}>
                  Válido: {presupuesto.validez_presupuesto}
                </div>
              </div>
            </div>

            {/* Tabla partidas */}
            <div style={{ background: "#fff", border: "1px solid #e8e0d0", borderTop: "none", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 20px", background: "#f5f0e8", fontSize: "9px", letterSpacing: "2px", color: "#888", fontFamily: "'Courier New', monospace", borderBottom: "1px solid #e8e0d0" }}>
                {["DESCRIPCIÓN / PARTIDA", "CANTIDAD", "P. UNITARIO", "TOTAL"].map(h => <div key={h}>{h}</div>)}
              </div>
              {presupuesto.partidas?.map((p, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  padding: "14px 20px", borderBottom: "1px solid #f5f0e8",
                  background: i % 2 === 0 ? "#fff" : "#fdfcfa",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", marginBottom: "2px" }}>{p.descripcion}</div>
                    <div style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>{p.detalle}</div>
                    <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'Courier New', monospace", marginTop: "2px" }}>{p.referencia_tipo}</div>
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#555" }}>{p.cantidad}</div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", color: "#555" }}>{p.precio_unitario?.toLocaleString("es-ES")} €</div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", fontWeight: "700", color: "#2d5016" }}>{p.precio_total?.toLocaleString("es-ES")} €</div>
                </div>
              ))}

              {/* Totales */}
              <div style={{ padding: "16px 20px", background: "#f5f0e8", borderTop: "2px solid #e8e0d0" }}>
                {[
                  ["Subtotal material", presupuesto.subtotal_material],
                  ["Mano de obra estimada", presupuesto.mano_obra_estimada],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "flex-end", gap: "40px", marginBottom: "6px", fontSize: "13px", color: "#666" }}>
                    <span>{label}</span>
                    <span style={{ fontFamily: "'Courier New', monospace", minWidth: "100px", textAlign: "right" }}>{val?.toLocaleString("es-ES")} €</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "40px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #d0c8b0", fontSize: "16px", fontWeight: "700", color: "#2d5016" }}>
                  <span>TOTAL (sin IVA)</span>
                  <span style={{ fontFamily: "'Courier New', monospace", minWidth: "100px", textAlign: "right" }}>{presupuesto.total_estimado?.toLocaleString("es-ES")} €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                  <span style={{ fontFamily: "'Courier New', monospace" }}>+ IVA 21%: {Math.round((presupuesto.total_estimado || 0) * 0.21).toLocaleString("es-ES")} € = {Math.round((presupuesto.total_estimado || 0) * 1.21).toLocaleString("es-ES")} € TOTAL</span>
                </div>
              </div>
            </div>

            {/* Productos destacados + Notas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#fff", border: "1px solid #e8e0d0", padding: "20px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>PRODUCTOS / MARCAS RECOMENDADAS</div>
                {presupuesto.productos_destacados?.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "#2d5016", fontSize: "12px", marginTop: "2px" }}>▸</span>
                    <span style={{ fontSize: "13px", color: "#555" }}>{p}</span>
                  </div>
                ))}
                <div style={{ marginTop: "12px", padding: "8px 12px", background: "#f5f0e8", fontSize: "10px", color: "#888", fontFamily: "'Courier New', monospace" }}>
                  Entrega material: {presupuesto.plazo_entrega_material}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e8e0d0", padding: "20px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>NOTAS TÉCNICAS</div>
                {presupuesto.notas_tecnicas?.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "#c07010", fontSize: "12px", marginTop: "2px" }}>!</span>
                    <span style={{ fontSize: "12px", color: "#666", lineHeight: "1.5" }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={reiniciar} style={{
                background: "#2d5016", color: "#f0c040", border: "none", padding: "14px 32px",
                fontSize: "11px", letterSpacing: "3px", fontFamily: "'Courier New', monospace",
                cursor: "pointer", fontWeight: "700",
              }}>+ NUEVO PRESUPUESTO</button>
              <button onClick={() => setPaso(2)} style={{
                background: "transparent", color: "#888", border: "1px solid #e8e0d0",
                padding: "14px 24px", fontSize: "11px", letterSpacing: "2px",
                fontFamily: "'Courier New', monospace", cursor: "pointer",
              }}>‹ MODIFICAR PARÁMETROS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
