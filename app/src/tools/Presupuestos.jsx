import { useState, useEffect, useRef, useReducer } from "react";

// ── Paleta de marca Sonepar ──────────────────────────────────────────────────
const C = {
  azulOscuro: "#003087", azulMedio: "#1A4A8A", azulClaro: "#4A90D9",
  azulSuave:  "#EBF1FA", blanco: "#FFFFFF",    fondo: "#F5F6F8",
  texto:      "#1A1A2E", textoSec: "#4A5568",  textoTer: "#8A94A6",
  borde:      "#D1D9E6", verde: "#1B6B3A",     verdeSuave: "#EDF7F2",
  amarillo:   "#C07010", amarilloS: "#FFF8EE", rojo: "#C62828",
  rojoSuave:  "#FDECEA",
};

const LogoSonepar = ({ size = 26, color = "#003087" }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 120 38" fill="none">
    <ellipse cx="16" cy="19" rx="14" ry="7.5" stroke={C.azulClaro} strokeWidth="2.2" fill="none" transform="rotate(-20 16 19)" />
    <ellipse cx="16" cy="19" rx="14" ry="7.5" stroke={color} strokeWidth="2.2" fill="none" transform="rotate(20 16 19)" />
    <text x="34" y="25" fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="700" fontSize="17" fill={color} letterSpacing="0.5">sonepar</text>
  </svg>
);

// ── Catálogo de referencia SONEX v6 (selección por categoría) ────────────────
const CATALOGO_REF = {
  automatizacion: [
    { ref: "ATV320U22M2",    desc: "Variador Schneider ATV320 2.2kW mono",      precio: 310 },
    { ref: "ATV320U40N4B",   desc: "Variador Schneider ATV320 4kW tri",          precio: 415 },
    { ref: "ATV320U75N4B",   desc: "Variador Schneider ATV320 7.5kW tri",        precio: 570 },
    { ref: "ATV320D15N4B",   desc: "Variador Schneider ATV320 15kW tri",         precio: 935 },
    { ref: "LC1D09M7",       desc: "Contactor Schneider TeSys D 9A",             precio: 18 },
    { ref: "LC1D40AM7",      desc: "Contactor Schneider TeSys D 40A",            precio: 47 },
    { ref: "GV2ME16",        desc: "Guardamotor Schneider TeSys 10-16A",         precio: 42 },
    { ref: "TM221CE24R",     desc: "PLC Schneider M221 24E/S",                   precio: 185 },
    { ref: "AF16-30-10-13",  desc: "Contactor ABB 16A 230VAC",                   precio: 25 },
    { ref: "MS116-16",       desc: "Guardamotor ABB 10-16A",                     precio: 38 },
  ],
  iluminacion: [
    { ref: "CoreLine_WT",    desc: "Philips CoreLine WT 36W 4000lm LED",         precio: 42 },
    { ref: "WT120C_LED",     desc: "Philips WT120C LED 58W highbay industrial",  precio: 95 },
    { ref: "LDV-SUB58",      desc: "Ledvance Sublinea 58W LED almacén",          precio: 55 },
    { ref: "DN140B_LED",     desc: "Philips CoreLine Downlight 16W",             precio: 28 },
    { ref: "EV1C8_N8",       desc: "Zemper EVA emergencia 8W 1h",                precio: 38 },
    { ref: "DALI_Driver",    desc: "Driver DALI regulable 0-10V",                precio: 22 },
  ],
  vehiculo_electrico: [
    { ref: "EVL2S7P2RS",     desc: "Schneider EVlink Smart 7.4kW mono",          precio: 420 },
    { ref: "EVL2S22P3RS",    desc: "Schneider EVlink Smart 22kW tri",            precio: 680 },
    { ref: "EVB2S7P2RS",     desc: "Schneider EVlink Business 7.4kW",            precio: 750 },
    { ref: "WBX-CMR2-M-T2A", desc: "Wallbox Commander 2 22kW pantalla",         precio: 890 },
    { ref: "WBX-PSR3-M-T2A", desc: "Wallbox Pulsar Plus 22kW",                  precio: 580 },
    { ref: "ABB-ACC22T",     desc: "ABB Terra 22kW carga rápida",                precio: 1450 },
    { ref: "A9F74332",       desc: "iC60N 3P 32A curva C protección línea VE",  precio: 30 },
  ],
  cuadro_electrico: [
    { ref: "A9F74216",       desc: "iC60N Schneider 2P 16A curva C 6kA",        precio: 14 },
    { ref: "A9F74316",       desc: "iC60N Schneider 3P 16A curva C 6kA",        precio: 25 },
    { ref: "A9F74332",       desc: "iC60N Schneider 3P 32A curva C 6kA",        precio: 31 },
    { ref: "A9F74363",       desc: "iC60N Schneider 3P 63A curva C 6kA",        precio: 47 },
    { ref: "A9R14240",       desc: "iID Schneider 2P 40A 30mA Tipo AC",         precio: 34 },
    { ref: "A9R14440",       desc: "iID Schneider 4P 40A 30mA Tipo AC",         precio: 62 },
    { ref: "MBN116",         desc: "Magnetotérmico Hager 1P+N 16A",             precio: 16 },
    { ref: "CDN440D",        desc: "Diferencial Hager 4P 40A 30mA Tipo A",      precio: 72 },
    { ref: "S201M-C16",      desc: "Magnetotérmico ABB S200 1P 16A 10kA",       precio: 14 },
  ],
  energia_solar: [
    { ref: "FRO-SYMO-15",    desc: "Fronius Symo 15kW inversor tri",            precio: 2200 },
    { ref: "FRO-SYMO-8",     desc: "Fronius Symo 8.2kW inversor tri",           precio: 1450 },
    { ref: "SMA-SB5-3",      desc: "SMA Sunny Boy 5kW inversor mono",           precio: 980 },
    { ref: "PYL-US3000C",    desc: "Pylontech US3000C batería 3.5kWh",          precio: 1100 },
    { ref: "VIC-MPPT-100",   desc: "Victron SmartSolar MPPT 100/30",            precio: 185 },
    { ref: "A9F74332",       desc: "iC60N 3P 32A protección generador",         precio: 31 },
  ],
  clima: [
    { ref: "ACS355-03E-07",  desc: "ABB ACS355 3kW variador bomba/ventilador",  precio: 355 },
    { ref: "ACS355-03E-17",  desc: "ABB ACS355 7.5kW variador HVAC",            precio: 640 },
    { ref: "LC1D25M7",       desc: "Contactor Schneider 25A para compresor",    precio: 31 },
    { ref: "A9F74316",       desc: "iC60N 3P 16A protección circuito clima",    precio: 25 },
    { ref: "GV2ME22",        desc: "Guardamotor Schneider 16-22A",              precio: 49 },
  ],
};

// ── Definición de categorías y preguntas ─────────────────────────────────────
const CATEGORIAS = [
  { id: "automatizacion",    label: "Automatización Industrial", icon: "⚙" },
  { id: "iluminacion",       label: "Iluminación",               icon: "💡" },
  { id: "vehiculo_electrico",label: "Vehículo Eléctrico",        icon: "⚡" },
  { id: "cuadro_electrico",  label: "Cuadro Eléctrico",          icon: "🔌" },
  { id: "energia_solar",     label: "Energía Solar / FV",        icon: "☀" },
  { id: "clima",             label: "Climatización / HVAC",      icon: "❄" },
];

const PREGUNTAS = {
  automatizacion: [
    { key: "potencia",     label: "Potencia total motores (kW)", ph: "Ej: 37",  tipo: "number" },
    { key: "num_motores",  label: "Nº de motores a controlar",   ph: "Ej: 3",   tipo: "number" },
    { key: "plc",          label: "¿Incluye PLC/automatismo?",   tipo: "select", ops: ["No", "PLC básico", "PLC avanzado + HMI"] },
    { key: "zona_atex",    label: "¿Zona ATEX?",                 tipo: "select", ops: ["No", "Zona 2", "Zona 1"] },
  ],
  iluminacion: [
    { key: "superficie",    label: "Superficie a iluminar (m²)", ph: "Ej: 500", tipo: "number" },
    { key: "tipo_espacio",  label: "Tipo de espacio",             tipo: "select", ops: ["Oficinas", "Almacén industrial", "Exterior", "Parking"] },
    { key: "telegestion",   label: "¿Con telegestión/DALI?",      tipo: "select", ops: ["No", "Sí básico", "Sí avanzado"] },
    { key: "emergencias",   label: "¿Incluye emergencias?",       tipo: "select", ops: ["No", "Sí"] },
  ],
  vehiculo_electrico: [
    { key: "num_puntos",     label: "Nº de puntos de recarga",   ph: "Ej: 4",  tipo: "number" },
    { key: "potencia_punto", label: "Potencia por punto (kW)",   tipo: "select", ops: ["7,4 kW (modo 2)", "11 kW (modo 3)", "22 kW (modo 3)", "50 kW (DC rápido)"] },
    { key: "gestion",        label: "¿Gestión de carga?",        tipo: "select", ops: ["No", "Básica", "Smart + App"] },
    { key: "instalacion",    label: "Tipo de instalación",        tipo: "select", ops: ["Garaje residencial", "Parking empresa", "Vía pública"] },
  ],
  cuadro_electrico: [
    { key: "potencia_contratada", label: "Potencia contratada (kW)", ph: "Ej: 100", tipo: "number" },
    { key: "num_circuitos",       label: "Nº de circuitos",           ph: "Ej: 24",  tipo: "number" },
    { key: "protecciones",        label: "Nivel de protecciones",     tipo: "select", ops: ["Básico (IGA + diferencial)", "Estándar + selectividad", "Completo + monitorización"] },
    { key: "tension",             label: "Tensión",                    tipo: "select", ops: ["230V monofásico", "400V trifásico", "BT industrial"] },
  ],
  energia_solar: [
    { key: "potencia_pico",  label: "Potencia pico (kWp)",        ph: "Ej: 20", tipo: "number" },
    { key: "tipo",           label: "Tipo de instalación",         tipo: "select", ops: ["Autoconsumo sin batería", "Autoconsumo con batería", "Aislada"] },
    { key: "fases",          label: "Conexión red",                tipo: "select", ops: ["Monofásico", "Trifásico"] },
    { key: "monitorizacion", label: "¿Monitorización remota?",     tipo: "select", ops: ["No", "Sí"] },
  ],
  clima: [
    { key: "superficie",   label: "Superficie a climatizar (m²)", ph: "Ej: 200", tipo: "number" },
    { key: "tipo_sistema", label: "Sistema",                       tipo: "select", ops: ["Split 1x1", "Multi-split", "VRF/VRV", "Fancoil + enfriadora"] },
    { key: "uso",          label: "Uso principal",                 tipo: "select", ops: ["Residencial", "Comercial", "Industrial"] },
    { key: "aero",         label: "¿Aerotermia ACS?",             tipo: "select", ops: ["No", "Sí"] },
  ],
};

const DEMOS = {
  automatizacion:    { potencia: "22", num_motores: "3",  plc: "PLC básico",              zona_atex: "No" },
  iluminacion:       { superficie: "800", tipo_espacio: "Almacén industrial", telegestion: "Sí básico", emergencias: "Sí" },
  vehiculo_electrico:{ num_puntos: "6", potencia_punto: "22 kW (modo 3)", gestion: "Smart + App", instalacion: "Parking empresa" },
  cuadro_electrico:  { potencia_contratada: "63", num_circuitos: "18", protecciones: "Estándar + selectividad", tension: "400V trifásico" },
  energia_solar:     { potencia_pico: "30", tipo: "Autoconsumo con batería", fases: "Trifásico", monitorizacion: "Sí" },
  clima:             { superficie: "300", tipo_sistema: "VRF/VRV", uso: "Comercial", aero: "No" },
};

const genNum = () => {
  const d = new Date();
  return `SNP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100)}`;
};
const hoy = () => new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric" });

// ── Reducer para gestión del editor de partidas ───────────────────────────────
function partidasReducer(state, action) {
  switch (action.type) {
    case "SET":
      return action.payload.map((p, i) => ({ ...p, _id: i }));
    case "UPDATE":
      return state.map(p => p._id === action.id ? { ...p, [action.field]: action.value, precio_total: action.field === "precio_unitario" ? action.value * p.cantidad : action.field === "cantidad" ? p.precio_unitario * action.value : p.precio_total } : p);
    case "REMOVE":
      return state.filter(p => p._id !== action.id);
    case "ADD":
      return [...state, { _id: Date.now(), descripcion: "Nueva partida", detalle: "", referencia: "—", cantidad: 1, precio_unitario: 0, precio_total: 0 }];
    default:
      return state;
  }
}

// ── Prompt para la IA ─────────────────────────────────────────────────────────
const buildPrompt = (cat, params, instalador, cliente, catalogoRef) => {
  const pregs = PREGUNTAS[cat.id] || [];
  const detalles = pregs.map(p => `${p.label}: ${params[p.key]}`).join("\n");
  const refs = catalogoRef.map(r => `  - ${r.ref} | ${r.desc} | ~${r.precio}€`).join("\n");

  return `Eres un experto técnico-comercial de Sonepar España. Genera un presupuesto para una instalación de "${cat.label}".

PARÁMETROS:
${detalles}

Cliente: ${cliente.nombre || "Sin especificar"} ${cliente.empresa ? `(${cliente.empresa})` : ""}
Instalador: ${instalador.empresa || instalador.nombre || "Sin especificar"}

CATÁLOGO DE REFERENCIA SONEPAR (usa estas referencias cuando apliquen):
${refs}

Responde ÚNICAMENTE con JSON válido, sin backticks ni texto adicional:
{
  "confianza": "Alta|Media|Revisar",
  "resumen": "descripción breve de la instalación en 1-2 frases",
  "partidas": [
    {
      "descripcion": "nombre de la partida",
      "detalle": "descripción técnica breve",
      "referencia": "referencia del catálogo si aplica, o descripción del tipo de producto",
      "cantidad": número,
      "precio_unitario": número_en_euros,
      "precio_total": número_en_euros,
      "nota_tecnica": "justificación breve de por qué se incluye esta partida"
    }
  ],
  "subtotal_material": número,
  "mano_obra": número,
  "total": número,
  "plazo_entrega": "plazo en días hábiles",
  "normativas": ["normativa 1", "normativa 2"],
  "notas": ["nota técnica 1", "nota técnica 2"],
  "alternativa_eco": "descripción breve de una alternativa de menor coste y qué concesiones implica"
}

Usa referencias del catálogo cuando encajen. Si no hay referencia exacta, usa el tipo de producto. Entre 4 y 7 partidas. Precios realistas mercado español 2025 sin IVA.`;
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function GeneradorPresupuesto() {
  const [paso, setPaso]           = useState(1);
  const [categoria, setCategoria] = useState(null);
  const [instalador, setInstalador] = useState({ nombre:"", empresa:"", telefono:"", email:"", cif:"" });
  const [cliente, setCliente]     = useState({ nombre:"", empresa:"", telefono:"", email:"" });
  const [params, setParams]       = useState({});
  const [presupuesto, setPresupuesto] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [partidas, dispatch]      = useReducer(partidasReducer, []);
  const [editando, setEditando]   = useState(null); // {id, field}
  const [numPresupuesto]          = useState(genNum);
  const [historial, setHistorial] = useState([]);
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [toast, setToast]         = useState("");
  const [mostrarAlternativa, setMostrarAlternativa] = useState(false);

  // Persistencia instalador + historial
  useEffect(() => {
    try {
      const s = localStorage.getItem("sonepar_instalador_v3");
      if (s) setInstalador(JSON.parse(s));
      const h = localStorage.getItem("sonepar_historial_v3");
      if (h) setHistorial(JSON.parse(h));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("sonepar_instalador_v3", JSON.stringify(instalador)); } catch {}
  }, [instalador]);

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(""), 2800);
  };

  const cat = CATEGORIAS.find(c => c.id === categoria);

  const totales = {
    material:   partidas.reduce((s, p) => s + (Number(p.precio_total)||0), 0),
    manoObra:   presupuesto?.mano_obra || 0,
    get total() { return this.material + this.manoObra; },
  };

  // ── Generar presupuesto ───────────────────────────────────────────────────
  const generar = async () => {
    const pregs = PREGUNTAS[categoria] || [];
    const vacios = pregs.filter(p => !params[p.key]);
    if (vacios.length) { showToast(`Faltan: ${vacios.map(p=>p.label).join(", ")}`, false); return; }

    setGenerando(true);
    const catalogoRef = CATALOGO_REF[categoria] || [];

    try {
      const res  = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt(cat, params, instalador, cliente, catalogoRef) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text||"").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());

      setPresupuesto(parsed);
      dispatch({ type: "SET", payload: parsed.partidas || [] });

      const entrada = {
        id: numPresupuesto, fecha: hoy(),
        categoria: cat.label,
        cliente: cliente.nombre || cliente.empresa || "Sin nombre",
        total: parsed.total,
        confianza: parsed.confianza,
      };
      const nuevo = [entrada, ...historial].slice(0, 20);
      setHistorial(nuevo);
      try { localStorage.setItem("sonepar_historial_v3", JSON.stringify(nuevo)); } catch {}

      setPaso(3);
    } catch { showToast("Error al generar. Inténtalo de nuevo.", false); }
    setGenerando(false);
  };

  const copiarResumen = () => {
    if (!presupuesto) return;
    const txt = `PRESUPUESTO ${numPresupuesto} — ${hoy()}\n${cat?.label}\nCliente: ${cliente.nombre||"—"} ${cliente.empresa?`/ ${cliente.empresa}`:""}\n${presupuesto.resumen}\n\nMaterial: ${totales.material.toLocaleString("es-ES")} €\nMano de obra: ${totales.manoObra.toLocaleString("es-ES")} €\nTOTAL SIN IVA: ${totales.total.toLocaleString("es-ES")} €\nTOTAL CON IVA: ${Math.round(totales.total*1.21).toLocaleString("es-ES")} €\n\nVálido: ${presupuesto.validez_presupuesto||"30 días"}\nEmitido por: ${instalador.empresa||instalador.nombre||"—"}`;
    navigator.clipboard.writeText(txt).then(() => showToast("Resumen copiado"));
  };

  const reiniciar = () => {
    setPaso(1); setCategoria(null); setParams({});
    setPresupuesto(null); dispatch({ type:"SET", payload:[] });
    setCliente({ nombre:"", empresa:"", telefono:"", email:"" });
    setMostrarAlternativa(false);
  };

  // ── Estilos reutilizables ─────────────────────────────────────────────────
  const inp = { width:"100%", padding:"9px 12px", fontSize:"13px", fontFamily:"system-ui,Segoe UI,sans-serif", color:C.texto, border:`1.5px solid ${C.borde}`, borderRadius:"6px", background:C.blanco, outline:"none" };
  const lbl = { fontSize:"10px", fontWeight:"600", letterSpacing:"0.8px", color:C.textoTer, fontFamily:"system-ui,Segoe UI,sans-serif", marginBottom:"5px", display:"block" };
  const btnP = (dis=false) => ({ padding:"10px 22px", fontSize:"13px", fontWeight:"600", fontFamily:"system-ui,Segoe UI,sans-serif", background: dis ? C.textoTer : C.azulOscuro, color:C.blanco, border:"none", borderRadius:"6px", cursor: dis?"default":"pointer" });
  const btnS = { padding:"9px 18px", fontSize:"12px", fontWeight:"500", fontFamily:"system-ui,Segoe UI,sans-serif", background:C.blanco, color:C.azulOscuro, border:`1.5px solid ${C.azulOscuro}`, borderRadius:"6px", cursor:"pointer" };
  const confianzaColor = { "Alta": C.verde, "Media": C.amarillo, "Revisar": C.rojo };
  const confianzaBg    = { "Alta": C.verdeSuave, "Media": C.amarilloS, "Revisar": C.rojoSuave };

  return (
    <>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        .partida-row:hover { background: ${C.azulSuave} !important; }
        .cat-card:hover { border-color: ${C.azulOscuro} !important; transform: translateY(-2px); }
        @media print {
          .no-print { display:none !important; }
          body { background:white; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:"20px", right:"20px", background: toast.ok!==false ? C.verde : C.rojo, color:C.blanco, padding:"12px 20px", fontSize:"13px", fontFamily:"system-ui,Segoe UI,sans-serif", borderRadius:"8px", zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ minHeight:"100vh", background:C.fondo, fontFamily:"system-ui,Segoe UI,sans-serif", color:C.texto }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="no-print" style={{ background:C.azulOscuro, padding:"0 32px", display:"flex", alignItems:"center", gap:"20px", height:"56px" }}>
          <LogoSonepar size={24} color={C.blanco} />
          <div style={{ width:"1px", height:"28px", background:"rgba(255,255,255,0.2)" }} />
          <span style={{ color:C.blanco, fontSize:"13px", fontWeight:"500" }}>Generador de Presupuestos</span>
          <span style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px" }}>v3.0</span>
          <div style={{ flex:1 }} />

          {/* Indicador de pasos */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginRight:"16px" }}>
            {[["1","Instalador"],["2","Parámetros"],["3","Presupuesto"]].map(([n, lbl], i) => (
              <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ width:"24px", height:"24px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"700", background: paso >= parseInt(n) ? C.blanco : "rgba(255,255,255,0.2)", color: paso >= parseInt(n) ? C.azulOscuro : "rgba(255,255,255,0.5)" }}>{n}</div>
                  <span style={{ fontSize:"11px", color: paso >= parseInt(n) ? C.blanco : "rgba(255,255,255,0.4)", display: paso===parseInt(n) ? "inline" : "none" }}>{lbl}</span>
                </div>
                {i < 2 && <div style={{ width:"20px", height:"1px", background: paso > parseInt(n) ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }} />}
              </div>
            ))}
          </div>

          <button onClick={() => setVistaHistorial(!vistaHistorial)} style={{ padding:"6px 14px", fontSize:"12px", fontWeight:"500", background: vistaHistorial ? "rgba(255,255,255,0.15)" : "transparent", color: vistaHistorial ? C.blanco : "rgba(255,255,255,0.6)", border:"none", borderRadius:"6px", cursor:"pointer", fontFamily:"system-ui,Segoe UI,sans-serif" }}>
            Historial ({historial.length})
          </button>
        </div>
        <div style={{ height:"3px", background:`linear-gradient(90deg,${C.azulOscuro},${C.azulClaro})` }} />

        {/* ── Historial lateral ──────────────────────────────────────────── */}
        {vistaHistorial && (
          <div className="no-print fade-in" style={{ position:"fixed", right:0, top:"59px", bottom:0, width:"300px", background:C.blanco, borderLeft:`1px solid ${C.borde}`, zIndex:100, padding:"20px", overflowY:"auto", boxShadow:"-4px 0 20px rgba(0,0,0,0.08)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <span style={{ fontSize:"11px", fontWeight:"600", letterSpacing:"0.5px", color:C.textoTer }}>HISTORIAL</span>
              <button onClick={() => setVistaHistorial(false)} style={{ background:"none", border:"none", fontSize:"16px", cursor:"pointer", color:C.textoTer }}>×</button>
            </div>
            {historial.length === 0 ? (
              <div style={{ fontSize:"13px", color:C.textoTer }}>Sin presupuestos aún</div>
            ) : historial.map((h, i) => (
              <div key={i} style={{ borderBottom:`1px solid ${C.borde}`, padding:"12px 0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                  <span style={{ fontSize:"10px", fontWeight:"600", color:C.azulClaro }}>{h.id}</span>
                  {h.confianza && <span style={{ fontSize:"10px", fontWeight:"600", color: confianzaColor[h.confianza]||C.textoTer, background: confianzaBg[h.confianza]||"#eee", padding:"1px 6px", borderRadius:"4px" }}>{h.confianza}</span>}
                </div>
                <div style={{ fontSize:"13px", fontWeight:"600", color:C.texto, marginBottom:"2px" }}>{h.cliente}</div>
                <div style={{ fontSize:"11px", color:C.textoTer, marginBottom:"4px" }}>{h.categoria} · {h.fecha}</div>
                <div style={{ fontSize:"15px", fontWeight:"700", color:C.azulOscuro }}>{h.total?.toLocaleString("es-ES")} €</div>
              </div>
            ))}
            {historial.length > 0 && (
              <button onClick={() => { setHistorial([]); try { localStorage.removeItem("sonepar_historial_v3"); } catch {} showToast("Historial borrado"); }} style={{ ...btnS, width:"100%", marginTop:"16px", color:C.rojo, borderColor:C.rojo, fontSize:"11px" }}>
                Borrar historial
              </button>
            )}
          </div>
        )}

        <div style={{ maxWidth:"900px", margin:"0 auto", padding:"36px 28px" }}>

          {/* ── PASO 1 — Instalador + Categoría ─────────────────────────── */}
          {paso === 1 && (
            <div className="fade-in">
              <div style={{ marginBottom:"28px" }}>
                <div style={{ fontSize:"11px", fontWeight:"600", letterSpacing:"0.5px", color:C.textoTer, marginBottom:"6px" }}>PASO 1 DE 3</div>
                <div style={{ fontSize:"22px", fontWeight:"700", color:C.texto }}>Datos del instalador</div>
                <div style={{ fontSize:"13px", color:C.textoTer, marginTop:"4px" }}>Se guardan automáticamente para futuros presupuestos</div>
              </div>

              <div style={{ background:C.blanco, border:`1px solid ${C.borde}`, borderRadius:"10px", padding:"24px", marginBottom:"28px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  {[["nombre","Nombre","Tu nombre"],["empresa","Empresa","Empresa Instalaciones S.L."],["cif","CIF / NIF","B12345678"],["telefono","Teléfono","981 000 000"],["email","Email","contacto@empresa.com"]].map(([k,l,ph]) => (
                    <div key={k}>
                      <label style={lbl}>{l.toUpperCase()}</label>
                      <input value={instalador[k]} onChange={e => setInstalador(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize:"15px", fontWeight:"700", color:C.texto, marginBottom:"16px" }}>¿Qué tipo de instalación?</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"12px" }}>
                {CATEGORIAS.map(c => (
                  <div key={c.id} className="cat-card" onClick={() => { setCategoria(c.id); setParams({}); setPaso(2); }} style={{ background:C.blanco, border:`1.5px solid ${C.borde}`, borderRadius:"10px", padding:"24px 18px", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
                    <div style={{ fontSize:"30px", marginBottom:"10px" }}>{c.icon}</div>
                    <div style={{ fontSize:"13px", fontWeight:"600", color:C.texto }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 2 — Cliente + Parámetros ───────────────────────────── */}
          {paso === 2 && cat && (
            <div className="fade-in">
              <button onClick={() => setPaso(1)} style={{ background:"none", border:"none", color:C.textoTer, cursor:"pointer", fontSize:"12px", marginBottom:"20px", fontFamily:"system-ui,Segoe UI,sans-serif" }}>
                ← Volver
              </button>
              <div style={{ marginBottom:"24px" }}>
                <div style={{ fontSize:"11px", fontWeight:"600", letterSpacing:"0.5px", color:C.textoTer, marginBottom:"6px" }}>PASO 2 DE 3 — {cat.icon} {cat.label.toUpperCase()}</div>
                <div style={{ fontSize:"22px", fontWeight:"700", color:C.texto }}>Datos del cliente y especificaciones</div>
              </div>

              {/* Datos cliente */}
              <div style={{ background:C.blanco, border:`1px solid ${C.borde}`, borderRadius:"10px", padding:"22px", marginBottom:"16px" }}>
                <div style={{ fontSize:"11px", fontWeight:"600", letterSpacing:"0.5px", color:C.textoTer, marginBottom:"14px" }}>DATOS DEL CLIENTE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  {[["nombre","Nombre","Nombre del cliente"],["empresa","Empresa","Empresa del cliente"],["telefono","Teléfono","600 000 000"],["email","Email","cliente@email.com"]].map(([k,l,ph]) => (
                    <div key={k}>
                      <label style={lbl}>{l.toUpperCase()}</label>
                      <input value={cliente[k]} onChange={e => setCliente(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Parámetros técnicos */}
              <div style={{ background:C.blanco, border:`1px solid ${C.borde}`, borderRadius:"10px", padding:"22px", marginBottom:"22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                  <span style={{ fontSize:"11px", fontWeight:"600", letterSpacing:"0.5px", color:C.textoTer }}>ESPECIFICACIONES TÉCNICAS</span>
                  <button onClick={() => { setParams(DEMOS[categoria]||{}); showToast("Datos de ejemplo cargados"); }} style={btnS}>
                    Cargar ejemplo
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                  {(PREGUNTAS[categoria]||[]).map(preg => (
                    <div key={preg.key}>
                      <label style={lbl}>{preg.label.toUpperCase()}</label>
                      {preg.tipo === "number" ? (
                        <input type="number" value={params[preg.key]||""} onChange={e => setParams(p=>({...p,[preg.key]:e.target.value}))} placeholder={preg.ph} style={inp} />
                      ) : (
                        <select value={params[preg.key]||""} onChange={e => setParams(p=>({...p,[preg.key]:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
                          <option value="">Seleccionar…</option>
                          {preg.ops.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={generar} disabled={generando} style={{ ...btnP(generando), padding:"13px 36px", fontSize:"14px" }}>
                {generando ? "Generando con IA…" : "Generar presupuesto →"}
              </button>
            </div>
          )}

          {/* ── PASO 3 — Presupuesto editable ───────────────────────────── */}
          {paso === 3 && presupuesto && (
            <div className="fade-in">

              {/* Cabecera del documento */}
              <div style={{ background:C.azulOscuro, borderRadius:"10px 10px 0 0", padding:"28px 32px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0" }}>
                <div>
                  <LogoSonepar size={26} color={C.blanco} />
                  <div style={{ fontSize:"10px", letterSpacing:"1px", color:"rgba(255,255,255,0.5)", marginTop:"8px", fontWeight:"600" }}>PRESUPUESTO DE MATERIAL ELÉCTRICO</div>
                  {instalador.empresa && <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.85)", marginTop:"10px" }}>Emitido por: {instalador.empresa}</div>}
                  {instalador.nombre  && <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>{instalador.nombre}{instalador.cif ? ` · CIF: ${instalador.cif}` : ""}</div>}
                  {instalador.telefono && <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>Tel: {instalador.telefono}{instalador.email ? ` · ${instalador.email}` : ""}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"18px", fontWeight:"700", color:C.azulClaro, marginBottom:"4px" }}>{numPresupuesto}</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)" }}>Fecha: {hoy()}</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)" }}>Válido: 30 días</div>
                  {/* Badge de confianza */}
                  {presupuesto.confianza && (
                    <div style={{ marginTop:"10px", display:"inline-block", background: confianzaBg[presupuesto.confianza], color: confianzaColor[presupuesto.confianza], padding:"4px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:"600" }}>
                      ● Confianza: {presupuesto.confianza}
                    </div>
                  )}
                  <div style={{ marginTop:"10px", fontSize:"12px", color:"rgba(255,255,255,0.7)" }}>
                    Cliente: {cliente.nombre || cliente.empresa || "Sin especificar"}
                    {cliente.empresa && cliente.nombre && <div style={{ color:"rgba(255,255,255,0.5)" }}>{cliente.empresa}</div>}
                  </div>
                </div>
              </div>

              {/* Resumen instalación */}
              <div style={{ background:C.azulSuave, border:`1px solid ${C.borde}`, borderTop:"none", padding:"12px 32px", fontSize:"13px", color:C.textoSec, fontStyle:"italic" }}>
                {cat?.icon} {cat?.label} — {presupuesto.resumen}
              </div>

              {/* ── Tabla de partidas editable ───────────────────────────── */}
              <div style={{ background:C.blanco, border:`1px solid ${C.borde}`, borderTop:"none", marginBottom:"16px", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
                {/* Cabecera tabla */}
                <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr 36px", padding:"10px 20px", background:C.azulMedio, fontSize:"10px", fontWeight:"600", letterSpacing:"0.8px", color:C.blanco }}>
                  {["DESCRIPCIÓN / REF.", "QTY", "P. UNIT.", "TOTAL", ""].map((h,i) => <div key={i}>{h}</div>)}
                </div>

                {/* Filas editables */}
                {partidas.map((p, idx) => (
                  <div key={p._id} className="partida-row" style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr 36px", padding:"12px 20px", borderBottom:`1px solid ${C.borde}`, background: idx%2===0 ? C.blanco : C.fondo, alignItems:"center", transition:"background 0.12s" }}>
                    <div>
                      {editando?.id===p._id && editando?.field==="descripcion" ? (
                        <input autoFocus value={p.descripcion} onChange={e => dispatch({type:"UPDATE",id:p._id,field:"descripcion",value:e.target.value})} onBlur={() => setEditando(null)} style={{ ...inp, fontSize:"13px", padding:"4px 8px" }} />
                      ) : (
                        <div style={{ fontSize:"13px", fontWeight:"600", color:C.texto, cursor:"pointer" }} onClick={() => setEditando({id:p._id,field:"descripcion"})} title="Clic para editar">{p.descripcion}</div>
                      )}
                      <div style={{ fontSize:"11px", color:C.textoTer, marginTop:"2px" }}>{p.detalle}</div>
                      <div style={{ fontSize:"10px", color:C.azulClaro, fontWeight:"600", marginTop:"2px" }}>{p.referencia}</div>
                      {p.nota_tecnica && <div style={{ fontSize:"10px", color:C.textoTer, fontStyle:"italic", marginTop:"2px" }}>ⓘ {p.nota_tecnica}</div>}
                    </div>

                    {/* Cantidad editable */}
                    <div>
                      {editando?.id===p._id && editando?.field==="cantidad" ? (
                        <input autoFocus type="number" value={p.cantidad} onChange={e => dispatch({type:"UPDATE",id:p._id,field:"cantidad",value:Number(e.target.value)})} onBlur={() => setEditando(null)} style={{ ...inp, width:"80px", fontSize:"13px", padding:"4px 8px" }} />
                      ) : (
                        <span style={{ fontSize:"13px", color:C.textoSec, cursor:"pointer", borderBottom:`1px dashed ${C.borde}` }} onClick={() => setEditando({id:p._id,field:"cantidad"})} title="Clic para editar">{p.cantidad}</span>
                      )}
                    </div>

                    {/* Precio unitario editable */}
                    <div>
                      {editando?.id===p._id && editando?.field==="precio_unitario" ? (
                        <input autoFocus type="number" value={p.precio_unitario} onChange={e => dispatch({type:"UPDATE",id:p._id,field:"precio_unitario",value:Number(e.target.value)})} onBlur={() => setEditando(null)} style={{ ...inp, width:"100px", fontSize:"13px", padding:"4px 8px" }} />
                      ) : (
                        <span style={{ fontSize:"13px", color:C.textoSec, cursor:"pointer", borderBottom:`1px dashed ${C.borde}` }} onClick={() => setEditando({id:p._id,field:"precio_unitario"})} title="Clic para editar">{Number(p.precio_unitario).toLocaleString("es-ES")} €</span>
                      )}
                    </div>

                    <div style={{ fontSize:"14px", fontWeight:"700", color:C.azulOscuro }}>
                      {Number(p.precio_total).toLocaleString("es-ES")} €
                    </div>

                    <button onClick={() => dispatch({type:"REMOVE",id:p._id})} title="Eliminar partida" style={{ background:"none", border:"none", color:C.rojoSuave, cursor:"pointer", fontSize:"16px", lineHeight:1 }}>×</button>
                  </div>
                ))}

                {/* Añadir partida */}
                <div className="no-print" style={{ padding:"10px 20px", borderTop:`1px dashed ${C.borde}` }}>
                  <button onClick={() => dispatch({type:"ADD"})} style={{ ...btnS, fontSize:"11px", padding:"6px 14px", color:C.azulClaro, borderColor:C.azulClaro }}>
                    + Añadir partida
                  </button>
                </div>

                {/* Totales */}
                <div style={{ padding:"18px 24px", background:C.fondo, borderTop:`2px solid ${C.borde}` }}>
                  {[["Material (sin IVA)", totales.material], ["Mano de obra estimada", totales.manoObra]].map(([l,v]) => (
                    <div key={l} style={{ display:"flex", justifyContent:"flex-end", gap:"48px", marginBottom:"6px", fontSize:"13px", color:C.textoSec }}>
                      <span>{l}</span>
                      <span style={{ fontWeight:"600", minWidth:"110px", textAlign:"right" }}>{v.toLocaleString("es-ES")} €</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:"48px", marginTop:"10px", paddingTop:"10px", borderTop:`2px solid ${C.borde}`, fontSize:"16px", fontWeight:"700", color:C.azulOscuro }}>
                    <span>TOTAL SIN IVA</span>
                    <span style={{ minWidth:"110px", textAlign:"right" }}>{totales.total.toLocaleString("es-ES")} €</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:"48px", fontSize:"13px", color:C.textoTer, marginTop:"4px" }}>
                    <span>IVA 21%</span>
                    <span style={{ minWidth:"110px", textAlign:"right" }}>{Math.round(totales.total*0.21).toLocaleString("es-ES")} €</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:"48px", fontSize:"20px", fontWeight:"900", color:C.texto, marginTop:"8px", paddingTop:"8px", borderTop:`2px solid ${C.azulOscuro}` }}>
                    <span>TOTAL CON IVA</span>
                    <span style={{ minWidth:"110px", textAlign:"right" }}>{Math.round(totales.total*1.21).toLocaleString("es-ES")} €</span>
                  </div>
                </div>
              </div>

              {/* Info adicional en 3 columnas */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                {[
                  { titulo:"NORMATIVAS APLICABLES", items: presupuesto.normativas,  accent: C.azulOscuro },
                  { titulo:"NOTAS TÉCNICAS",         items: presupuesto.notas,       accent: C.azulMedio  },
                  { titulo:"PLAZO Y CONDICIONES",    items: [`Entrega material: ${presupuesto.plazo_entrega||"5-10 días hábiles"}`, "Validez: 30 días", "Precios sin IVA"], accent: C.textoSec },
                ].map(({ titulo, items, accent }) => (
                  <div key={titulo} style={{ background:C.blanco, border:`1px solid ${C.borde}`, borderTop:`3px solid ${accent}`, borderRadius:"0 0 8px 8px", padding:"16px" }}>
                    <div style={{ fontSize:"10px", fontWeight:"600", letterSpacing:"0.8px", color:accent, marginBottom:"10px" }}>{titulo}</div>
                    {(items||[]).map((item, i) => (
                      <div key={i} style={{ display:"flex", gap:"6px", marginBottom:"6px" }}>
                        <span style={{ color:accent, fontSize:"10px", marginTop:"3px", flexShrink:0 }}>▸</span>
                        <span style={{ fontSize:"12px", color:C.textoSec, lineHeight:"1.5" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Alternativa económica */}
              {presupuesto.alternativa_eco && (
                <div style={{ background:C.amarilloS, border:`1px solid #F5D58B`, borderRadius:"8px", padding:"14px 18px", marginBottom:"16px" }}>
                  <button onClick={() => setMostrarAlternativa(!mostrarAlternativa)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", color:C.amarillo, fontSize:"12px", fontWeight:"600", fontFamily:"system-ui,Segoe UI,sans-serif" }}>
                    {mostrarAlternativa ? "▼" : "▶"} Alternativa de menor coste
                  </button>
                  {mostrarAlternativa && (
                    <div style={{ marginTop:"8px", fontSize:"13px", color:C.textoSec, lineHeight:"1.6" }}>{presupuesto.alternativa_eco}</div>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:"8px", padding:"12px 18px", marginBottom:"20px", fontSize:"11px", color:C.textoTer, fontStyle:"italic" }}>
                ⚠ Presupuesto orientativo generado con IA. Precios y disponibilidad sujetos a confirmación. Verificar con Sonepar antes de formalizar pedido.
              </div>

              {/* Botones de acción */}
              <div className="no-print" style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
                <button onClick={() => window.print()} style={btnP()}>Exportar PDF →</button>
                <button onClick={copiarResumen} style={btnS}>Copiar resumen</button>
                <button onClick={() => setPaso(2)} style={{ ...btnS, color:C.textoSec, borderColor:C.borde }}>‹ Modificar</button>
                <button onClick={reiniciar}       style={{ ...btnS, color:C.textoSec, borderColor:C.borde }}>+ Nuevo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
