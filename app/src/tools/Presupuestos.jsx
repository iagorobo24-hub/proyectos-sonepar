import { useState, useEffect, useRef, useReducer } from "react";
import { useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './Presupuestos.module.css'

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

// ── Reducer para gestión del editor de partidas ───────────────────────────────
function partidasReducer(state, action) {
  switch (action.type) {
    case "SET":
      return action.payload.map((p, i) => ({ ...p, _id: i }));
    case "UPDATE":
      return state.map(p => p._id === action.id ? { ...p, [action.field]: action.value, precio_total: action.field === "precio_unitario" ? action.value * p.cantidad : action.field === "cantidad" ? p.precio_unitario * action.value : p.precio_total } : p);
    case "ADD":
      return [...state, { _id: state.length, ref: "", desc: "", cantidad: 1, precio_unitario: 0, precio_total: 0, descuento: 0 }];
    case "DELETE":
      return state.filter(p => p._id !== action.id);
    case "RECALC":
      return state.map(p => ({ ...p, precio_total: p.cantidad * p.precio_unitario * (1 - p.descuento/100) }));
    default:
      return state;
  }
}

export default function Presupuestos() {
  const [searchParams] = useSearchParams()
  const { toast } = useToast();
  const [categoria, setCategoria] = useState("");
  const [respuestas, setRespuestas] = useState({});
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [partidas, dispatchPartidas] = useReducer(partidasReducer, []);
  const [datosCliente, setDatosCliente] = useState({ nombre: "", cif: "", contacto: "", email: "", telefono: "", direccion: "", poblacion: "", cp: "", provincia: "", pais: "España", iva: 21, forma_pago: "Transferencia", plazo_entrega: "15 días", validez: "30 días" });
  const [vista, setVista] = useState("wizard");
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const h = localStorage.getItem("sonepar_presupuestos_historial");
    if (h) setHistorial(JSON.parse(h));
  }, []);

  /* Leer producto entrante desde SONEX o FichasTecnicas via URL params */
  useEffect(() => {
    const producto = searchParams.get('producto')
    const referencia = searchParams.get('referencia')
    const precio = searchParams.get('precio')
    if (producto && referencia) {
      /* Intenta añadir la línea al presupuesto actual */
      /* Si la herramienta tiene una función de añadir partida, llámala aquí */
      /* Por ahora guardamos en sessionStorage para que la herramienta lo lea */
      try {
        sessionStorage.setItem('sonepar_presupuesto_entrada', JSON.stringify({
          producto, referencia, precio, cantidad: 1, ts: Date.now()
        }))
      } catch {}
    }
  }, [])

  const guardarHistorial = (presup) => {
    const nuevo = [presup, ...historial].slice(0, 20);
    setHistorial(nuevo);
    try { localStorage.setItem("sonepar_presupuestos_historial", JSON.stringify(nuevo)); } catch {}
  };

  const buscarRecomendaciones = async () => {
    if (!categoria) {
      toast.show("Selecciona una categoría");
      return;
    }
    setGenerando(true);
    try {
      const prompt = `Eres un comercial experto de Sonepar España. Basado en estos requisitos, recomienda 5-7 productos específicos del catálogo con precios orientativos.\n\nCategoría: ${CATEGORIAS.find(c => c.id === categoria)?.label}\nRequisitos: ${Object.entries(respuestas).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\nResponde con JSON válido: {"productos": [{"ref": "ATV320U22M2", "desc": "Variador...", "precio": 310, "cantidad": 2, "motivo": "Adecuado para...""}]}`;
      const res = await fetch("/api/anthropic", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      const txt = data.content?.map(b => b.text || "").join("") || "";
      const json = JSON.parse(txt.replace(/```json|```/g, "").trim());
      setRecomendaciones(json.productos || []);
      dispatchPartidas({ type: "SET", payload: (json.productos || []).map(p => ({ ...p, cantidad: p.cantidad || 1, descuento: 0 })) });
      setVista("editor");
    } catch { toast.show("Error al generar recomendaciones"); }
    setGenerando(false);
  };

  const calcularTotales = () => {
    const base = partidas.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario * (1 - p.descuento/100)), 0);
    const iva = base * (datosCliente.iva / 100);
    const total = base + iva;
    return { base, iva, total };
  };

  const guardarPresupuesto = () => {
    if (!datosCliente.nombre || partidas.length === 0) { toast.show("Completa datos del cliente y añade partidas"); return; }
    setGuardando(true);
    const presupuesto = {
      id: genNum(),
      fecha: new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric" }),
      cliente: datosCliente.nombre,
      categoria: CATEGORIAS.find(c => c.id === categoria)?.label,
      partidas: partidas,
      totales: calcularTotales(),
      datos: datosCliente
    };
    guardarHistorial(presupuesto);
    toast.show(`Presupuesto ${presupuesto.id} guardado`);
    setGuardando(false);
  };

  const cargarDemo = () => {
    setCategoria("automatizacion");
    setRespuestas(DEMOS.automatizacion);
  };

  return (
    <div className={styles.layout}>
      {/* ── Panel izquierdo ── */}
      <div className={styles.panelBusqueda}>
        {/* Tabs WIZARD / EDITOR / HISTORIAL */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.tab} ${vista === 'wizard' ? styles.tabActivo : ''}`}
            onClick={() => setVista('wizard')}
          >
            Wizard
          </button>
          <button
            className={`${styles.tab} ${vista === 'editor' ? styles.tabActivo : ''}`}
            onClick={() => setVista('editor')}
          >
            Editor
          </button>
          <button
            className={`${styles.tab} ${vista === 'historial' ? styles.tabActivo : ''}`}
            onClick={() => setVista('historial')}
          >
            Histórico
          </button>
        </div>

        {/* Wizard */}
        {vista === 'wizard' && (
          <>
            <div className={styles.seccion}>
              <div className={styles.seccionLabel}>Categoría</div>
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.categoriaBtn} ${categoria === cat.id ? styles.categoriaBtnActivo : ''}`}
                  onClick={() => setCategoria(cat.id)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {categoria && (
              <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
                <div className={styles.seccionLabel}>Requisitos</div>
                <div style={{ marginBottom: 12 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={cargarDemo}
                    style={{ width: "100%" }}
                  >
                    Cargar ejemplo
                  </Button>
                </div>
                <Button
                  variant="primary"
                  onClick={buscarRecomendaciones}
                  loading={generando}
                  style={{ width: "100%" }}
                >
                  {generando ? "Generando..." : "Generar recomendaciones"}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Editor */}
        {vista === 'editor' && (
          <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
            <div className={styles.seccionLabel}>Partidas</div>
            {partidas.length === 0 ? (
              <div className={styles.vacio}>
                <div className={styles.vacioDiamond}>◈</div>
                <div className={styles.vacioTexto}>Sin partidas</div>
              </div>
            ) : (
              partidas.map(partida => (
                <div key={partida._id} className={styles.productoItem}>
                  <div className={styles.productoHeader}>
                    <div className={styles.productoNombre}>{partida.desc}</div>
                    <div className={styles.productoPrecio}>{partida.precio_total.toFixed(2)}€</div>
                  </div>
                  <div className={styles.productoMeta}>{partida.ref}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      type="number"
                      value={partida.cantidad}
                      onChange={e => dispatchPartidas({ type: "UPDATE", id: partida._id, field: "cantidad", value: parseFloat(e.target.value) || 1 })}
                      className={styles.input}
                      style={{ width: 60 }}
                    />
                    <input
                      type="number"
                      value={partida.precio_unitario}
                      onChange={e => dispatchPartidas({ type: "UPDATE", id: partida._id, field: "precio_unitario", value: parseFloat(e.target.value) || 0 })}
                      className={styles.input}
                      style={{ width: 80 }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => dispatchPartidas({ type: "DELETE", id: partida._id })}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button
              variant="secondary"
              onClick={() => dispatchPartidas({ type: "ADD" })}
              style={{ width: "100%", marginTop: 8 }}
            >
              + Añadir partida
            </Button>
          </div>
        )}

        {/* Historial */}
        {vista === 'historial' && (
          <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
            <div className={styles.seccionLabel}>Histórico ({historial.length})</div>
            {historial.length === 0 ? (
              <div className={styles.vacio}>
                <div className={styles.vacioDiamond}>◈</div>
                <div className={styles.vacioTexto}>Sin presupuestos guardados</div>
              </div>
            ) : (
              historial.map(presup => (
                <div key={presup.id} className={styles.historialItem}>
                  <div className={styles.historialHeader}>
                    <div className={styles.historialTitulo}>{presup.id}</div>
                    <div className={styles.historialMeta}>{presup.fecha}</div>
                  </div>
                  <div className={styles.cardMeta}>{presup.cliente}</div>
                  <div className={styles.cardMeta}>{presup.categoria}</div>
                  <div className={styles.cardMeta}>{presup.totales.total.toFixed(2)}€</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Panel derecho ── */}
      <div className={styles.panelResultado}>
        {vista === 'editor' && (
          <div>
            {/* Datos del cliente */}
            <div className={styles.presupuestoSection}>
              <div className={styles.presupuestoTitle}>Datos del Cliente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className={styles.seccionLabel} style={{ marginBottom: 4 }}>Nombre</div>
                  <input
                    value={datosCliente.nombre}
                    onChange={e => setDatosCliente(d => ({ ...d, nombre: e.target.value }))}
                    placeholder="Empresa S.L."
                    className={styles.input}
                  />
                </div>
                <div>
                  <div className={styles.seccionLabel} style={{ marginBottom: 4 }}>CIF</div>
                  <input
                    value={datosCliente.cif}
                    onChange={e => setDatosCliente(d => ({ ...d, cif: e.target.value }))}
                    placeholder="B12345678"
                    className={styles.input}
                  />
                </div>
                <div>
                  <div className={styles.seccionLabel} style={{ marginBottom: 4 }}>Contacto</div>
                  <input
                    value={datosCliente.contacto}
                    onChange={e => setDatosCliente(d => ({ ...d, contacto: e.target.value }))}
                    placeholder="Juan Pérez"
                    className={styles.input}
                  />
                </div>
                <div>
                  <div className={styles.seccionLabel} style={{ marginBottom: 4 }}>Email</div>
                  <input
                    value={datosCliente.email}
                    onChange={e => setDatosCliente(d => ({ ...d, email: e.target.value }))}
                    placeholder="juan@empresa.com"
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className={styles.totalesSection}>
              <div className={styles.presupuestoTitle}>Resumen Económico</div>
              {(() => {
                const tot = calcularTotales();
                return (
                  <>
                    <div className={styles.totalItem}>
                      <span className={styles.totalLabel}>Base imponible</span>
                      <span className={styles.totalValue}>{tot.base.toFixed(2)}€</span>
                    </div>
                    <div className={styles.totalItem}>
                      <span className={styles.totalLabel}>IVA ({datosCliente.iva}%)</span>
                      <span className={styles.totalValue}>{tot.iva.toFixed(2)}€</span>
                    </div>
                    <div className={styles.totalItem}>
                      <span className={styles.totalLabel}>TOTAL</span>
                      <span className={`${styles.totalValue} ${styles.grand}`}>{tot.total.toFixed(2)}€</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 12 }}>
              <Button
                variant="primary"
                onClick={guardarPresupuesto}
                loading={guardando}
              >
                {guardando ? "Guardando..." : "Guardar presupuesto"}
              </Button>
            </div>
          </div>
        )}

        {vista === 'wizard' && !categoria && (
          <div className={styles.vacio}>
            <div className={styles.vacioDiamond}>◈</div>
            <div className={styles.vacioTexto}>Selecciona una categoría para comenzar</div>
          </div>
        )}

        {vista === 'historial' && (
          <div className={styles.vacio}>
            <div className={styles.vacioDiamond}>◈</div>
            <div className={styles.vacioTexto}>Selecciona un presupuesto del historial</div>
          </div>
        )}
      </div>
    </div>
  );
}
