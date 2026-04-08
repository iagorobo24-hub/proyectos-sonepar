import { useState, useEffect, useRef } from "react";
import { Warehouse } from 'lucide-react';
import Button from '../components/ui/Button'
import { Label, TipCard, Breadcrumb, ViewToggle } from '../components/ui/CircleLayout'
import styles from './SimuladorAlmacen.module.css'

// ── Paleta corporativa Sonepar ───────────────────────────────────────────────
const C = {
  azulOscuro: "#003087", azulMedio: "#1A4A8A", azulClaro: "#4A90D9",
  azulSuave:  "#EBF1FA", blanco: "#FFFFFF",    fondo: "#F5F6F8",
  texto:      "#1A1A2E", textoSec: "#4A5568",  textoTer: "#8A94A6",
  borde:      "#D1D9E6", verde: "#1B6B3A",     verdeSuave: "#EDF7F2",
  amarillo:   "#C07010", amarilloS: "#FFF8EE", rojo: "#C62828",
  rojoSuave:  "#FDECEA",
};

// ── Datos del simulador ──────────────────────────────────────────────────────
const ETAPAS = [
  { id: 0, nombre: "Recepción",    icono: "📥", desc: "Verificación de albarán y conteo de bultos",        estandar: 60  },
  { id: 1, nombre: "Ubicación",    icono: "📦", desc: "Transporte e introducción en ubicación WMS",        estandar: 90  },
  { id: 2, nombre: "Picking",      icono: "🔍", desc: "Extracción del producto de su ubicación",           estandar: null },
  { id: 3, nombre: "Verificación", icono: "✅", desc: "Comprobación de referencia y cantidad",             estandar: 30  },
  { id: 4, nombre: "Expedición",   icono: "🚚", desc: "Etiquetado y preparación para envío",               estandar: 45  },
];

const ESTANDAR_PICKING = {
  "Variador": 180, "Contactor": 45, "Sensor": 60, "PLC": 120,
  "Relé": 40, "Cable": 90, "Interruptor": 50, "Otro": 75,
};

const PEDIDOS_DEMO = [
  { id: 1, producto: "Variador ATV320 2.2kW", referencia: "ATV320U22M2",   categoria: "Variador",     cantidad: 1, cliente: "Instalaciones García",   urgente: true,  dificultad: "Intermedio" },
  { id: 2, producto: "Contactor LC1D40 220V", referencia: "LC1D40M7",      categoria: "Contactor",    cantidad: 3, cliente: "Mantenimiento Repsol",    urgente: false, dificultad: "Básico"      },
  { id: 3, producto: "Sensor inductivo IF5932", referencia: "IF5932",       categoria: "Sensor",       cantidad: 2, cliente: "Planta Ford Almussafes",  urgente: false, dificultad: "Básico"      },
  { id: 4, producto: "PLC Modicon M241",       referencia: "TM241CE24R",    categoria: "PLC",          cantidad: 1, cliente: "Inyección Plásticos S.A.", urgente: true,  dificultad: "Avanzado"    },
  { id: 5, producto: "Cable RVK 3x2.5mm²",    referencia: "RVK-3X2.5-100", categoria: "Cable",        cantidad: 5, cliente: "Obra polígono Grela",     urgente: false, dificultad: "Básico"      },
];

// ── Banco de 15 incidencias ──────────────────────────────────────────────────
const INCIDENCIAS = [
  { id: "INC-01", etapa: 0, titulo: "Discrepancia en el albarán", descripcion: "El albarán indica 3 unidades pero en el pallet solo hay 2.", opciones: [
    { texto: "Registrar con 2 unidades y abrir incidencia al proveedor", correcto: true, feedback: "Correcto. Se registra lo recibido realmente y se notifica la discrepancia." },
    { texto: "Aceptar las 3 unidades en el sistema confiando en el albarán", correcto: false, feedback: "Incorrecto. Nunca se registra más stock del que existe físicamente." },
    { texto: "Devolver todo el pedido", correcto: false, feedback: "Incorrecto. Solo se devuelve si hay daño, no por discrepancia numérica." },
  ]},
  { id: "INC-02", etapa: 0, titulo: "Embalaje dañado", descripcion: "Una caja presenta golpes visibles.", opciones: [
    { texto: "Abrir la caja, verificar y fotografiar antes de firmar", correcto: true, feedback: "Correcto. Verificar y documentar antes de firmar conforme." },
    { texto: "Firmar conforme sin revisar", correcto: false, feedback: "Incorrecto. Firmar sin revisar implica aceptar posibles daños." },
  ]},
  { id: "INC-03", etapa: 1, titulo: "Ubicación WMS ocupada", descripcion: "La ubicación asignada ya tiene otro artículo.", opciones: [
    { texto: "Notificar al responsable y esperar reasignación", correcto: true, feedback: "Correcto. El responsable debe resolver el error de inventario." },
    { texto: "Colocar encima del existente", correcto: false, feedback: "Incorrecto. Mezclar productos genera errores de stock." },
  ]},
  { id: "INC-04", etapa: 2, titulo: "Referencia no encontrada", descripcion: "El WMS indica ubicación C-07-2 pero está vacía.", opciones: [
    { texto: "Reportar hueco y buscar en ubicaciones adyacentes", correcto: true, feedback: "Correcto. Registrar el hueco y buscar antes de declarar rotura." },
    { texto: "Marcar el pedido como no servible", correcto: false, feedback: "Incorrecto. Primero hay que buscar en otras ubicaciones." },
  ]},
  { id: "INC-05", etapa: 3, titulo: "Cantidad verificada mayor", descripcion: "El escáner confirma 4 unidades pero el pedido pide 3.", opciones: [
    { texto: "Devolver 1 unidad y verificar con las 3 correctas", correcto: true, feedback: "Correcto. Nunca se envía más de lo pedido." },
    { texto: "Incluir las 4 unidades como cortesía", correcto: false, feedback: "Incorrecto. Genera descuadres de stock e ingresos no registrados." },
  ]},
  { id: "INC-06", etapa: 4, titulo: "Dirección incompleta", descripcion: "Falta el número de nave en la etiqueta.", opciones: [
    { texto: "Contactar con el cliente para completar antes de etiquetar", correcto: true, feedback: "Correcto. Una etiqueta incompleta genera retrasos en la entrega." },
    { texto: "Etiquetar y enviar igualmente", correcto: false, feedback: "Incorrecto. El transportista no puede entregar con dirección incompleta." },
  ]},
  { id: "INC-07", etapa: 2, titulo: "Cantidad insuficiente", descripcion: "El pedido es de 3 contactores pero solo hay 1.", opciones: [
    { texto: "Coger 1, reportar diferencia y consultar stock alternativo", correcto: true, feedback: "Correcto. Servir lo disponible y gestionar el faltante." },
    { texto: "Esperar a que llegue más stock", correcto: false, feedback: "Incorrecto. El pedido queda bloqueado. Hay que gestionar el faltante." },
  ]},
  { id: "INC-08", etapa: 3, titulo: "Código de barras no escanea", descripcion: "El lector no lee el código del PLC.", opciones: [
    { texto: "Limpiar y reintentar; si falla, verificar manualmente", correcto: true, feedback: "Correcto. Solucionar el problema técnico o verificar manualmente." },
    { texto: "Dar por válida sin confirmar", correcto: false, feedback: "Incorrecto. Saltar la verificación es el origen de la mayoría de errores." },
  ]},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtT = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
const getEstandar = (etapaId, categoria) => etapaId === 2 ? (ESTANDAR_PICKING[categoria] || 75) : ETAPAS[etapaId].estandar;
const getSemaforo = (t, est) => {
  if (!est) return null;
  const pct = (t / est) * 100;
  if (pct <= 100) return { label: "OK", color: C.azul, bg: C.azulSuave };
  if (pct <= 150) return { label: "Lento", color: C.amarillo, bg: C.amarilloS };
  return { label: "Muy lento", color: C.rojo, bg: C.rojoSuave };
};
const calcPuntuacion = (tiempos, categoria, incResueltas) => {
  let pts = 100;
  tiempos.forEach((t, i) => { const sem = getSemaforo(t, getEstandar(i, categoria)); if (sem?.label === "Muy lento") pts -= 10; else if (sem?.label === "Lento") pts -= 5; });
  incResueltas.forEach(r => { if (!r.correcto) pts -= 5; });
  return Math.max(0, pts);
};
const PROMPT_ANALISIS = (pedido, tiempos, categoria, incResueltas, operario) => {
  const estandares = ETAPAS.map((_, i) => getEstandar(i, categoria) || 75);
  const desv = tiempos.map((t, i) => Math.round(((t - estandares[i]) / estandares[i]) * 100));
  const incFalladas = incResueltas.filter(r => !r.correcto);
  return `Eres el responsable de logística de Sonepar España. Analiza la sesión.\nOperario: ${operario || "Anónimo"}\nPedido: ${pedido.producto} (${pedido.referencia})\n\nTiempos:\n${ETAPAS.map((e, i) => `- ${e.nombre}: ${tiempos[i]}s (est: ${estandares[i]}s, ${desv[i] > 0 ? "+" : ""}${desv[i]}%)`).join("\n")}\nTotal: ${tiempos.reduce((a, b) => a + b, 0)}s\nIncidencias: ${incResueltas.length} presentadas${incFalladas.length > 0 ? `, ${incFalladas.length} falladas` : ", todas correctas"}.\n\n3 párrafos: (1) rendimiento por etapa con tiempos, (2) gestión de incidencias, (3) recomendación accionable. Tono constructivo.`;
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function SimuladorAlmacen() {
  const [pantalla, setPantalla] = useState("perfil");
  const [operario, setOperario] = useState({ nombre: "", turno: "Mañana", area: "Almacén" });
  const [modoSim, setModoSim] = useState("entrenamiento");
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [etapaActual, setEtapaActual] = useState(0);
  const [tiempos, setTiempos] = useState([]);
  const [tiempoEtapa, setTiempoEtapa] = useState(0);
  const [log, setLog] = useState([]);
  const [analisis, setAnalisis] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [formManual, setFormManual] = useState({ producto: "", referencia: "", categoria: "Contactor", cantidad: "1", cliente: "" });
  const [toast, setToast] = useState("");
  const [incActiva, setIncActiva] = useState(null);
  const [incResueltas, setIncResueltas] = useState([]);
  const [incPendientes, setIncPendientes] = useState([]);
  const [feedbackInc, setFeedbackInc] = useState(null);

  const intervalRef = useRef(null);
  const inicioEtapaRef = useRef(null);

  useEffect(() => {
    try { const p = localStorage.getItem("sonepar_sim_perfil"); if (p) setOperario(JSON.parse(p)); const h = localStorage.getItem("sonepar_simulaciones_v3"); if (h) setHistorial(JSON.parse(h)); } catch {}
  }, []);

  const guardarPerfil = () => { if (!operario.nombre.trim()) return; try { localStorage.setItem("sonepar_sim_perfil", JSON.stringify(operario)); } catch {}; setPantalla("onboarding"); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (pantalla === "simulacion" && !incActiva && !feedbackInc) {
      inicioEtapaRef.current = Date.now();
      setTiempoEtapa(0);
      intervalRef.current = setInterval(() => setTiempoEtapa(Math.floor((Date.now() - inicioEtapaRef.current) / 1000)), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pantalla, etapaActual, incActiva, feedbackInc]);

  const sortearIncidencias = () => {
    const pool = [...INCIDENCIAS]; const elegidas = [];
    [0, 1].forEach(etapa => { const c = pool.filter(i => i.etapa === etapa); if (c.length) elegidas.push(c[Math.floor(Math.random() * c.length)].id); });
    const c234 = pool.filter(i => [2, 3].includes(i.etapa)); if (c234.length) elegidas.push(c234[Math.floor(Math.random() * c234.length)].id);
    if (Math.random() > 0.5) { const c4 = pool.filter(i => i.etapa === 4); if (c4.length) elegidas.push(c4[Math.floor(Math.random() * c4.length)].id); }
    return elegidas;
  };

  const iniciarSimulacion = (pedido, modo) => {
    setPedidoActivo(pedido); setModoSim(modo); setEtapaActual(0); setTiempos([]); setLog([]); setAnalisis(""); setIncResueltas([]); setIncActiva(null); setFeedbackInc(null); setIncPendientes(sortearIncidencias());
    addLog(`▶ Pedido: ${pedido.producto} [${modo === "evaluacion" ? "EVALUACIÓN" : "ENTRENAMIENTO"}]`); setPantalla("simulacion");
  };

  const addLog = (msg) => { const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); setLog(prev => [`[${hora}] ${msg}`, ...prev].slice(0, 25)); };

  const comprobarIncidencia = (etapaId) => {
    const candidatas = incPendientes.filter(id => INCIDENCIAS.find(i => i.id === id)?.etapa === etapaId);
    if (candidatas.length) { const id = candidatas[0]; setIncPendientes(prev => prev.filter(i => i !== id)); setIncActiva(INCIDENCIAS.find(i => i.id === id)); if (intervalRef.current) clearInterval(intervalRef.current); }
  };

  const responderIncidencia = (opcion) => {
    const resultado = { titulo: incActiva.titulo, correcto: opcion.correcto, feedback: opcion.feedback };
    setIncResueltas(prev => [...prev, resultado]);
    setFeedbackInc(resultado);
    addLog(`⚡ INC: ${incActiva.titulo} → ${resultado.correcto ? "✅" : "❌"}`);
  };

  const continuarTrasFeedback = () => { setFeedbackInc(null); setIncActiva(null); intervalRef.current = setInterval(() => setTiempoEtapa(Math.floor((Date.now() - inicioEtapaRef.current) / 1000)), 1000); };

  const avanzarEtapa = () => {
    const tiempo = tiempoEtapa;
    setTiempos(prev => [...prev, tiempo]);
    addLog(`✓ ${ETAPAS[etapaActual].nombre}: ${fmtT(tiempo)}`);
    const siguiente = etapaActual + 1;
    if (siguiente < ETAPAS.length) {
      setEtapaActual(siguiente);
      if (intervalRef.current) clearInterval(intervalRef.current);
      comprobarIncidencia(siguiente);
    } else {
      finalizarSimulacion(tiempo);
    }
  };

  const finalizarSimulacion = (ultimoTiempo) => {
    const todosTiempos = [...tiempos, ultimoTiempo];
    const punt = calcPuntuacion(todosTiempos, pedidoActivo.categoria, incResueltas);
    const nuevaEntrada = { fecha: new Date().toISOString(), pedido: pedidoActivo, tiempos: todosTiempos, puntuacion: punt, incResueltas, operario: operario.nombre, modo: modoSim };
    const nuevoHistorial = [nuevaEntrada, ...historial].slice(0, 20);
    setHistorial(nuevoHistorial);
    try { localStorage.setItem("sonepar_simulaciones_v3", JSON.stringify(nuevoHistorial)); } catch {}
    setPantalla("resultado");
    if (cargando) return;
    setCargando(true);
    fetch("/api/anthropic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: PROMPT_ANALISIS(pedidoActivo, todosTiempos, pedidoActivo.categoria, incResueltas, operario.nombre) }] }) })
      .then(res => res.json()).then(data => { setAnalisis(data.content?.map(i => i.text || "").join("") || ""); setCargando(false); })
      .catch(() => { setAnalisis("Error al conectar con la IA."); setCargando(false); });
  };

  const resetear = () => { setPantalla("onboarding"); setPedidoActivo(null); setTiempos([]); setIncResueltas([]); setIncActiva(null); setFeedbackInc(null); setAnalisis(""); };
  const verHistorial = (entrada) => { setPedidoActivo(entrada.pedido); setTiempos(entrada.tiempos); setIncResueltas(entrada.incResueltas || []); setPantalla("resultado"); setMostrarHistorial(false); };

  const dificultadBadge = (d) => {
    const map = { "Básico": "badge--basico", "Intermedio": "badge--intermedio", "Avanzado": "badge--avanzado" };
    return <span className={`${styles.badge} ${styles[map[d]] || ''}`}>{d}</span>;
  };

  const estandarActual = getEstandar(etapaActual, pedidoActivo?.categoria);
  const semaforoActual = estandarActual ? getSemaforo(tiempoEtapa, estandarActual) : null;
  const puntuacionActual = calcPuntuacion(tiempos, pedidoActivo?.categoria, incResueltas);

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.main__content}>

          {/* Header */}
          <div className={styles.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>🏭</span>
              <h1 className={styles.pageTitle}>Simulador Almacén</h1>
            </div>
            <p className={styles.pageSubtitle}>Reproduce el ciclo completo de un pedido con incidencias reales</p>
          </div>

          {/* ── PERFIL ── */}
          {pantalla === "perfil" && (
            <div className={styles.circleLayout}>
              <div className={styles.formCard} style={{ maxWidth: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>👤</div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '4px' }}>Perfil del operario</h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>Introduce tus datos para comenzar la simulación</p>
                </div>
                <div className={styles.formCard__group}>
                  <label className={styles.formCard__label}>Nombre</label>
                  <input className={styles.formCard__input} value={operario.nombre} onChange={e => setOperario(p => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formCard__group}>
                    <label className={styles.formCard__label}>Turno</label>
                    <select className={styles.formCard__select} value={operario.turno} onChange={e => setOperario(p => ({ ...p, turno: e.target.value }))}>
                      <option>Mañana</option><option>Tarde</option><option>Noche</option>
                    </select>
                  </div>
                  <div className={styles.formCard__group}>
                    <label className={styles.formCard__label}>Área</label>
                    <select className={styles.formCard__select} value={operario.area} onChange={e => setOperario(p => ({ ...p, area: e.target.value }))}>
                      <option>Almacén</option><option>Expedición</option><option>Recepción</option>
                    </select>
                  </div>
                </div>
                <Button variant="primary" size="md" onClick={guardarPerfil} style={{ width: '100%', marginTop: '8px' }}>
                  Continuar →
                </Button>
              </div>
            </div>
          )}

          {/* ── ONBOARDING ── */}
          {pantalla === "onboarding" && (
            <div className={styles.circleLayout}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '2rem' }}>📋</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '4px' }}>Hola, {operario.nombre}</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>Elige un modo de simulación</p>
              </div>

              <div className={styles.etapasGrid} style={{ gap: '12px' }}>
                <button onClick={() => iniciarSimulacion(PEDIDOS_DEMO[0], "entrenamiento")} className={styles.etapaCard} style={{ minWidth: '240px' }}>
                  <span style={{ fontSize: '2rem' }}>🎓</span>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)' }}>Entrenamiento</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Con feedback inmediato</span>
                </button>
                <button onClick={() => iniciarSimulacion(PEDIDOS_DEMO[0], "evaluacion")} className={styles.etapaCard} style={{ minWidth: '240px' }}>
                  <span style={{ fontSize: '2rem' }}>📝</span>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)' }}>Evaluación</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Sin ayuda durante el proceso</span>
                </button>
              </div>

              {/* Historial */}
              {historial.length > 0 && (
                <div style={{ marginTop: '32px', width: '100%', maxWidth: '600px' }}>
                  <button onClick={() => setMostrarHistorial(!mostrarHistorial)} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                    {mostrarHistorial ? '▲' : '▼'} Últimas simulaciones ({historial.length})
                  </button>
                  {mostrarHistorial && (
                    <div className={styles.historialList} style={{ marginTop: '12px' }}>
                      {historial.slice(0, 5).map((h, i) => (
                        <button key={i} className={styles.historialItem} onClick={() => verHistorial(h)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{h.pedido.producto}</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--blue-800)' }}>{h.puntuacion}/100</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{new Date(h.fecha).toLocaleDateString('es-ES')} · {h.operario}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SIMULACIÓN ── */}
          {pantalla === "simulacion" && pedidoActivo && (
            <div className={styles.circleLayout}>
              {/* Timer + Etapa */}
              <div className={styles.timer}>{fmtT(tiempoEtapa)}</div>

              {semaforoActual && (
                <span className={`${styles.badge} ${semaforoActual.label === "OK" ? 'badge--basico' : semaforoActual.label === "Lento" ? 'badge--intermedio' : 'badge--avanzado'}`}
                  style={{ background: semaforoActual.bg, color: semaforoActual.color, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-full)' }}>
                  ● {semaforoActual.label}
                </span>
              )}

              {/* Etapa actual */}
              {!incActiva && !feedbackInc && (
                <div className={styles.fichaCard} style={{ maxWidth: 600, width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>ETAPA ACTIVA</div>
                      <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{ETAPAS[etapaActual].icono}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-800)' }}>{ETAPAS[etapaActual].nombre}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>{ETAPAS[etapaActual].desc}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: '4px' }}>ESTÁNDAR</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--gray-600)' }}>{estandarActual ? fmtT(estandarActual) : 'N/A'}</div>
                    </div>
                  </div>
                  <Button variant="primary" size="md" onClick={avanzarEtapa} style={{ width: '100%' }}>
                    {etapaActual < ETAPAS.length - 1 ? `Completar ${ETAPAS[etapaActual].nombre} →` : 'Completar ciclo ✓'}
                  </Button>
                </div>
              )}

              {/* Incidencia activa */}
              {incActiva && !feedbackInc && (
                <div className={styles.incidenciaCard}>
                  <div className={styles.incidenciaCard__title}>⚡ {incActiva.titulo}</div>
                  <div className={styles.incidenciaCard__desc}>{incActiva.descripcion}</div>
                  <div className={styles.incidenciaCard__opciones}>
                    {incActiva.opciones.map((op, i) => (
                      <button key={i} className={styles.incidenciaCard__opcion} onClick={() => responderIncidencia(op)}>{op.texto}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback incidencia */}
              {feedbackInc && (
                <div className={styles.incidenciaCard__feedback + (feedbackInc.correcto ? ' incidenciaCard__feedback--correcto' : ' incidenciaCard__feedback--incorrecto')}
                  style={{ padding: '20px', borderRadius: 'var(--radius-lg)', maxWidth: 600, width: '100%' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{feedbackInc.correcto ? '✅' : '⚠️'}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: feedbackInc.correcto ? 'var(--success)' : 'var(--warning)' }}>
                      {feedbackInc.correcto ? '¡Correcto!' : 'Respuesta incorrecta'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '16px' }}>{feedbackInc.feedback}</div>
                  <Button variant="primary" size="sm" onClick={continuarTrasFeedback}>Continuar →</Button>
                </div>
              )}

              {/* Log */}
              {log.length > 0 && (
                <div style={{ maxWidth: 600, width: '100%', marginTop: '24px' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.06em', marginBottom: '8px' }}>LOG DE EVENTOS</div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {log.map((entry, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: i === 0 ? 'var(--blue-800)' : 'var(--gray-400)', marginBottom: '4px', lineHeight: 1.4, paddingBottom: '6px', borderBottom: i < log.length - 1 ? '1px solid var(--gray-50)' : 'none' }}>
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESULTADO ── */}
          {pantalla === "resultado" && pedidoActivo && tiempos.length > 0 && (
            <div className={styles.circleLayout}>
              <div className={styles.resultsCard}>
                <div className={styles.resultsCard__title}>Simulación completada</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '24px' }}>{pedidoActivo.producto}</p>

                <div className={styles.resultsCard__stats}>
                  {[
                    { label: "Puntuación", valor: `${puntuacionActual}`, unidad: "/100" },
                    { label: "Tiempo", valor: fmtT(tiempos.reduce((a, b) => a + b, 0)) },
                    { label: "Incidencias", valor: `${incResueltas.filter(r => r.correcto).length}/${incResueltas.length}` },
                  ].map(({ label, valor, unidad }) => (
                    <div key={label} className={styles.resultsCard__stat}>
                      <div className={styles.resultsCard__statValue}>{valor}</div>
                      {unidad && <div className={styles.resultsCard__statLabel}>{unidad}</div>}
                      <div className={styles.resultsCard__statLabel}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Tabla de etapas */}
                <div className={styles.fichaCard} style={{ marginBottom: '16px', padding: '0', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 80px 80px 60px 1fr', padding: '10px 16px', background: 'var(--gray-50)', fontSize: '0.625rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {["Etapa", "Tiempo", "Estándar", "Desv.", "Resultado"].map(h => <div key={h}>{h}</div>)}
                  </div>
                  {ETAPAS.map((e, i) => {
                    const est = getEstandar(i, pedidoActivo.categoria) || 75;
                    const desv = Math.round(((tiempos[i] - est) / est) * 100);
                    const sem = getSemaforo(tiempos[i], est);
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 80px 80px 60px 1fr', padding: '11px 16px', borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'var(--white)' : 'var(--gray-50)' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span>{e.icono}</span><span>{e.nombre}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>{fmtT(tiempos[i])}</div>
                        <div style={{ color: 'var(--gray-400)', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>{fmtT(est)}</div>
                        <div style={{ fontWeight: 600, color: desv > 0 ? 'var(--error)' : 'var(--success)', fontSize: '0.8125rem' }}>
                          {desv > 0 ? "+" : ""}{desv}%
                        </div>
                        <div style={{ display: 'inline-block', padding: '2px 8px', background: sem?.bg, color: sem?.color, fontSize: '0.625rem', fontWeight: 600, borderRadius: 'var(--radius-full)' }}>
                          {sem?.label || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Análisis IA */}
                <div className={styles.tipCard} style={{ textAlign: 'left', marginBottom: '16px' }}>
                  <div className={styles.tipCard__label}>✦ Análisis IA</div>
                  {cargando ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.8125rem' }}>
                      <div className={styles.spinner} /> Analizando sesión…
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{analisis}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Button variant="primary" onClick={resetear}>Nueva simulación →</Button>
                  <Button variant="secondary" onClick={() => setPantalla("onboarding")}>Volver</Button>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '8px 20px', background: 'var(--gray-800)', color: 'var(--white)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 500, zIndex: 999 }}>
              {toast}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
