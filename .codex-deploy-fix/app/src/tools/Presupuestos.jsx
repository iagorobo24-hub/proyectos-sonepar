import { useState, useEffect, useReducer } from "react";
import React from "react";
import { useSearchParams } from 'react-router-dom'
import { FULL_CATEGORY_INFO } from '../data/categoryMapping'
import Button from '../components/ui/Button'
import { useToast } from '../contexts/ToastContext'
import styles from './Presupuestos.module.css'

const CATEGORIAS = Object.keys(FULL_CATEGORY_INFO).map(key => ({
  id: key,
  label: key,
  icon: FULL_CATEGORY_INFO[key].icon
}));

/* Catálogo de referencias por categoría — se reemplazará con datos scrapeados */
const CATALOGO = {
  "AUTOMATIZACION": [
    { ref: "ATV320U22M2B", desc: "Variador ATV320 2.2kW 200-240V monofásico", precio: 310, uso: "muy_alto" },
    { ref: "ATV320U40M2", desc: "Variador ATV320 4kW 200-240V monofásico", precio: 445, uso: "alto" },
    { ref: "ATV320U75N4", desc: "Variador ATV320 7.5kW 380-480V trifásico", precio: 590, uso: "medio" },
    { ref: "LC1D09M7", desc: "Contactor TeSys D 9A 220V AC-3 1NO+1NC", precio: 28, uso: "muy_alto" },
    { ref: "LC1D12M7", desc: "Contactor TeSys D 12A 220V AC-3 1NO+1NC", precio: 34, uso: "alto" },
    { ref: "LC1D25M7", desc: "Contactor TeSys D 25A 220V AC-3 1NO+1NC", precio: 52, uso: "medio" },
    { ref: "LRD08", desc: "Relé térmico TeSys 2.5-4A", precio: 22, uso: "alto" },
    { ref: "XPSAV3111", desc: "Relé de seguridad Preventa 24V AC/DC", precio: 145, uso: "medio" },
    { ref: "XB5RW84M5", desc: "Pulsador luminoso Harmony XB5 22mm", precio: 18, uso: "medio" },
    { ref: "ABL8REM24030", desc: "Fuente alimentación 24V 3A Phaseo", precio: 65, uso: "alto" },
    { ref: "TM221CE24R", desc: "PLC Modicon M221 24 E/S 16ent/8sal relé", precio: 185, uso: "medio" },
    { ref: "RSL1PVUL", desc: "Relé interfaz Zelio 24V AC 1C/O", precio: 12, uso: "alto" },
  ],
  "ILUMINACION": [
    { ref: "BN5021L", desc: "Regleta LED Philips 1200mm 4000K 4000lm", precio: 35, uso: "muy_alto" },
    { ref: "BN5031L", desc: "Regleta LED Philips 1500mm 4000K 5000lm", precio: 42, uso: "alto" },
    { ref: "RC120B LED40", desc: "Downlight LED CoreLine 4000K 4000lm", precio: 28, uso: "alto" },
    { ref: "RC140B LED26", desc: "Downlight empotrable LED 26W 4000K", precio: 32, uso: "medio" },
    { ref: "BVP162 LED70", desc: "Proyector LED BVP 70W 4000K IP65", precio: 85, uso: "medio" },
    { ref: "BVP162 LED130", desc: "Proyector LED BVP 130W 4000K IP65", precio: 145, uso: "medio" },
    { ref: "911401825991", desc: "Panel LED CoreLine 600x600 4000K 4000lm", precio: 55, uso: "alto" },
    { ref: "911401826001", desc: "Panel LED CoreLine 625x625 4000K 4400lm", precio: 58, uso: "alto" },
    { ref: "ST801M EM 4FT", desc: "Kit emergencia LED 4FT 3h", precio: 22, uso: "medio" },
    { ref: "CSG100-4K", desc: "Sensor crepuscular 1-10V IP65", precio: 45, uso: "medio" },
  ],
  "SEGURIDAD": [
    { ref: "A9C30216", desc: "Interruptor diferencial ID 40A 30mA A", precio: 68, uso: "muy_alto" },
    { ref: "A9F74163", desc: "Disyuntor iC60N 1P 6A curva C", precio: 14, uso: "muy_alto" },
    { ref: "A9F74110", desc: "Disyuntor iC60N 1P 10A curva C", precio: 14, uso: "muy_alto" },
    { ref: "A9F74116", desc: "Disyuntor iC60N 1P 16A curva C", precio: 14, uso: "alto" },
    { ref: "A9F74125", desc: "Disyuntor iC60N 1P 25A curva C", precio: 16, uso: "alto" },
    { ref: "A9N26920", desc: "Interruptor automático C120N 3P 40A", precio: 165, uso: "medio" },
    { ref: "A9C20842", desc: "Contactor modular iCT 40A 2NO 230V", precio: 42, uso: "alto" },
    { ref: "A9L16686", desc: "Protector sobretensiones iPRF1 1P+N 40kA", precio: 95, uso: "medio" },
    { ref: "A9MEM1520", desc: "Contador energía iEM3050 MID 3F 63A", precio: 280, uso: "bajo" },
    { ref: "A9C41116", desc: "Bornas de conexión Quick 4mm²", precio: 3, uso: "muy_alto" },
  ],
  "DISTRIBUCION": [
    { ref: "NSX100F", desc: "Interruptor caja moldeada NSX 100F 100A 3P", precio: 320, uso: "medio" },
    { ref: "NSX160F", desc: "Interruptor caja moldeada NSX 160F 160A 3P", precio: 445, uso: "medio" },
    { ref: "NSX250N", desc: "Interruptor caja moldeada NSX 250N 250A 3P", precio: 680, uso: "bajo" },
    { ref: "VW3A3614", desc: "Módulo comunicación Modbus NSX", precio: 125, uso: "bajo" },
    { ref: "GV2ME08", desc: "Interruptor motor GV2 2.5-4A", precio: 38, uso: "alto" },
    { ref: "GV2ME14", desc: "Interruptor motor GV2 6-10A", precio: 42, uso: "alto" },
    { ref: "GV2ME16", desc: "Interruptor motor GV2 9-14A", precio: 45, uso: "medio" },
    { ref: "VW3A1111", desc: "Tarjeta comunicación CANopen ATV320", precio: 75, uso: "bajo" },
    { ref: "XS618B1PAL10", desc: "Sensor inductivo M18 NPN NO 18mm", precio: 28, uso: "alto" },
    { ref: "XS7C1A1DAL10", desc: "Sensor inductivo M30 PNP NO 18mm", precio: 35, uso: "medio" },
  ],
  "ENERGIA SOLAR": [
    { ref: "ABL8BPS24200", desc: "Fuente Phaseo 24V 20A 480W", precio: 185, uso: "medio" },
    { ref: "A9MEM3255", desc: "Contador iEM3255 RS485 3F 55A", precio: 320, uso: "medio" },
    { ref: "A9MEM3265", desc: "Contador iEM3265 Ethernet 3F 65A", precio: 480, uso: "bajo" },
    { ref: "A9C22814", desc: "Contacto iCT 16A 1NO 230V", precio: 18, uso: "alto" },
    { ref: "A9F74120", desc: "Disyuntor iC60N 1P 20A curva C", precio: 14, uso: "alto" },
    { ref: "A9F74325", desc: "Disyuntor iC60N 3P 25A curva C", precio: 48, uso: "medio" },
    { ref: "A9L16694", desc: "Protector sobretensiones iPRF2 3P+N 40kA", precio: 165, uso: "medio" },
    { ref: "A9N26951", desc: "Interruptor C120N 3P 63A", precio: 195, uso: "bajo" },
  ],
  "CLIMA": [
    { ref: "A9C20842", desc: "Contactor modular 40A 2NO 230V", precio: 42, uso: "alto" },
    { ref: "A9C20734", desc: "Contactor modular 25A 2NC 230V", precio: 38, uso: "medio" },
    { ref: "A9MEM1520", desc: "Contador energía iEM3050 3F 63A", precio: 280, uso: "medio" },
    { ref: "A9C22816", desc: "Contacto iCT 25A 2NO 230V", precio: 24, uso: "alto" },
    { ref: "A9F74116", desc: "Disyuntor iC60N 1P 16A curva C", precio: 14, uso: "alto" },
    { ref: "A9F74125", desc: "Disyuntor iC60N 1P 25A curva C", precio: 16, uso: "alto" },
    { ref: "ABL8REM24030", desc: "Fuente alimentación 24V 3A", precio: 65, uso: "medio" },
    { ref: "CSG100-4K", desc: "Sensor crepuscular 1-10V", precio: 45, uso: "medio" },
  ],
  "VEHICULO ELECTRICO": [
    { ref: "EV22S22AC4", desc: "Wallbox EVlink Pro AC 22kW Tipo 2", precio: 890, uso: "alto" },
    { ref: "EV22S7AC22", desc: "Cable carga EV Tipo 2 7m 32A", precio: 185, uso: "alto" },
    { ref: "EV22S7AC22", desc: "Cable carga EV Tipo 2 4m 16A", precio: 125, uso: "medio" },
    { ref: "A9C20842", desc: "Contactor modular 40A 2NO 230V", precio: 42, uso: "alto" },
    { ref: "A9F74132", desc: "Disyuntor iC60N 1P 32A curva C", precio: 18, uso: "alto" },
    { ref: "A9F74140", desc: "Disyuntor iC60N 1P 40A curva C", precio: 22, uso: "medio" },
    { ref: "A9L16686", desc: "Protector sobretensiones 1P+N 40kA", precio: 95, uso: "medio" },
    { ref: "A9MEM1520", desc: "Contador energía iEM3050 3F 63A", precio: 280, uso: "medio" },
  ],
};

const genNum = () => { const d = new Date(); return `SNP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100)}`; };

function partidasReducer(state, action) {
  switch (action.type) {
    case "SET": return action.payload.map((p, i) => ({ ...p, _id: i }));
    case "UPDATE": return state.map(p => p._id === action.id ? { ...p, [action.field]: action.value, precio_total: action.field === "precio_unitario" ? action.value * p.cantidad : action.field === "cantidad" ? p.precio_unitario * action.value : p.precio_total } : p);
    case "ADD": return [...state, { _id: state.length, ref: "", desc: "", cantidad: 1, precio_unitario: 0, precio_total: 0 }];
    case "ADD_FROM_CATALOG": return [...state, { _id: state.length, ref: action.ref, desc: action.desc, cantidad: action.cantidad || 1, precio_unitario: action.precio || 0, precio_total: (action.precio || 0) * (action.cantidad || 1) }];
    case "DELETE": return state.filter(p => p._id !== action.id);
    default: return state;
  }
}

export default function Presupuestos() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [categoria, setCategoria] = useState("");
  const [partidas, dispatchPartidas] = useReducer(partidasReducer, []);
  const [datosCliente, setDatosCliente] = useState({ nombre: "", cif: "", contacto: "", email: "", telefono: "", direccion: "", poblacion: "", cp: "", provincia: "", pais: "España", iva: 21, forma_pago: "Transferencia", plazo_entrega: "15 días", validez: "30 días" });
  const [vista, setVista] = useState("wizard");
  const [guardando, setGuardando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [numPresupuesto, setNumPresupuesto] = useState(genNum());
  const [filtroCatalogo, setFiltroCatalogo] = useState("");
  const [añadidos, setAñadidos] = useState({});

  useEffect(() => { try { const h = localStorage.getItem("sonepar_presupuestos_historial"); if (h) setHistorial(JSON.parse(h)); } catch {} }, []);
  useEffect(() => {
    const producto = searchParams.get('producto');
    const referencia = searchParams.get('referencia');
    if (producto && referencia) {
      dispatchPartidas({ type: "ADD_FROM_CATALOG", ref: referencia, desc: producto, precio: 0 });
      setVista("editor");
    }
  }, [searchParams]);

  const continuarASleccion = () => {
    if (!categoria) { toast.show("Selecciona una categoría primero"); return; }
    setVista("seleccion");
    setAñadidos({});
  };

  const añadirProducto = (prod) => {
    const key = prod.ref;
    dispatchPartidas({ type: "ADD_FROM_CATALOG", ref: prod.ref, desc: prod.desc, precio: prod.precio });
    setAñadidos(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    toast.show(`${prod.ref} añadido al presupuesto`, "success");
  };

  const irAEditor = () => {
    if (partidas.length === 0) { toast.show("Añade al menos un producto al presupuesto"); return; }
    setVista("editor");
  };

  const guardar = () => {
    setGuardando(true);
    const presupuesto = { numero: numPresupuesto, fecha: new Date().toISOString(), cliente: datosCliente, partidas, categoria, total: partidas.reduce((s, p) => s + p.precio_total, 0) };
    const nuevo = [presupuesto, ...historial].slice(0, 20);
    setHistorial(nuevo);
    try { localStorage.setItem("sonepar_presupuestos_historial", JSON.stringify(nuevo)); } catch {}
    setGuardando(false);
    toast.show("Presupuesto guardado", "success");
  };

  const totalBase = partidas.reduce((s, p) => s + p.precio_total, 0);
  const ivaAmount = totalBase * (datosCliente.iva / 100);
  const totalFinal = totalBase + ivaAmount;

  /* Catálogo filtrado y ordenado por uso */
  const catalogoFiltrado = React.useMemo(() => {
    const items = CATALOGO[categoria] || [];
    const filtrado = filtroCatalogo
      ? items.filter(p => p.ref.toLowerCase().includes(filtroCatalogo.toLowerCase()) || p.desc.toLowerCase().includes(filtroCatalogo.toLowerCase()))
      : items;
    const ordenUso = { muy_alto: 0, alto: 1, medio: 2, bajo: 3 };
    return filtrado.sort((a, b) => (ordenUso[a.uso] || 2) - (ordenUso[b.uso] || 2));
  }, [categoria, filtroCatalogo]);

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
              <p className={styles.pageSubtitle}>Genera presupuestos técnicos seleccionando referencias del catálogo</p>
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

            {categoria && (
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Button variant="primary" size="lg" onClick={continuarASleccion}>
                  Ver catálogo de {CATEGORIAS.find(c => c.id === categoria)?.label} →
                </Button>
              </div>
            )}

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

  /* ── SELECCIÓN: Catálogo de productos ── */
  if (vista === "seleccion") {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.main__content}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                <span aria-hidden="true">{CATEGORIAS.find(c => c.id === categoria)?.icon}</span>
                {' '}{CATEGORIAS.find(c => c.id === categoria)?.label}
              </h1>
              <p className={styles.pageSubtitle}>Haz clic en un producto para añadirlo al presupuesto</p>
            </div>

            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <button className={styles.breadcrumb__link} onClick={() => setVista("wizard")}>Categorías</button>
              <span className={styles.breadcrumb__sep}>›</span>
              <span className={styles.breadcrumb__current}>{CATEGORIAS.find(c => c.id === categoria)?.label}</span>
            </div>

            {/* Buscador dentro del catálogo */}
            <div className={styles.catalogSearch}>
              <input
                className={styles.catalogSearch__input}
                placeholder="Filtrar por referencia o descripción..."
                value={filtroCatalogo}
                onChange={e => setFiltroCatalogo(e.target.value)}
              />
            </div>

            {/* Lista de productos */}
            <div className={styles.catalogGrid}>
              {catalogoFiltrado.map(prod => {
                const esPopular = prod.uso === 'muy_alto';
                const vecesAñadido = añadidos[prod.ref] || 0;
                return (
                  <button
                    key={prod.ref}
                    className={`${styles.productCard} ${esPopular ? styles['productCard--popular'] : ''}`}
                    onClick={() => añadirProducto(prod)}
                  >
                    {esPopular && <span className={styles.productCard__badge}>Popular</span>}
                    <div className={styles.productCard__ref}>{prod.ref}</div>
                    <div className={styles.productCard__desc}>{prod.desc}</div>
                    <div className={styles.productCard__price}>{prod.precio.toFixed(2)} €</div>
                    {vecesAñadido > 0 && (
                      <span className={styles.productCard__added}>✓ ×{vecesAñadido}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {catalogoFiltrado.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyState__icon}>🔍</div>
                <div className={styles.emptyState__title}>Sin resultados</div>
                <div className={styles.emptyState__text}>No se encontraron productos con ese filtro</div>
              </div>
            )}

            {/* Barra inferior con resumen y botón editor */}
            {partidas.length > 0 && (
              <div className={styles.catalogBar}>
                <div className={styles.catalogBar__info}>
                  <span>{partidas.length} producto{partidas.length > 1 ? 's' : ''} añadido{partidas.length > 1 ? 's' : ''}</span>
                  <span className={styles.catalogBar__total}>{totalBase.toFixed(2)} €</span>
                </div>
                <div className={styles.catalogBar__actions}>
                  <Button variant="secondary" size="md" onClick={() => setVista("wizard")}>Cambiar categoría</Button>
                  <Button variant="primary" size="md" onClick={irAEditor}>Ir al presupuesto →</Button>
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
            <p className={styles.pageSubtitle}>{datosCliente.nombre || 'Presupuesto sin cliente'} · {partidas.length} partidas</p>
          </div>

          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <button className={styles.breadcrumb__link} onClick={() => setVista("wizard")}>Categorías</button>
            <span className={styles.breadcrumb__sep}>›</span>
            <button className={styles.breadcrumb__link} onClick={() => setVista("seleccion")}>{CATEGORIAS.find(c => c.id === categoria)?.label || 'Catálogo'}</button>
            <span className={styles.breadcrumb__sep}>›</span>
            <span className={styles.breadcrumb__current}>Presupuesto</span>
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
              <Button variant="ghost" size="sm" onClick={() => dispatchPartidas({ type: "ADD" })}>+ Añadir partida manual</Button>
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
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="md" onClick={() => setVista("seleccion")}>← Volver al catálogo</Button>
            <Button variant="primary" size="md" onClick={guardar} loading={guardando}>Guardar presupuesto</Button>
            <Button variant="ghost" size="md" onClick={() => { setVista("wizard"); setNumPresupuesto(genNum()); }}>Nuevo presupuesto</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
