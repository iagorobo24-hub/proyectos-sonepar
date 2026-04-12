import { useState, useEffect, useReducer } from "react";
import { useSearchParams } from 'react-router-dom'
import { Euro } from 'lucide-react'
import { FULL_CATEGORY_INFO } from '../data/categoryMapping'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './Presupuestos.module.css'

const CATEGORIAS = Object.keys(FULL_CATEGORY_INFO).map(key => ({
  id: key,
  label: key,
  icon: FULL_CATEGORY_INFO[key].icon
}));

const DEMOS = {
  automatizacion: { potencia: "22", num_motores: "3", plc: "PLC básico", zona_atex: "No" },
  iluminacion: { superficie: "800", tipo_espacio: "Almacén industrial", telegestion: "Sí", emergencias: "Sí" },
  vehiculo_electrico: { num_puntos: "6", potencia_punto: "22 kW", gestion: "Smart", instalacion: "Parking" },
  cuadro_electrico: { potencia_contratada: "63", num_circuitos: "18", protecciones: "Estándar", tension: "400V" },
  energia_solar: { potencia_pico: "30", tipo: "Autoconsumo con batería", fases: "Trifásico", monitorizacion: "Sí" },
  clima: { superficie: "300", tipo_sistema: "VRF/VRV", uso: "Comercial", aero: "No" },
};

const genNum = () => { const d = new Date(); return `SNP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100)}`; };

function partidasReducer(state, action) {
  switch (action.type) {
    case "SET": return action.payload.map((p, i) => ({ ...p, _id: i }));
    case "UPDATE": return state.map(p => p._id === action.id ? { ...p, [action.field]: action.value, precio_total: action.field === "precio_unitario" ? action.value * p.cantidad : action.field === "cantidad" ? p.precio_unitario * action.value : p.precio_total } : p);
    case "ADD": return [...state, { _id: state.length, ref: "", desc: "", cantidad: 1, precio_unitario: 0, precio_total: 0, descuento: 0 }];
    case "DELETE": return state.filter(p => p._id !== action.id);
    default: return state;
  }
}

export default function Presupuestos() {
  const [searchParams] = useSearchParams();
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
  const [numPresupuesto, setNumPresupuesto] = useState(genNum());

  useEffect(() => { try { const h = localStorage.getItem("sonepar_presupuestos_historial"); if (h) setHistorial(JSON.parse(h)); } catch {} }, []);
  useEffect(() => {
    const producto = searchParams.get('producto');
    const referencia = searchParams.get('referencia');
    if (producto && referencia) {
      dispatchPartidas({ type: "ADD" });
      const newId = partidas.length;
      dispatchPartidas({ type: "UPDATE", id: newId, field: "ref", value: referencia });
      dispatchPartidas({ type: "UPDATE", id: newId, field: "desc", value: producto });
      setVista("editor");
    }
  }, [searchParams]);

  const buscarRecomendaciones = async () => {
    if (!categoria) { toast.show("Selecciona una categoría"); return; }
    setGenerando(true);
    try {
      const { callAnthropicAI, parseAIJsonResponse } = await import('../services/anthropicService');
      const { text } = await callAnthropicAI({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: "Eres un comercial experto de Sonepar España.", messages: [{ role: "user", content: `Categoría: ${CATEGORIAS.find(c => c.id === categoria)?.label}\nRequisitos: ${Object.entries(respuestas).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\nJSON: {"productos": [{"ref":"ATV320U22M2B","desc":"Variador...","precio":310,"cantidad":2,"motivo":"Adecuado..."}]}` }] });
      const json = parseAIJsonResponse(text, p => p.productos && Array.isArray(p.productos));
      if (!json || json.error) { toast.show("La IA devolvió una respuesta inválida."); setGenerando(false); return; }
      setRecomendaciones(json.productos || []);
      dispatchPartidas({ type: "SET", payload: (json.productos || []).map(p => ({ ...p, cantidad: p.cantidad || 1, descuento: 0 })) });
      setVista("editor");
    } catch { toast.show("Error al generar recomendaciones"); }
    setGenerando(false);
  };

  const guardar = () => {
    setGuardando(true);
    const presupuesto = { numero: numPresupuesto, fecha: new Date().toISOString(), cliente: datosCliente, partidas, total: partidas.reduce((s, p) => s + p.precio_total, 0) };
    const nuevo = [presupuesto, ...historial].slice(0, 20);
    setHistorial(nuevo);
    try { localStorage.setItem("sonepar_presupuestos_historial", JSON.stringify(nuevo)); } catch {}
    setGuardando(false);
    toast.show("Presupuesto guardado", "success");
  };

  const totalBase = partidas.reduce((s, p) => s + p.precio_total, 0);
  const ivaAmount = totalBase * (datosCliente.iva / 100);
  const totalFinal = totalBase + ivaAmount;

  /* ── WIZARD: Selección de categoría ── */
  if (vista === "wizard") {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.main__content}>
            <div className={styles.pageHeader}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2rem' }}>💰</span>
                <h1 className={styles.pageTitle}>Presupuestos</h1>
              </div>
              <p className={styles.pageSubtitle}>Genera presupuestos técnicos con recomendaciones de IA</p>
            </div>

            <h3 style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '24px' }}>Selecciona la categoría de instalación</h3>
            <div className={styles.categoriasGrid}>
              {CATEGORIAS.map(c => (
                <button key={c.id} className={`${styles.catCard} ${categoria === c.id ? styles['catCard--active'] : ''}`} onClick={() => setCategoria(c.id)}>
                  <span className={styles.catCard__icon}>{c.icon}</span>
                  <span className={styles.catCard__name}>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Botón Continuar tras seleccionar categoría */}
            {categoria && vista === 'wizard' && recomendaciones.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button variant="primary" size="md" onClick={() => {
                  const catDemos = DEMOS[categoria] || {};
                  setRespuestas(Object.fromEntries(Object.entries(catDemos).map(([k, v]) => [k, v])));
                }}>
                  Continuar →
                </Button>
              </div>
            )}

            {/* Form de respuestas */}
            {categoria && Object.keys(respuestas).length > 0 && vista === 'wizard' && (
              <div className={styles.formCard} style={{ maxWidth: 500, margin: '24px auto 0' }}>
                {Object.entries(DEMOS[categoria] || {}).map(([key, val]) => (
                  <div key={key} className={styles.formCard__group}>
                    <label className={styles.formCard__label}>{key.replace(/_/g, ' ').toUpperCase()}</label>
                    <input className={styles.formCard__input} value={respuestas[key] || val} onChange={e => setRespuestas(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <Button variant="primary" size="md" onClick={buscarRecomendaciones} loading={generando} style={{ width: '100%', marginTop: '8px' }}>
                  Generar recomendaciones IA →
                </Button>
              </div>
            )}

            {/* Historial */}
            {historial.length > 0 && !categoria && (
              <div style={{ marginTop: '48px' }}>
                <h3 style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: '16px' }}>Últimos presupuestos</h3>
                <div className={styles.historialList}>
                  {historial.slice(0, 5).map((h, i) => (
                    <button key={i} className={styles.historialItem} onClick={() => { dispatchPartidas({ type: "SET", payload: h.partidas || [] }); setDatosCliente(h.cliente || datosCliente); setVista("editor"); }}>
                      <div className={styles.historialItem__header}>
                        <span className={styles.historialItem__delegacion}>{h.numero}</span>
                        <span className={styles.historialItem__fecha}>{new Date(h.fecha).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className={styles.historialItem__turno}>{h.cliente?.nombre || 'Sin cliente'} · {h.partidas?.length || 0} partidas</div>
                      <div className={styles.historialItem__total}>{h.total?.toFixed(2) || '0'}€</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ── EDITOR: Tabla de partidas ── */
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.main__content}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{numPresupuesto}</h1>
            <p className={styles.pageSubtitle}>{datosCliente.nombre || 'Presupuesto sin cliente'}</p>
          </div>

          {/* Datos cliente */}
          <div className={styles.formCard} style={{ maxWidth: 700, margin: '0 auto 24px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>Datos del cliente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {['nombre', 'cif', 'contacto', 'email', 'telefono', 'direccion', 'poblacion', 'cp'].map(key => (
                <div key={key} className={styles.formCard__group}>
                  <label className={styles.formCard__label}>{key.toUpperCase()}</label>
                  <input className={styles.formCard__input} value={datosCliente[key] || ''} onChange={e => setDatosCliente(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de partidas */}
          <div className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <div>Referencia</div><div>Descripción</div><div>Cant.</div><div>Precio €</div><div>Total €</div><div></div>
            </div>
            {partidas.map(p => (
              <div key={p._id} className={styles.editorRow}>
                <div className={styles.editorRow__producto}>
                  <input className={styles.editorRow__input} value={p.ref} onChange={e => dispatchPartidas({ type: "UPDATE", id: p._id, field: "ref", value: e.target.value })} style={{ textAlign: 'left' }} />
                </div>
                <div className={styles.editorRow__ref}>
                  <input className={styles.editorRow__input} value={p.desc} onChange={e => dispatchPartidas({ type: "UPDATE", id: p._id, field: "desc", value: e.target.value })} style={{ textAlign: 'left' }} />
                </div>
                <input className={styles.editorRow__input} type="number" value={p.cantidad} onChange={e => dispatchPartidas({ type: "UPDATE", id: p._id, field: "cantidad", value: parseFloat(e.target.value) || 0 })} />
                <input className={styles.editorRow__input} type="number" step="0.01" value={p.precio_unitario} onChange={e => dispatchPartidas({ type: "UPDATE", id: p._id, field: "precio_unitario", value: parseFloat(e.target.value) || 0 })} />
                <div className={styles.editorRow__total}>{p.precio_total.toFixed(2)}</div>
                <button className={styles.editorRow__delete} onClick={() => dispatchPartidas({ type: "DELETE", id: p._id })}>✕</button>
              </div>
            ))}
            <div style={{ padding: '12px 20px' }}>
              <Button variant="ghost" size="sm" onClick={() => dispatchPartidas({ type: "ADD" })}>+ Añadir partida</Button>
            </div>
          </div>

          {/* Totales */}
          <div className={styles.editorFooter}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Base imponible: {totalBase.toFixed(2)}€</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>IVA ({datosCliente.iva}%): {ivaAmount.toFixed(2)}€</div>
            </div>
            <div className={styles.editorFooter__total}>{totalFinal.toFixed(2)}€</div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <Button variant="primary" size="md" onClick={guardar} loading={guardando}>Guardar presupuesto</Button>
            <Button variant="secondary" size="md" onClick={() => { setVista("wizard"); setNumPresupuesto(genNum()); }}>Nuevo presupuesto</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
