import { useState, useEffect, useRef } from "react";

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
    { key: "telegestion", label: "¿Con telegestión/DALI?", tipo: "select", ops: ["No", "Sí básico", "Sí avanzado"] },
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
    { key: "monitorizacion", label: "¿Monitorización remota?", tipo: "select", ops: ["No", "Sí"] },
  ],
  clima: [
    { key: "superficie", label: "Superficie a climatizar (m²)", ph: "Ej: 200", tipo: "number" },
    { key: "tipo_sistema", label: "Sistema", tipo: "select", ops: ["Split 1x1", "Multi-split", "VRF/VRV", "Fancoil + enfriadora"] },
    { key: "uso", label: "Uso principal", tipo: "select", ops: ["Residencial", "Comercial", "Industrial"] },
    { key: "aero", label: "¿Aerotermia ACS?", tipo: "select", ops: ["No", "Sí"] },
  ],
};

const DATOS_DEMO = {
  automatizacion: { potencia: "22", num_motores: "3", plc: "PLC básico", zona_atex: "No" },
  iluminacion: { superficie: "800", tipo_espacio: "Almacén industrial", telegestion: "Sí básico", emergencias: "Sí" },
  vehiculo_electrico: { num_puntos: "6", potencia_punto: "22 kW (modo 3)", gestion: "Smart + App", instalacion: "Parking empresa" },
  cuadro_electrico: { potencia_contratada: "63", num_circuitos: "18", protecciones: "Estándar + selectividad", tension: "400V trifásico" },
  energia_solar: { potencia_pico: "30", tipo: "Autoconsumo con batería", fases: "Trifásico", monitorizacion: "Sí" },
  clima: { superficie: "300", tipo_sistema: "VRF/VRV", uso: "Comercial", aero: "No" },
};

const generarNumPresupuesto = () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `SNP-${año}${mes}-${rand}`;
};

const hoy = () => new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function Presupuestos() {
  const [paso, setPaso] = useState(1);
  const [categoria, setCategoria] = useState(null);
  const [instalador, setInstalador] = useState({ nombre: "", empresa: "", telefono: "", email: "", cif: "" });
  const [cliente, setCliente] = useState({ nombre: "", empresa: "", telefono: "", email: "" });
  const [params, setParams] = useState({});
  const [presupuesto, setPresupuesto] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [numPresupuesto] = useState(generarNumPresupuesto);
  const [historial, setHistorial] = useState([]);
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [toast, setToast] = useState("");
  const printRef = useRef(null);

  // Persistencia
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_instalador");
      if (saved) setInstalador(JSON.parse(saved));
      const hist = localStorage.getItem("sonepar_historial");
      if (hist) setHistorial(JSON.parse(hist));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("sonepar_instalador", JSON.stringify(instalador)); } catch {}
  }, [instalador]);

  useEffect(() => {
    try { localStorage.setItem("sonepar_historial", JSON.stringify(historial.slice(0, 20))); } catch {}
  }, [historial]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));
  const setI = (k, v) => setInstalador(p => ({ ...p, [k]: v }));
  const setC = (k, v) => setCliente(p => ({ ...p, [k]: v }));

  const seleccionarCategoria = (cat) => { setCategoria(cat); setParams({}); setPaso(2); };

  const cargarDemo = () => {
    if (categoria && DATOS_DEMO[categoria]) {
      setParams(DATOS_DEMO[categoria]);
      showToast("Datos de ejemplo cargados");
    }
  };

  const generarPresupuesto = async () => {
    const pregs = PREGUNTAS[categoria] || [];
    const vacios = pregs.filter(p => !params[p.key]);
    if (vacios.length > 0) { showToast(`Faltan campos: ${vacios.map(p => p.label).join(", ")}`); return; }

    setGenerando(true);
    const cat = CATEGORIAS.find(c => c.id === categoria);
    const detallesParams = pregs.map(p => `${p.label}: ${params[p.key]}`).join("\n");

    const prompt = `Eres un experto comercial técnico de Sonepar España, especializado en presupuestación de material eléctrico e industrial.

Genera un presupuesto estimado detallado para una instalación de "${cat.label}" con estos parámetros:
${detallesParams}

Cliente: ${cliente.nombre || "Sin especificar"} ${cliente.empresa ? `(${cliente.empresa})` : ""}
Instalador: ${instalador.empresa || instalador.nombre || "Sin especificar"}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni backticks:
{
  "resumen": "descripción breve de la instalación en 1-2 frases",
  "partidas": [
    {
      "descripcion": "nombre de la partida",
      "detalle": "descripción técnica breve",
      "cantidad": "número o descripción",
      "precio_unitario": numero_en_euros,
      "precio_total": numero_en_euros,
      "referencia_tipo": "tipo de producto y fabricante"
    }
  ],
  "subtotal_material": numero,
  "mano_obra_estimada": numero,
  "total_estimado": numero,
  "plazo_entrega_material": "plazo en días hábiles",
  "validez_presupuesto": "30 días",
  "notas_tecnicas": ["nota técnica relevante 1", "nota 2"],
  "productos_destacados": ["producto/marca recomendado 1", "producto 2", "producto 3"],
  "normativas": ["normativa aplicable 1", "normativa 2"]
}

Los precios deben ser realistas y coherentes para el mercado español 2025 (precio distribuidor sin IVA). Incluye entre 4 y 7 partidas detalladas.`;

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

      const entrada = {
        id: numPresupuesto,
        fecha: hoy(),
        categoria: cat.label,
        cliente: cliente.nombre || cliente.empresa || "Sin nombre",
        total: parsed.total_estimado,
      };
      setHistorial(p => [entrada, ...p].slice(0, 20));
      setPaso(3);
    } catch (e) {
      showToast("Error al generar. Inténtalo de nuevo.");
    }
    setGenerando(false);
  };

  const exportarPDF = () => {
    window.print();
  };

  const copiarResumen = () => {
    if (!presupuesto) return;
    const texto = `PRESUPUESTO ${numPresupuesto} — ${hoy()}
${CATEGORIAS.find(c => c.id === categoria)?.label}
Cliente: ${cliente.nombre || "—"} ${cliente.empresa ? `/ ${cliente.empresa}` : ""}
${presupuesto.resumen}

TOTAL ESTIMADO (sin IVA): ${presupuesto.total_estimado?.toLocaleString("es-ES")} €
IVA 21%: ${Math.round((presupuesto.total_estimado || 0) * 0.21).toLocaleString("es-ES")} €
TOTAL CON IVA: ${Math.round((presupuesto.total_estimado || 0) * 1.21).toLocaleString("es-ES")} €

Válido: ${presupuesto.validez_presupuesto}
Entrega material: ${presupuesto.plazo_entrega_material}

Emitido por: ${instalador.empresa || instalador.nombre || "—"} ${instalador.telefono ? `· Tel: ${instalador.telefono}` : ""}`;
    navigator.clipboard.writeText(texto).then(() => showToast("Resumen copiado al portapapeles"));
  };

  const reiniciar = () => { setPaso(1); setCategoria(null); setParams({}); setPresupuesto(null); setCliente({ nombre: "", empresa: "", telefono: "", email: "" }); };

  const preguntas = categoria ? PREGUNTAS[categoria] : [];
  const cat = CATEGORIAS.find(c => c.id === categoria);

  const S = {
    input: { width: "100%", padding: "10px 14px", border: "1px solid #e8e0d0", fontSize: "14px", outline: "none", fontFamily: "Georgia, serif", boxSizing: "border-box", background: "#fff" },
    label: { fontSize: "10px", color: "#aaa", letterSpacing: "2px", fontFamily: "'Courier New', monospace", marginBottom: "6px", display: "block" },
    section: { background: "#fff", border: "1px solid #e8e0d0", padding: "24px 28px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" },
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          * { box-shadow: none !important; }
        }
        .print-only { display: none; }
        @media screen {
          * { box-sizing: border-box; }
          select option { background: #fff; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="no-print" style={{
          position: "fixed", top: "20px", right: "20px", background: "#2d5016", color: "#f0c040",
          padding: "12px 20px", fontSize: "12px", fontFamily: "'Courier New', monospace",
          letterSpacing: "1px", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>{toast}</div>
      )}

      <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif", color: "#1a1a1a" }}>

        {/* Header */}
        <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e8e0d0", padding: "0 40px", display: "flex", alignItems: "stretch" }}>
          <div style={{ background: "#2d5016", padding: "18px 22px", display: "flex", alignItems: "center", marginRight: "24px" }}>
            <span style={{ fontWeight: "900", fontSize: "13px", letterSpacing: "3px", color: "#f0c040", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#2d5016", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "4px" }}>GENERADOR DE PRESUPUESTOS</span>
            <span style={{ color: "#bbb", fontSize: "10px", fontFamily: "'Courier New', monospace" }}>INSTALADORES · IA · v2</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setVistaHistorial(!vistaHistorial)} style={{
              background: vistaHistorial ? "#2d5016" : "transparent", color: vistaHistorial ? "#f0c040" : "#888",
              border: "1px solid " + (vistaHistorial ? "#2d5016" : "#e0e0e0"),
              padding: "8px 16px", fontSize: "10px", letterSpacing: "2px",
              fontFamily: "'Courier New', monospace", cursor: "pointer",
            }}>▤ HISTORIAL ({historial.length})</button>
            {/* Pasos */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: paso >= n ? "#2d5016" : "#e8e0d0",
                    color: paso >= n ? "#f0c040" : "#aaa",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: "700",
                  }}>{n}</div>
                  {n < 3 && <div style={{ width: "16px", height: "1px", background: paso > n ? "#2d5016" : "#e8e0d0" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historial lateral */}
        {vistaHistorial && (
          <div className="no-print" style={{
            position: "fixed", right: 0, top: "61px", bottom: 0, width: "320px",
            background: "#fff", borderLeft: "1px solid #e8e0d0", zIndex: 100,
            padding: "20px", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "16px" }}>
              HISTORIAL DE PRESUPUESTOS
            </div>
            {historial.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#ccc" }}>Sin presupuestos generados aún</div>
            ) : historial.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #f0ebe0", padding: "12px 0" }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#2d5016", marginBottom: "3px" }}>{h.id}</div>
                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "2px" }}>{h.cliente}</div>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{h.categoria} · {h.fecha}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#2d5016" }}>{h.total?.toLocaleString("es-ES")} €</div>
              </div>
            ))}
            {historial.length > 0 && (
              <button onClick={() => { setHistorial([]); showToast("Historial borrado"); }}
                style={{ marginTop: "16px", width: "100%", background: "transparent", border: "1px solid #e8e0d0", color: "#ccc", padding: "8px", fontSize: "10px", fontFamily: "'Courier New', monospace", cursor: "pointer" }}>
                BORRAR HISTORIAL
              </button>
            )}
          </div>
        )}

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 32px" }}>

          {/* PASO 1 */}
          {paso === 1 && (
            <div>
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>PASO 1 — DATOS DEL INSTALADOR Y TIPO DE INSTALACIÓN</div>
                <div style={{ fontSize: "22px", fontWeight: "700" }}>¿Quién emite el presupuesto?</div>
                <div style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>Se guardará automáticamente para futuros presupuestos</div>
              </div>

              <div style={{ ...S.section, marginBottom: "24px" }}>
                <div style={S.label}>DATOS DEL INSTALADOR / EMPRESA</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px" }}>
                  {[
                    { k: "nombre", l: "Nombre", ph: "Tu nombre" },
                    { k: "empresa", l: "Empresa", ph: "Empresa Instalaciones S.L." },
                    { k: "cif", l: "CIF / NIF", ph: "B12345678" },
                    { k: "telefono", l: "Teléfono", ph: "981 000 000" },
                    { k: "email", l: "Email", ph: "contacto@empresa.com" },
                  ].map(({ k, l, ph }) => (
                    <div key={k}>
                      <div style={S.label}>{l.toUpperCase()}</div>
                      <input value={instalador[k]} onChange={e => setI(k, e.target.value)} placeholder={ph} style={S.input} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "#1a1a1a" }}>¿Qué tipo de instalación?</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {CATEGORIAS.map(c => (
                    <div key={c.id} onClick={() => seleccionarCategoria(c.id)} style={{
                      background: "#fff", border: "2px solid #e8e0d0", padding: "24px 20px",
                      cursor: "pointer", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#2d5016"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e0d0"; e.currentTarget.style.transform = "none"; }}
                    >
                      <div style={{ fontSize: "32px", marginBottom: "10px" }}>{c.icon}</div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && cat && (
            <div>
              <button onClick={() => setPaso(1)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "2px", padding: "0", marginBottom: "20px" }}>
                ‹ VOLVER
              </button>
              <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#aaa", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>PASO 2 — {cat.icon} {cat.label.toUpperCase()}</div>
              <div style={{ fontSize: "22px", fontWeight: "700", marginBottom: "24px" }}>Datos del cliente y especificaciones</div>

              {/* Cliente */}
              <div style={{ ...S.section, marginBottom: "16px" }}>
                <div style={S.label}>DATOS DEL CLIENTE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px" }}>
                  {[
                    { k: "nombre", l: "Nombre", ph: "Nombre del cliente" },
                    { k: "empresa", l: "Empresa", ph: "Empresa del cliente" },
                    { k: "telefono", l: "Teléfono", ph: "600 000 000" },
                    { k: "email", l: "Email", ph: "cliente@email.com" },
                  ].map(({ k, l, ph }) => (
                    <div key={k}>
                      <div style={S.label}>{l.toUpperCase()}</div>
                      <input value={cliente[k]} onChange={e => setC(k, e.target.value)} placeholder={ph} style={S.input} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Parámetros técnicos */}
              <div style={{ ...S.section, marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={S.label}>ESPECIFICACIONES TÉCNICAS</div>
                  <button onClick={cargarDemo} style={{
                    background: "#f5f0e8", border: "1px solid #e8e0d0", color: "#888",
                    padding: "5px 14px", fontSize: "10px", letterSpacing: "1px",
                    fontFamily: "'Courier New', monospace", cursor: "pointer",
                  }}>⟳ CARGAR EJEMPLO</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {preguntas.map(preg => (
                    <div key={preg.key}>
                      <div style={S.label}>{preg.label.toUpperCase()}</div>
                      {preg.tipo === "number" ? (
                        <input type="number" value={params[preg.key] || ""} onChange={e => setP(preg.key, e.target.value)} placeholder={preg.ph} style={{ ...S.input, fontWeight: "600", fontFamily: "'Courier New', monospace" }} />
                      ) : (
                        <select value={params[preg.key] || ""} onChange={e => setP(preg.key, e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                          <option value="">Seleccionar...</option>
                          {preg.ops.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={generarPresupuesto} disabled={generando} style={{
                background: generando ? "#ccc" : "#2d5016", color: generando ? "#fff" : "#f0c040",
                border: "none", padding: "16px 40px", fontSize: "12px", letterSpacing: "3px",
                fontFamily: "'Courier New', monospace", cursor: generando ? "not-allowed" : "pointer",
                fontWeight: "700", boxShadow: generando ? "none" : "0 4px 16px rgba(45,80,22,0.3)",
              }}>
                {generando ? "GENERANDO CON IA..." : "GENERAR PRESUPUESTO ›"}
              </button>
            </div>
          )}

          {/* PASO 3 — RESULTADO */}
          {paso === 3 && presupuesto && (
            <div ref={printRef}>

              {/* Cabecera documento */}
              <div style={{ background: "#2d5016", padding: "28px 32px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "900", fontSize: "16px", letterSpacing: "3px", color: "#f0c040", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>SONEPAR</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>PRESUPUESTO DE MATERIAL ELÉCTRICO</div>
                  {instalador.empresa && <div style={{ marginTop: "12px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>Emitido por: {instalador.empresa}</div>}
                  {instalador.nombre && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{instalador.nombre}{instalador.cif ? ` · CIF: ${instalador.cif}` : ""}</div>}
                  {instalador.telefono && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Tel: {instalador.telefono}{instalador.email ? ` · ${instalador.email}` : ""}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "18px", color: "#f0c040", fontWeight: "700", marginBottom: "4px" }}>{numPresupuesto}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace" }}>Fecha: {hoy()}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace" }}>Válido: {presupuesto.validez_presupuesto}</div>
                  <div style={{ marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                    Cliente: {cliente.nombre || cliente.empresa || "Sin especificar"}
                  </div>
                  {cliente.empresa && cliente.nombre && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{cliente.empresa}</div>}
                  {cliente.telefono && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Tel: {cliente.telefono}</div>}
                </div>
              </div>

              {/* Resumen */}
              <div style={{ background: "#f5f0e8", padding: "14px 32px", borderBottom: "1px solid #e8e0d0", fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                {cat?.icon} {cat?.label} — {presupuesto.resumen}
              </div>

              {/* Tabla partidas */}
              <div style={{ background: "#fff", border: "1px solid #e8e0d0", borderTop: "none", marginBottom: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 1fr", padding: "10px 24px", background: "#2d5016", fontSize: "9px", letterSpacing: "2px", color: "#f0c040", fontFamily: "'Courier New', monospace" }}>
                  {["DESCRIPCIÓN / PARTIDA", "CANTIDAD", "P. UNITARIO", "TOTAL"].map(h => <div key={h}>{h}</div>)}
                </div>
                {presupuesto.partidas?.map((p, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 1fr",
                    padding: "14px 24px", borderBottom: "1px solid #f5f0e8",
                    background: i % 2 === 0 ? "#fff" : "#fdfcfa", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{p.descripcion}</div>
                      <div style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>{p.detalle}</div>
                      <div style={{ fontSize: "10px", color: "#bbb", fontFamily: "'Courier New', monospace", marginTop: "2px" }}>{p.referencia_tipo}</div>
                    </div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#555" }}>{p.cantidad}</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#555" }}>{p.precio_unitario?.toLocaleString("es-ES")} €</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", fontWeight: "700", color: "#2d5016" }}>{p.precio_total?.toLocaleString("es-ES")} €</div>
                  </div>
                ))}

                {/* Totales */}
                <div style={{ padding: "16px 24px", background: "#f5f0e8", borderTop: "2px solid #e8e0d0" }}>
                  {[["Subtotal material", presupuesto.subtotal_material], ["Mano de obra estimada", presupuesto.mano_obra_estimada]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "flex-end", gap: "40px", marginBottom: "6px", fontSize: "13px", color: "#666" }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: "'Courier New', monospace", minWidth: "110px", textAlign: "right" }}>{v?.toLocaleString("es-ES")} €</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "40px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #d0c8b0", fontSize: "16px", fontWeight: "700", color: "#2d5016" }}>
                    <span>TOTAL SIN IVA</span>
                    <span style={{ fontFamily: "'Courier New', monospace", minWidth: "110px", textAlign: "right" }}>{presupuesto.total_estimado?.toLocaleString("es-ES")} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "40px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
                    <span>IVA 21%</span>
                    <span style={{ fontFamily: "'Courier New', monospace", minWidth: "110px", textAlign: "right" }}>{Math.round((presupuesto.total_estimado || 0) * 0.21).toLocaleString("es-ES")} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "40px", fontSize: "18px", fontWeight: "900", color: "#1a1a1a", marginTop: "8px", paddingTop: "8px", borderTop: "2px solid #2d5016" }}>
                    <span>TOTAL CON IVA</span>
                    <span style={{ fontFamily: "'Courier New', monospace", minWidth: "110px", textAlign: "right" }}>{Math.round((presupuesto.total_estimado || 0) * 1.21).toLocaleString("es-ES")} €</span>
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {[
                  { titulo: "PRODUCTOS RECOMENDADOS", items: presupuesto.productos_destacados, color: "#2d5016" },
                  { titulo: "NORMATIVAS APLICABLES", items: presupuesto.normativas, color: "#1a3060" },
                  { titulo: "NOTAS TÉCNICAS", items: presupuesto.notas_tecnicas, color: "#7a4000" },
                ].map(({ titulo, items, color }) => (
                  <div key={titulo} style={{ background: "#fff", border: "1px solid #e8e0d0", padding: "16px", borderTop: `3px solid ${color}` }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color, fontFamily: "'Courier New', monospace", marginBottom: "10px", fontWeight: "700" }}>{titulo}</div>
                    {items?.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                        <span style={{ color, fontSize: "10px", marginTop: "3px", flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: "12px", color: "#555", lineHeight: "1.5" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Entrega + disclaimer */}
              <div style={{ background: "#f5f0e8", border: "1px solid #e8e0d0", padding: "14px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  <strong>Plazo de entrega de material:</strong> {presupuesto.plazo_entrega_material}
                </div>
                <div style={{ fontSize: "10px", color: "#aaa", fontStyle: "italic", maxWidth: "400px", textAlign: "right" }}>
                  ⚠ Presupuesto orientativo generado con IA. Precios y disponibilidad sujetos a confirmación. Verificar con Sonepar antes de formalizar pedido.
                </div>
              </div>

              {/* Botones acción */}
              <div className="no-print" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={exportarPDF} style={{
                  background: "#2d5016", color: "#f0c040", border: "none",
                  padding: "14px 28px", fontSize: "11px", letterSpacing: "3px",
                  fontFamily: "'Courier New', monospace", cursor: "pointer", fontWeight: "700",
                }}>⬇ EXPORTAR PDF</button>
                <button onClick={copiarResumen} style={{
                  background: "#fff", color: "#2d5016", border: "2px solid #2d5016",
                  padding: "14px 28px", fontSize: "11px", letterSpacing: "2px",
                  fontFamily: "'Courier New', monospace", cursor: "pointer", fontWeight: "700",
                }}>⎘ COPIAR RESUMEN</button>
                <button onClick={() => setPaso(2)} style={{
                  background: "transparent", color: "#888", border: "1px solid #e8e0d0",
                  padding: "14px 20px", fontSize: "11px", letterSpacing: "2px",
                  fontFamily: "'Courier New', monospace", cursor: "pointer",
                }}>‹ MODIFICAR</button>
                <button onClick={reiniciar} style={{
                  background: "transparent", color: "#888", border: "1px solid #e8e0d0",
                  padding: "14px 20px", fontSize: "11px", letterSpacing: "2px",
                  fontFamily: "'Courier New', monospace", cursor: "pointer",
                }}>+ NUEVO</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
