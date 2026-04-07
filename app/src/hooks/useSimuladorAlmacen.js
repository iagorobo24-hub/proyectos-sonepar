import { useState, useEffect, useRef } from 'react';
import { useFirestoreSync } from './useFirestoreSync';
import { useAuth } from '../contexts/AuthContext';

// ── Datos del simulador ──────────────────────────────────────────────────────
export const ETAPAS = [
  { id: 0, nombre: "Recepción",    icono: "📥", desc: "Verificación de albarán y conteo de bultos",        estandar: 60  },
  { id: 1, nombre: "Ubicación",    icono: "📦", desc: "Transporte e introducción en ubicación WMS",        estandar: 90  },
  { id: 2, nombre: "Picking",      icono: "🔍", desc: "Extracción del producto de su ubicación",           estandar: null },
  { id: 3, nombre: "Verificación", icono: "✅", desc: "Comprobación de referencia y cantidad",             estandar: 30  },
  { id: 4, nombre: "Expedición",   icono: "🚚", desc: "Etiquetado y preparación para envío",               estandar: 45  },
];

export const ESTANDAR_PICKING = {
  "Variador": 180, "Contactor": 45, "Sensor": 60, "PLC": 120,
  "Relé": 40, "Cable": 90, "Interruptor": 50, "Otro": 75,
};

export const PEDIDOS_DEMO = [
  { id: 1, producto: "Variador ATV320 2.2kW", referencia: "ATV320U22M2",   categoria: "Variador",     cantidad: 1, cliente: "Instalaciones García",   urgente: true,  dificultad: "Intermedio" },
  { id: 2, producto: "Contactor LC1D40 220V", referencia: "LC1D40M7",      categoria: "Contactor",    cantidad: 3, cliente: "Mantenimiento Repsol",    urgente: false, dificultad: "Básico"      },
  { id: 3, producto: "Sensor inductivo IF5932", referencia: "IF5932",       categoria: "Sensor",       cantidad: 2, cliente: "Planta Ford Almussafes",  urgente: false, dificultad: "Básico"      },
  { id: 4, producto: "PLC Modicon M241",       referencia: "TM241CE24R",    categoria: "PLC",          cantidad: 1, cliente: "Inyección Plásticos S.A.", urgente: true,  dificultad: "Avanzado"    },
  { id: 5, producto: "Cable RVK 3x2.5mm²",    referencia: "RVK-3X2.5-100", categoria: "Cable",        cantidad: 5, cliente: "Obra polígono Grela",     urgente: false, dificultad: "Básico"      },
];

/**
 * Hook personalizado para SimuladorAlmacen
 * Gestiona perfil, historial de simulaciones y estado de la simulación activa
 */
export function useSimuladorAlmacen() {
  const { user } = useAuth();
  
  // Sync para perfil de operario
  const { data: perfilData, saveData: savePerfil, syncStatus: perfilSync } = useFirestoreSync(
    'simulator',
    'profile',
    { nombre: "", turno: "Mañana", area: "Almacén" },
    'sonepar_sim_perfil'
  );

  // Sync para historial de simulaciones
  const { data: historialData, saveData: saveHistorial, syncStatus: historialSync } = useFirestoreSync(
    'simulator',
    'history',
    [],
    'sonepar_simulaciones_v3'
  );

  // Estados locales
  const [pantalla, setPantalla] = useState("perfil");
  const [operario, setOperario] = useState(perfilData || { nombre: "", turno: "Mañana", area: "Almacén" });
  const [historial, setHistorial] = useState(historialData || []);
  const [modoSim, setModoSim] = useState("entrenamiento");
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [etapaActual, setEtapaActual] = useState(0);
  const [tiempos, setTiempos] = useState([]);
  const [tiempoEtapa, setTiempoEtapa] = useState(0);
  const [log, setLog] = useState([]);
  const [analisis, setAnalisis] = useState("");
  const [cargando, setCargando] = useState(false);
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

  // Actualizar estados locales cuando cambian los datos sincronizados
  useEffect(() => {
    if (perfilData) setOperario(perfilData);
  }, [perfilData]);

  useEffect(() => {
    if (historialData) setHistorial(historialData);
  }, [historialData]);

  const guardarPerfil = () => {
    if (!operario.nombre.trim()) return;
    savePerfil(operario);
    setPantalla("onboarding");
  };

  const showToast = (msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(""), 2500); 
  };

  useEffect(() => {
    if (pantalla === "simulacion" && !incActiva && !feedbackInc) {
      inicioEtapaRef.current = Date.now();
      setTiempoEtapa(0);
      intervalRef.current = setInterval(() => {
        setTiempoEtapa(Math.floor((Date.now() - inicioEtapaRef.current) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pantalla, etapaActual, incActiva, feedbackInc]);

  const sortearIncidencias = () => {
    // Esta función depende de INCIDENCIAS que se importa en el componente
    // Se deja para que el componente la implemente con sus datos
    return [];
  };

  const iniciarSimulacion = (pedido, modo) => {
    setPedidoActivo(pedido);
    setModoSim(modo);
    setEtapaActual(0);
    setTiempos([]);
    setLog([]);
    setAnalisis("");
    setIncResueltas([]);
    setIncActiva(null);
    setFeedbackInc(null);
    addLog(`▶ Pedido iniciado: ${pedido.producto} [${modo === "evaluacion" ? "EVALUACIÓN" : "ENTRENAMIENTO"}]`);
    setPantalla("simulacion");
  };

  const addLog = (msg) => {
    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [`[${hora}] ${msg}`, ...prev].slice(0, 25));
  };

  const completarSimulacion = async (tiemposFinales, calcPuntuacion, getEstandar, incResueltas, pedidoActivo, operario, INCIDENCIAS_DATA) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPantalla("resultado");
    setCargando(true);

    const puntuacion = calcPuntuacion(tiemposFinales, pedidoActivo.categoria, incResueltas);

    const entrada = {
      fecha: Date.now(),
      operario: operario.nombre,
      producto: pedidoActivo.producto,
      referencia: pedidoActivo.referencia,
      modo: modoSim,
      tiempos: tiemposFinales,
      totalTiempo: tiemposFinales.reduce((a, b) => a + b, 0),
      incTotal: incResueltas.length,
      incCorrectas: incResueltas.filter(r => r.correcto).length,
      puntuacion,
      cuellos: tiemposFinales.map((t, i) => ({ etapa: i, pct: Math.round((t / (getEstandar(i, pedidoActivo.categoria) || 75)) * 100) })).filter(x => x.pct > 150).map(x => x.etapa),
    };
    
    const nuevoHistorial = [entrada, ...historial].slice(0, 50);
    setHistorial(nuevoHistorial);
    saveHistorial(nuevoHistorial);

    setAnalisis("Análisis generado...");
    setCargando(false);
    
    return entrada;
  };

  const resetear = () => {
    setPantalla("selector");
    setPedidoActivo(null); 
    setEtapaActual(0); 
    setTiempos([]);
    setLog([]); 
    setAnalisis(""); 
    setModoManual(false);
    setIncActiva(null); 
    setIncResueltas([]); 
    setFeedbackInc(null); 
    setIncPendientes([]);
  };

  const iniciarManual = (modo) => {
    if (!formManual.producto || !formManual.cliente) { 
      showToast("Rellena producto y cliente"); 
      return; 
    }
    iniciarSimulacion({ id: Date.now(), ...formManual, cantidad: parseInt(formManual.cantidad) || 1, urgente: false, dificultad: "Manual" }, modo);
  };

  const actualizarOperario = (nuevoOperario) => {
    setOperario(nuevoOperario);
    savePerfil(nuevoOperario);
  };

  return {
    // Estados
    pantalla, setPantalla,
    operario, actualizarOperario,
    historial, setHistorial,
    modoSim, setModoSim,
    pedidoActivo, setPedidoActivo,
    etapaActual, setEtapaActual,
    tiempos, setTiempos,
    tiempoEtapa, setTiempoEtapa,
    log, setLog,
    analisis, setAnalisis,
    cargando, setCargando,
    mostrarHistorial, setMostrarHistorial,
    modoManual, setModoManual,
    formManual, setFormManual,
    toast, showToast,
    incActiva, setIncActiva,
    incResueltas, setIncResueltas,
    incPendientes, setIncPendientes,
    feedbackInc, setFeedbackInc,
    
    // Acciones
    guardarPerfil,
    iniciarSimulacion,
    completarSimulacion,
    resetear,
    iniciarManual,
    addLog,
    
    // Sync status
    syncStatus: {
      perfil: perfilSync,
      historial: historialSync,
    },
    
    // Refs
    intervalRef,
    inicioEtapaRef,
  };
}
