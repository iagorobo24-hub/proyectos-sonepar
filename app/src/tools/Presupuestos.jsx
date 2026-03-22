import { useState, useEffect, useRef, useReducer } from "react";
import { useSearchParams } from 'react-router-dom'
import { Euro } from 'lucide-react'
import { CATALOGO_POR_CATEGORIA as CATALOGO_REF_IMPORTADO } from '../data/catalogoSonepar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import WelcomeState from '../components/ui/WelcomeState'
import { useToast } from '../contexts/ToastContext'
import styles from './Presupuestos.module.css'

const CATALOGO_REF = CATALOGO_REF_IMPORTADO;

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
    case "ADD_ITEM":
      return [...state, { _id: state.length, ...action.payload }];
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
      /* Extraer precio numérico eliminando el símbolo € y espacios */
      const precioNum = parseFloat((precio || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
      /* Añadir directamente al presupuesto usando el reducer */
      dispatchPartidas({
        type: 'ADD_ITEM',
        payload: {
          ref: referencia,
          desc: producto,
          cantidad: 1,
          precio_unitario: precioNum,
          precio_total: precioNum,
          descuento: 0,
        }
      })
      /* Cambiar a la vista editor para que el usuario vea la partida */
      setVista('editor')
      toast.show(`${referencia} añadido al presupuesto`, 'success')
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
          <WelcomeState
            icon={Euro}
            title="Generador de Presupuestos"
            subtitle="Selecciona una categoría, responde las preguntas técnicas y la IA genera un presupuesto completo con referencias del catálogo Sonepar."
            chips={[
              'Automatización Industrial',
              'Cuadro Eléctrico',
              'Energía Solar / FV',
              'Vehículo Eléctrico',
              'Ver catálogo →'
            ]}
            onChipClick={(chip) => {
              const mapaCategoria = {
                'Automatización Industrial': 'automatizacion',
                'Cuadro Eléctrico': 'cuadro_electrico',
                'Energía Solar / FV': 'energia_solar',
                'Vehículo Eléctrico': 'vehiculo_electrico',
              }
              if (mapaCategoria[chip]) {
                setCategoria(mapaCategoria[chip])
              }
            }}
          />
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
