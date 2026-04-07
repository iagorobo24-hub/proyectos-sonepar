import { useState, useEffect, useRef } from "react";
import { WelcomeState } from '../components/ui/index.js';
import { Warehouse } from 'lucide-react';

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
  {
    id: "INC-01", etapa: 0,
    titulo: "Discrepancia en el albarán",
    descripcion: "El albarán indica 3 unidades pero en el pallet solo hay 2. El transportista ya se ha marchado.",
    opciones: [
      { texto: "Registrar la recepción con 2 unidades y abrir incidencia al proveedor", correcto: true,  feedback: "Correcto. Se registra lo recibido realmente y se notifica la discrepancia al proveedor para reclamar la unidad pendiente." },
      { texto: "Aceptar las 3 unidades en el sistema confiando en el albarán",          correcto: false, feedback: "Incorrecto. Nunca se registra más stock del que existe físicamente — genera descuadres en el WMS y problemas en expedición." },
      { texto: "Devolver el pedido completo y cancelar la recepción",                   correcto: false, feedback: "Incorrecto. Devolver un pedido parcialmente recibido bloquea la operativa sin resolver el problema." },
    ],
  },
  {
    id: "INC-02", etapa: 0,
    titulo: "Embalaje dañado exteriormente",
    descripcion: "Una caja del pedido presenta golpes visibles. El producto es un variador de frecuencia.",
    opciones: [
      { texto: "Abrir la caja, verificar el equipo y fotografiar los daños antes de firmar el albarán", correcto: true,  feedback: "Correcto. Es obligatorio verificar el estado real del equipo y dejar constancia fotográfica antes de firmar la recepción conforme." },
      { texto: "Firmar el albarán conforme y registrar la recepción sin revisión",                      correcto: false, feedback: "Incorrecto. Firmar conforme sin revisar implica aceptar los posibles daños — perderías el derecho de reclamación al transportista." },
      { texto: "Rechazar todo el pedido por el embalaje dañado",                                        correcto: false, feedback: "Incorrecto. Solo se rechaza si el producto está dañado. Si el equipo está bien, se acepta con reservas documentadas." },
    ],
  },
  {
    id: "INC-03", etapa: 1,
    titulo: "Ubicación WMS ya ocupada",
    descripcion: "El sistema WMS asigna la ubicación B-14-3 para el producto, pero al llegar hay otro artículo diferente en esa posición.",
    opciones: [
      { texto: "Notificar al responsable de almacén y esperar reasignación de ubicación",     correcto: true,  feedback: "Correcto. Una ubicación ocupada indebidamente es un error de inventario que debe resolver el responsable, no el operario." },
      { texto: "Colocar el producto encima del existente para ganar tiempo",                  correcto: false, feedback: "Incorrecto. Mezclar productos en una misma ubicación genera errores de picking y pérdidas de stock." },
      { texto: "Buscar una ubicación libre cercana y ubicar el producto sin actualizar el WMS", correcto: false, feedback: "Incorrecto. Ubicar sin registrar en el WMS hace el producto invisible para el sistema y para el picking." },
    ],
  },
  {
    id: "INC-04", etapa: 1,
    titulo: "Etiqueta de ubicación ilegible",
    descripcion: "La etiqueta de la estantería B-22 está deteriorada y no se puede leer el código QR ni el texto.",
    opciones: [
      { texto: "Reportar la etiqueta dañada y solicitar reposición antes de ubicar el producto",  correcto: true,  feedback: "Correcto. Ubicar con una etiqueta ilegible genera un punto ciego en el inventario. La etiqueta debe reponerse primero." },
      { texto: "Ubicar el producto igualmente usando la posición física aproximada",              correcto: false, feedback: "Incorrecto. Sin confirmación de la ubicación exacta, el WMS no puede registrar la posición y el producto queda 'perdido'." },
      { texto: "Devolver el producto a recepción hasta que la etiqueta sea reparada",             correcto: false, feedback: "Parcialmente válido pero ineficiente. Lo correcto es reportar y que otro operario reponga la etiqueta mientras se gestiona la ubicación." },
    ],
  },
  {
    id: "INC-05", etapa: 2,
    titulo: "Referencia no encontrada en ubicación",
    descripcion: "El WMS indica que el producto está en C-07-2 pero al llegar la ubicación está vacía.",
    opciones: [
      { texto: "Reportar hueco en el WMS e iniciar búsqueda en ubicaciones adyacentes",          correcto: true,  feedback: "Correcto. Primero se registra el hueco para corregir el inventario y luego se busca en ubicaciones próximas donde podría haberse colocado por error." },
      { texto: "Marcar el pedido como no servible sin buscar el producto",                        correcto: false, feedback: "Incorrecto. Antes de declarar una rotura de stock hay que verificar si el producto está en otra ubicación." },
      { texto: "Tomar producto de otro pedido que tenga la misma referencia",                    correcto: false, feedback: "Incorrecto. Tomar mercancía de otro pedido sin autorización genera faltantes en ese pedido y crea un problema mayor." },
    ],
  },
  {
    id: "INC-06", etapa: 2,
    titulo: "Cantidad insuficiente en ubicación",
    descripcion: "El pedido es de 3 contactores LC1D40 pero en la ubicación solo hay 1.",
    opciones: [
      { texto: "Coger el 1 disponible, reportar la diferencia y consultar si hay stock en otras ubicaciones", correcto: true,  feedback: "Correcto. Se sirve lo disponible, se registra la diferencia y se consulta si hay más en el almacén antes de generar un faltante." },
      { texto: "Esperar a que llegue más stock sin hacer nada",                                              correcto: false, feedback: "Incorrecto. El pedido queda bloqueado indefinidamente. Hay que gestionar el faltante con el responsable." },
      { texto: "Coger los 3 de distintas ubicaciones sin validar con el WMS",                               correcto: false, feedback: "Incorrecto. Tomar stock sin actualizar el WMS genera descuadres de inventario que se acumulan y son difíciles de rastrear." },
    ],
  },
  {
    id: "INC-07", etapa: 3,
    titulo: "Referencia del producto no coincide",
    descripcion: "El producto físico tiene el código ATV320U22M2C pero el pedido indica ATV320U22M2. Parecen iguales pero el sufijo 'C' indica versión compacta.",
    opciones: [
      { texto: "Detener la verificación y consultar con el técnico de mostrador si son equivalentes", correcto: true,  feedback: "Correcto. Las variantes de referencia pueden implicar diferencias técnicas relevantes para el cliente. Siempre hay que consultar antes de proceder." },
      { texto: "Validar el picking como correcto porque la diferencia es mínima",                    correcto: false, feedback: "Incorrecto. El sufijo 'C' (compact) implica diferentes dimensiones y posiblemente distinta forma de montaje. El cliente puede rechazar la entrega." },
      { texto: "Devolver el producto y marcar el pedido como no servible",                           correcto: false, feedback: "Incorrecto. Antes de declararlo no servible hay que verificar con el técnico si la versión compacta es aceptable para el cliente." },
    ],
  },
  {
    id: "INC-08", etapa: 3,
    titulo: "Cantidad verificada mayor al pedido",
    descripcion: "Al verificar, el escáner confirma 4 unidades pero el pedido solo pide 3 contactores.",
    opciones: [
      { texto: "Devolver 1 unidad a su ubicación y verificar el pedido con las 3 correctas",       correcto: true,  feedback: "Correcto. Nunca se envía más de lo pedido sin autorización del cliente. La unidad de más vuelve al stock." },
      { texto: "Incluir las 4 unidades en el envío como cortesía al cliente",                      correcto: false, feedback: "Incorrecto. Enviar unidades no facturadas genera descuadres de stock e ingresos no registrados." },
      { texto: "Repesar el conjunto para confirmar la cantidad antes de tomar ninguna decisión",   correcto: false, feedback: "Válido pero innecesario si el escáner ya ha confirmado la cantidad individualmente. Lo prioritario es devolver la unidad sobrante." },
    ],
  },
  {
    id: "INC-09", etapa: 4,
    titulo: "Dirección de entrega incompleta en la etiqueta",
    descripcion: "La etiqueta generada para el paquete no incluye el número de nave del polígono industrial del cliente.",
    opciones: [
      { texto: "Contactar con el cliente o consultar el pedido original para completar la dirección antes de etiquetar", correcto: true,  feedback: "Correcto. Un paquete con dirección incompleta llegará al transportista con la misma incompleta, generando retrasos y devoluciones." },
      { texto: "Etiquetar y enviar igualmente — el transportista conoce la zona",                                         correcto: false, feedback: "Incorrecto. El transportista no puede responsabilizarse de una dirección incompleta. La entrega fallará y el coste de la segunda intentona es de Sonepar." },
      { texto: "Imprimir la etiqueta sin la nave y escribir la nave a mano",                                              correcto: false, feedback: "No recomendable. Las etiquetas escritas a mano no se escanean correctamente en los sistemas del transportista y pueden causar problemas de trazabilidad." },
    ],
  },
  {
    id: "INC-10", etapa: 4,
    titulo: "El paquete no cabe en la caja asignada",
    descripcion: "El sistema indica caja tipo M pero el variador es voluminoso y no entra correctamente sin forzarlo.",
    opciones: [
      { texto: "Seleccionar una caja de mayor tamaño y actualizar el tipo de embalaje en el sistema", correcto: true,  feedback: "Correcto. El embalaje debe proteger el equipo. Usar una caja mayor y actualizarlo en el sistema garantiza trazabilidad y que el cálculo del porte sea correcto." },
      { texto: "Forzar el cierre de la caja M aunque el producto quede apretado",                     correcto: false, feedback: "Incorrecto. Un variador forzado en una caja pequeña puede dañarse en el transporte. La garantía del producto quedaría en entredicho." },
      { texto: "Entregar sin caja y solo con film retráctil para ganar tiempo",                       correcto: false, feedback: "Incorrecto. Un variador sin caja rígida no está protegido para el transporte. El equipo puede llegar dañado." },
    ],
  },
  {
    id: "INC-11", etapa: 0,
    titulo: "Producto recibido sin número de serie",
    descripcion: "El variador recibido no tiene etiqueta de número de serie. El proveedor normalmente la incluye.",
    opciones: [
      { texto: "No registrar el equipo y notificar al proveedor para que confirme el número de serie",  correcto: true,  feedback: "Correcto. Los equipos de alto valor deben tener número de serie registrado para garantías y trazabilidad. No se recibe sin él." },
      { texto: "Asignar un número de serie provisional interno y registrar el equipo",                  correcto: false, feedback: "Incorrecto. Un número de serie inventado no tiene validez para garantías del fabricante ni para trazabilidad real." },
      { texto: "Recibir el equipo igualmente — el número de serie no afecta al stock",                  correcto: false, feedback: "Incorrecto. Sin número de serie no se puede gestionar garantías ni devoluciones al fabricante. Para equipos como variadores es imprescindible." },
    ],
  },
  {
    id: "INC-12", etapa: 2,
    titulo: "Producto de picking es frágil y no hay material de protección",
    descripcion: "Debes hacer picking de 2 sensores inductivos pero en la zona no hay ni burbujas ni espuma de protección.",
    opciones: [
      { texto: "Ir a buscar material de protección antes de continuar con el picking",                  correcto: true,  feedback: "Correcto. Los sensores inductivos son equipos delicados. El tiempo invertido en buscar protección evita una devolución o una reclamación por daños." },
      { texto: "Hacer el picking sin protección y enviar — es distancia corta al área de embalaje",     correcto: false, feedback: "Incorrecto. Incluso en distancias cortas, un sensor sin protección puede golpearse con otros artículos en la caja de transporte interno." },
      { texto: "Sustituir los sensores por unidades de otro pedido que sí estén embaladas",             correcto: false, feedback: "Incorrecto. No se reasigna mercancía de otros pedidos. La solución es obtener material de protección." },
    ],
  },
  {
    id: "INC-13", etapa: 3,
    titulo: "El código de barras del producto no escanea",
    descripcion: "Intentas escanear el código de barras del PLC para verificar la referencia pero el lector no lo lee.",
    opciones: [
      { texto: "Limpiar el código de barras y volver a intentarlo; si falla, verificar la referencia manualmente contra el albarán", correcto: true,  feedback: "Correcto. Primero se intenta solucionar el problema técnico. Si no es posible, la verificación manual contra el documento es el procedimiento correcto." },
      { texto: "Dar la verificación por válida sin confirmar la referencia",                                                         correcto: false, feedback: "Incorrecto. Saltar la verificación es el origen de la mayoría de errores de expedición. Un PLC equivocado al cliente implica una devolución costosa." },
      { texto: "Reemplazar el producto por otro de la misma referencia que sí tenga código legible",                                 correcto: false, feedback: "Incorrecto. Cambiar un producto sin motivo real introduce movimientos de stock no justificados. Hay que verificar el que corresponde al pedido." },
    ],
  },
  {
    id: "INC-14", etapa: 1,
    titulo: "El transelevador del almacén alto está en mantenimiento",
    descripcion: "Debes ubicar cajas en el almacén alto pero el transelevador lleva 30 minutos parado por mantenimiento.",
    opciones: [
      { texto: "Comunicar la situación al responsable y preguntar si se puede usar la escalera manual o esperar",  correcto: true,  feedback: "Correcto. El operario no debe tomar decisiones sobre equipos de mantenimiento. El responsable debe autorizar el procedimiento alternativo." },
      { texto: "Esperar indefinidamente al transelevador sin avisar a nadie",                                       correcto: false, feedback: "Incorrecto. Sin comunicar la incidencia, el tiempo de espera no está justificado y el responsable no puede tomar medidas." },
      { texto: "Dejar las cajas en el suelo de la zona de ubicación y continuar con otras tareas",                 correcto: false, feedback: "Incorrecto. Dejar mercancía en el suelo de un almacén activo es un riesgo de seguridad y puede mezclarse con otros pedidos." },
    ],
  },
  {
    id: "INC-15", etapa: 4,
    titulo: "Cliente llama para cambiar la dirección de entrega",
    descripcion: "Mientras estás etiquetando el pedido, recibes una llamada de un cliente que quiere cambiar el punto de entrega.",
    opciones: [
      { texto: "Detener el etiquetado, no etiquetar con la dirección antigua y trasladar el cambio al responsable de pedidos", correcto: true,  feedback: "Correcto. Un cambio de dirección debe gestionarse en el sistema antes de etiquetar. Etiquetar con la dirección errónea y luego modificarla genera doble trabajo y posibles errores." },
      { texto: "Etiquetar con la dirección actual y trasladar el cambio después — el transportista puede rectificarlo",        correcto: false, feedback: "Incorrecto. Una vez etiquetado y recogido por el transportista, modificar la entrega es costoso y no siempre posible." },
      { texto: "Ignorar la llamada hasta terminar el turno y luego notificarlo",                                               correcto: false, feedback: "Incorrecto. Si el pedido se expide con la dirección incorrecta, la responsabilidad es de Sonepar." },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtT = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

const getEstandar = (etapaId, categoria) => {
  if (etapaId === 2) return ESTANDAR_PICKING[categoria] || 75;
  return ETAPAS[etapaId].estandar;
};

const getSemaforo = (t, est) => {
  if (!est) return null;
  const pct = (t / est) * 100;
  if (pct <= 100) return { label: "Dentro del estándar", color: C.azul,    bg: C.azulSuave };
  if (pct <= 150) return { label: "Lento",               color: C.amarillo, bg: C.amarilloS  };
  return              { label: "Muy lento",              color: C.rojo,     bg: C.rojoSuave  };
};

const calcPuntuacion = (tiempos, categoria, incResueltas) => {
  let pts = 100;
  tiempos.forEach((t, i) => {
    const est = getEstandar(i, categoria);
    const sem = getSemaforo(t, est);
    if (sem?.label === "Muy lento") pts -= 10;
    else if (sem?.label === "Lento") pts -= 5;
  });
  incResueltas.forEach(r => { if (!r.correcto) pts -= 5; });
  return Math.max(0, pts);
};

const PROMPT_ANALISIS = (pedido, tiempos, categoria, incResueltas, operario) => {
  const estandares = ETAPAS.map((_, i) => getEstandar(i, categoria) || 75);
  const desv = tiempos.map((t, i) => Math.round(((t - estandares[i]) / estandares[i]) * 100));
  const incFalladas = incResueltas.filter(r => !r.correcto);
  return `Eres el responsable de logística de un almacén de Sonepar España. Analiza la sesión de formación completada.

Operario: ${operario || "Anónimo"}
Pedido: ${pedido.producto} (${pedido.referencia}) — cantidad: ${pedido.cantidad}
Cliente: ${pedido.cliente}

Tiempos por etapa:
${ETAPAS.map((e, i) => `- ${e.nombre}: ${tiempos[i]}s (estándar: ${estandares[i]}s, desv: ${desv[i] > 0 ? "+" : ""}${desv[i]}%)`).join("\n")}
Tiempo total: ${tiempos.reduce((a, b) => a + b, 0)}s

Incidencias durante la sesión: ${incResueltas.length} presentadas${incFalladas.length > 0 ? `, ${incFalladas.length} respondidas incorrectamente` : ", todas resueltas correctamente"}.
${incFalladas.length > 0 ? `Incidencias falladas: ${incFalladas.map(r => r.titulo).join(", ")}` : ""}

Responde en 3 párrafos breves: (1) valoración del rendimiento por etapa con tiempos concretos, (2) evaluación de cómo se han gestionado las incidencias, (3) recomendación específica y accionable para mejorar. Tono directo y constructivo.`;
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function SimuladorAlmacen() {
  const [pantalla, setPantalla]         = useState("perfil");
  const [operario, setOperario]         = useState({ nombre: "", turno: "Mañana", area: "Almacén" });
  const [modoSim, setModoSim]           = useState("entrenamiento");
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [etapaActual, setEtapaActual]   = useState(0);
  const [tiempos, setTiempos]           = useState([]);
  const [tiempoEtapa, setTiempoEtapa]   = useState(0);
  const [log, setLog]                   = useState([]);
  const [analisis, setAnalisis]         = useState("");
  const [cargando, setCargando]         = useState(false);
  const [historial, setHistorial]       = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [modoManual, setModoManual]     = useState(false);
  const [formManual, setFormManual]     = useState({ producto: "", referencia: "", categoria: "Contactor", cantidad: "1", cliente: "" });
  const [toast, setToast]               = useState("");
  const [incActiva, setIncActiva]       = useState(null);
  const [incResueltas, setIncResueltas] = useState([]);
  const [incPendientes, setIncPendientes] = useState([]);
  const [feedbackInc, setFeedbackInc]   = useState(null);

  const intervalRef    = useRef(null);
  const inicioEtapaRef = useRef(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("sonepar_sim_perfil");
      if (p) setOperario(JSON.parse(p));
      const h = localStorage.getItem("sonepar_simulaciones_v3");
      if (h) setHistorial(JSON.parse(h));
    } catch {}
  }, []);

  const guardarPerfil = () => {
    if (!operario.nombre.trim()) return;
    try { localStorage.setItem("sonepar_sim_perfil", JSON.stringify(operario)); } catch {}
    setPantalla("onboarding");
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

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
    const pool = [...INCIDENCIAS];
    const elegidas = [];
    [0, 1].forEach(etapa => {
      const candidatas = pool.filter(i => i.etapa === etapa);
      if (candidatas.length) elegidas.push(candidatas[Math.floor(Math.random() * candidatas.length)].id);
    });
    const candidatas234 = pool.filter(i => [2, 3].includes(i.etapa));
    if (candidatas234.length) elegidas.push(candidatas234[Math.floor(Math.random() * candidatas234.length)].id);
    if (Math.random() > 0.5) {
      const candidatas4 = pool.filter(i => i.etapa === 4);
      if (candidatas4.length) elegidas.push(candidatas4[Math.floor(Math.random() * candidatas4.length)].id);
    }
    return elegidas;
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
    setIncPendientes(sortearIncidencias());
    addLog(`▶ Pedido iniciado: ${pedido.producto} [${modo === "evaluacion" ? "EVALUACIÓN" : "ENTRENAMIENTO"}]`);
    setPantalla("simulacion");
  };

  const addLog = (msg) => {
    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [`[${hora}] ${msg}`, ...prev].slice(0, 25));
  };

  const comprobarIncidencia = (etapaId) => {
    const candidatas = incPendientes.filter(id => {
      const inc = INCIDENCIAS.find(i => i.id === id);
      return inc && inc.etapa === etapaId;
    });
    if (candidatas.length) {
      const id = candidatas[0];
      setIncPendientes(prev => prev.filter(i => i !== id));
      setIncActiva(INCIDENCIAS.find(i => i.id === id));
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const responderIncidencia = (opcion) => {
    const resultado = { titulo: incActiva.titulo, correcto: opcion.correcto, feedback: opcion.feedback };
    setIncResueltas(prev => [...prev, resultado]);
    setFeedbackInc(resultado);
    addLog(`⚠ Incidencia: ${incActiva.titulo} — ${opcion.correcto ? "✓ CORRECTA" : "✗ INCORRECTA"}`);
    setIncActiva(null);
  };

  const continuarTrasFeedback = () => {
    setFeedbackInc(null);
    inicioEtapaRef.current = Date.now();
    setTiempoEtapa(0);
  };

  const avanzarEtapa = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const segundos = Math.floor((Date.now() - inicioEtapaRef.current) / 1000);
    const est = getEstandar(etapaActual, pedidoActivo.categoria);
    const sem = getSemaforo(segundos, est);
    const nuevos = [...tiempos, segundos];
    setTiempos(nuevos);
    addLog(`✓ ${ETAPAS[etapaActual].nombre}: ${fmtT(segundos)}${sem ? ` — ${sem.label}` : ""}`);

    if (etapaActual < ETAPAS.length - 1) {
      const siguienteEtapa = etapaActual + 1;
      setEtapaActual(siguienteEtapa);
      setTimeout(() => comprobarIncidencia(siguienteEtapa), 300);
    } else {
      completarSimulacion(nuevos);
    }
  };

  const completarSimulacion = async (tiemposFinales) => {
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
    try { localStorage.setItem("sonepar_simulaciones_v3", JSON.stringify(nuevoHistorial)); } catch {}

    try {
      const res = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_ANALISIS(pedidoActivo, tiemposFinales, pedidoActivo.categoria, incResueltas, operario.nombre) }],
        }),
      });
      const data = await res.json();
      setAnalisis(data.content?.map(i => i.text || "").join("") || "");
    } catch { setAnalisis("Error al generar el análisis. Inténtalo de nuevo."); }
    setCargando(false);
  };

  const resetear = () => {
    setPantalla("selector");
    setPedidoActivo(null); setEtapaActual(0); setTiempos([]);
    setLog([]); setAnalisis(""); setModoManual(false);
    setIncActiva(null); setIncResueltas([]); setFeedbackInc(null); setIncPendientes([]);
  };

  const iniciarManual = (modo) => {
    if (!formManual.producto || !formManual.cliente) { showToast("Rellena producto y cliente"); return; }
    iniciarSimulacion({ id: Date.now(), ...formManual, cantidad: parseInt(formManual.cantidad) || 1, urgente: false, dificultad: "Manual" }, modo);
  };

  const estandarActual   = pantalla === "simulacion" ? getEstandar(etapaActual, pedidoActivo?.categoria) : null;
  const semaforoActual   = estandarActual ? getSemaforo(tiempoEtapa, estandarActual) : null;
  const puntuacionActual = pantalla === "resultado" && pedidoActivo
    ? calcPuntuacion(tiempos, pedidoActivo.categoria, incResueltas) : 0;

  const dificultadColor = { "Básico": C.azul, "Intermedio": C.amarillo, "Avanzado": C.rojo, "Manual": C.textoTer };

  const inp  = { width: "100%", padding: "9px 12px", fontSize: "13px", fontFamily: "system-ui,Segoe UI,sans-serif", color: C.texto, border: `1.5px solid ${C.borde}`, borderRadius: "6px", background: C.blanco, outline: "none" };
  const lbl  = { fontSize: "10px", fontWeight: "600", letterSpacing: "0.8px", color: C.textoTer, marginBottom: "5px", display: "block", fontFamily: "system-ui,Segoe UI,sans-serif" };
  const btnP = { padding: "11px 26px", fontSize: "13px", fontWeight: "600", fontFamily: "system-ui,Segoe UI,sans-serif", background: C.azulOscuro, color: C.blanco, border: "none", borderRadius: "6px", cursor: "pointer" };
  const btnS = { padding: "9px 18px", fontSize: "12px", fontWeight: "500", fontFamily: "system-ui,Segoe UI,sans-serif", background: C.blanco, color: C.azulOscuro, border: `1.5px solid ${C.azulOscuro}`, borderRadius: "6px", cursor: "pointer" };

  return (
    <div style={{ minHeight: "100vh", background: C.fondo, fontFamily: "system-ui,Segoe UI,sans-serif", color: C.texto }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in  { animation: fadeIn 0.25s ease forwards; }
        .slide-down { animation: slideDown 0.2s ease forwards; }
        .pedido-card:hover { border-color: ${C.azulOscuro} !important; transform: translateY(-1px); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", background: C.azulOscuro, color: C.blanco, padding: "12px 20px", fontSize: "13px", fontFamily: "system-ui,Segoe UI,sans-serif", borderRadius: "8px", zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* ── Panel historial ──────────────────────────────────────────────── */}
      {mostrarHistorial && (
        <div className="slide-down" style={{ background: C.blanco, borderBottom: `1px solid ${C.borde}`, padding: "16px 32px" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: C.textoTer, marginBottom: "12px" }}>ÚLTIMAS SIMULACIONES</div>
          {historial.length === 0 && <div style={{ fontSize: "13px", color: C.textoTer }}>Aún no hay simulaciones completadas</div>}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {historial.slice(0, 8).map((h, i) => (
              <div key={i} style={{ background: C.fondo, border: `1px solid ${C.borde}`, borderRadius: "8px", padding: "10px 14px", minWidth: "200px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: C.texto }}>{h.operario || "—"}</span>
                  <span style={{ fontSize: "10px", color: C.textoTer }}>{new Date(h.fecha).toLocaleDateString("es-ES")}</span>
                </div>
                <div style={{ fontSize: "12px", color: C.textoSec, marginBottom: "4px" }}>{h.producto}</div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: C.azulOscuro }}>{fmtT(h.totalTiempo)}</span>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: h.puntuacion >= 80 ? C.azul : h.puntuacion >= 60 ? C.amarillo : C.rojo }}>{h.puntuacion}pts</span>
                  {h.cuellos?.length > 0 && <span style={{ fontSize: "10px", color: C.rojo }}>⚠ {h.cuellos.map(c => ETAPAS[c].nombre).join(", ")}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "32px", maxWidth: "1040px", margin: "0 auto" }}>

        {/* ── PERFIL ──────────────────────────────────────────────────────── */}
        {pantalla === "perfil" && (
          <div className="fade-in" style={{ maxWidth: "480px", margin: "60px auto 0" }}>
            {!operario.nombre && (
              <WelcomeState
                icon={Warehouse}
                title="Simulador de Almacén"
                subtitle="Reproduce el ciclo completo de un pedido con cronómetro real. Recepción, picking, verificación y expedición."
                chips={[
                  'Recepción — 60s',
                  'Picking — 45-180s',
                  'Expedición — 45s',
                  'Modo entrenamiento',
                  'Iniciar simulación →'
                ]}
                onChipClick={(chip) => {
                  if (chip === 'Iniciar simulación →') return
                }}
              />
            )}
            <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "12px", padding: "36px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "8px" }}>IDENTIFICACIÓN</div>
              <div style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>¿Quién eres?</div>
              <div style={{ fontSize: "13px", color: C.textoTer, marginBottom: "28px" }}>Tu progreso se guardará para futuras sesiones.</div>
              <div style={{ display: "grid", gap: "14px", marginBottom: "22px" }}>
                <div>
                  <label style={lbl}>NOMBRE</label>
                  <input value={operario.nombre} onChange={e => setOperario(p => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre" style={inp} onKeyDown={e => e.key === "Enter" && guardarPerfil()} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbl}>TURNO</label>
                    <select value={operario.turno} onChange={e => setOperario(p => ({ ...p, turno: e.target.value }))} style={inp}>
                      {["Mañana", "Tarde", "Noche"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>ÁREA</label>
                    <select value={operario.area} onChange={e => setOperario(p => ({ ...p, area: e.target.value }))} style={inp}>
                      {["Almacén", "Picking", "Expedición", "Recepción"].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={guardarPerfil} style={{ ...btnP, width: "100%", padding: "13px" }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── ONBOARDING ────────────────────────────────────────────────── */}
        {pantalla === "onboarding" && (
          <div className="fade-in" style={{ maxWidth: "680px", margin: "0 auto" }}>
            <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "12px", padding: "40px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "8px" }}>BIENVENIDO, {operario.nombre.toUpperCase()}</div>
              <div style={{ fontSize: "26px", fontWeight: "700", marginBottom: "16px" }}>Simulador de Flujo de Almacén</div>
              <div style={{ fontSize: "14px", color: C.textoSec, lineHeight: "1.7", marginBottom: "28px" }}>
                Reproduce el ciclo completo de un pedido desde recepción hasta expedición. Mide tus tiempos por etapa, responde incidencias reales del almacén y recibe un análisis IA personalizado al terminar.
              </div>
              <div style={{ background: C.fondo, borderRadius: "8px", padding: "18px", marginBottom: "24px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "14px" }}>LAS 5 ETAPAS</div>
                <div style={{ display: "flex", gap: "0" }}>
                  {ETAPAS.map((e, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRight: i < 4 ? `1px solid ${C.borde}` : "none" }}>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{e.icono}</div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: C.texto, marginBottom: "3px" }}>{e.nombre}</div>
                      <div style={{ fontSize: "10px", color: C.textoTer }}>{e.id === 2 ? "45–180s" : `${e.estandar}s`}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
                {[
                  { modo: "entrenamiento", icon: "🎓", titulo: "Entrenamiento", desc: "Se muestran pistas en las incidencias para aprender el procedimiento correcto." },
                  { modo: "evaluacion",    icon: "📋", titulo: "Evaluación",    desc: "Sin pistas. Se puntúa el rendimiento en tiempos e incidencias resueltas." },
                ].map(({ modo, icon, titulo, desc }) => (
                  <div key={modo} style={{ background: C.fondo, border: `1.5px solid ${C.borde}`, borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "20px", marginBottom: "8px" }}>{icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: C.texto, marginBottom: "4px" }}>{titulo}</div>
                    <div style={{ fontSize: "12px", color: C.textoTer, lineHeight: "1.5" }}>{desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setPantalla("selector")} style={{ ...btnP, padding: "13px 36px" }}>
                Elegir pedido →
              </button>
            </div>
          </div>
        )}

        {/* ── SELECTOR ─────────────────────────────────────────────────── */}
        {pantalla === "selector" && (
          <div className="fade-in" style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "8px" }}>PASO 1 — PEDIDO Y MODO</div>
            <div style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>¿Qué vas a simular?</div>
            <div style={{ fontSize: "13px", color: C.textoTer, marginBottom: "24px" }}>Elige un pedido y selecciona el modo.</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button onClick={() => setModoManual(false)} style={{ ...(!modoManual ? btnP : btnS), padding: "8px 18px", fontSize: "12px" }}>Pedidos demo</button>
              <button onClick={() => setModoManual(true)}  style={{ ...(modoManual  ? btnP : btnS), padding: "8px 18px", fontSize: "12px" }}>Pedido manual</button>
            </div>
            {!modoManual && (
              <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                {PEDIDOS_DEMO.map(p => (
                  <div key={p.id} className="pedido-card" style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "16px", cursor: "pointer", borderLeft: `4px solid ${p.urgente ? C.rojo : C.azulOscuro}`, transition: "all 0.12s" }}>
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700" }}>{p.producto}</span>
                        {p.urgente && <span style={{ fontSize: "10px", fontWeight: "700", background: C.rojo, color: C.blanco, padding: "2px 7px", borderRadius: "4px" }}>URGENTE</span>}
                        <span style={{ fontSize: "10px", fontWeight: "600", color: dificultadColor[p.dificultad]||C.textoTer, background: `${dificultadColor[p.dificultad]}18`, padding: "2px 7px", borderRadius: "4px" }}>{p.dificultad}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: C.textoTer }}>
                        Ref: {p.referencia} · Qty: {p.cantidad} · {p.cliente}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => iniciarSimulacion(p, "entrenamiento")} style={{ ...btnS, fontSize: "11px", padding: "7px 12px" }}>🎓 Entrenar</button>
                      <button onClick={() => iniciarSimulacion(p, "evaluacion")}    style={{ ...btnP, fontSize: "11px", padding: "7px 12px" }}>📋 Evaluar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {modoManual && (
              <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
                {[["producto","PRODUCTO / DESCRIPCIÓN","Ej: Relé de protección RW2"],["referencia","REFERENCIA","Ej: RW2-LD-2016-1"],["cliente","CLIENTE","Nombre del cliente o proyecto"]].map(([k,l,ph]) => (
                  <div key={k} style={{ marginBottom: "14px" }}>
                    <label style={lbl}>{l}</label>
                    <input value={formManual[k]} onChange={e => setFormManual(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                  <div>
                    <label style={lbl}>CATEGORÍA</label>
                    <select value={formManual.categoria} onChange={e => setFormManual(p => ({ ...p, categoria: e.target.value }))} style={inp}>
                      {Object.keys(ESTANDAR_PICKING).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>CANTIDAD</label>
                    <input value={formManual.cantidad} onChange={e => setFormManual(p => ({ ...p, cantidad: e.target.value }))} type="number" min="1" style={inp} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => iniciarManual("entrenamiento")} style={{ ...btnS, flex: 1 }}>🎓 Entrenar</button>
                  <button onClick={() => iniciarManual("evaluacion")}    style={{ ...btnP, flex: 1 }}>📋 Evaluar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SIMULACIÓN ────────────────────────────────────────────────── */}
        {pantalla === "simulacion" && pedidoActivo && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
            <div>
              <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "14px 18px", marginBottom: "18px", borderLeft: `4px solid ${C.azulOscuro}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "600", color: C.textoTer, marginBottom: "2px" }}>PEDIDO ACTIVO · {modoSim === "evaluacion" ? "📋 EVALUACIÓN" : "🎓 ENTRENAMIENTO"}</div>
                  <div style={{ fontSize: "15px", fontWeight: "700" }}>{pedidoActivo.producto}</div>
                  <div style={{ fontSize: "11px", color: C.textoTer }}>Ref: {pedidoActivo.referencia} · Qty: {pedidoActivo.cantidad} · {pedidoActivo.cliente}</div>
                </div>
                {incResueltas.length > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: C.textoTer, marginBottom: "2px" }}>INCIDENCIAS</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: incResueltas.filter(r => r.correcto).length === incResueltas.length ? C.azul : C.amarillo }}>
                      {incResueltas.filter(r => r.correcto).length}/{incResueltas.length} ✓
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", marginBottom: "20px", position: "relative" }}>
                {ETAPAS.map((e, i) => {
                  const completada = tiempos[i] !== undefined;
                  const activa     = i === etapaActual && !incActiva && !feedbackInc;
                  const est        = getEstandar(i, pedidoActivo.categoria);
                  const sem        = completada ? getSemaforo(tiempos[i], est) : null;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                      {i > 0 && <div style={{ position: "absolute", left: 0, top: "19px", width: "50%", height: "2px", background: completada || activa ? C.azulOscuro : C.borde }} />}
                      {i < 4 && <div style={{ position: "absolute", right: 0, top: "19px", width: "50%", height: "2px", background: completada ? C.azulOscuro : C.borde }} />}
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", background: completada ? (sem?.color || C.azul) : activa ? C.azulOscuro : C.fondo, color: completada || activa ? C.blanco : C.textoTer, fontWeight: "700", border: activa ? `3px solid ${C.azulClaro}` : `2px solid ${completada ? "transparent" : C.borde}`, transition: "all 0.2s" }}>
                          {completada ? "✓" : e.icono}
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: activa ? "700" : "500", color: activa ? C.texto : C.textoTer }}>{e.nombre}</div>
                        {completada && <div style={{ fontSize: "10px", color: sem?.color || C.azul, fontWeight: "600" }}>{fmtT(tiempos[i])}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {incActiva && (
                <div className="slide-down" style={{ background: C.rojoSuave, border: `2px solid ${C.rojo}`, borderRadius: "10px", padding: "22px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "20px" }}>⚠️</span>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: C.rojo, letterSpacing: "0.5px" }}>INCIDENCIA EN {ETAPAS[incActiva.etapa].nombre.toUpperCase()}</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: C.texto }}>{incActiva.titulo}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: C.textoSec, lineHeight: "1.6", marginBottom: "16px", background: C.blanco, borderRadius: "6px", padding: "12px 14px" }}>
                    {incActiva.descripcion}
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {incActiva.opciones.map((op, i) => (
                      <button key={i} onClick={() => responderIncidencia(op)} style={{ textAlign: "left", padding: "11px 14px", background: C.blanco, border: `1.5px solid ${C.borde}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: C.texto, fontFamily: "system-ui,Segoe UI,sans-serif", transition: "border-color 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.azulOscuro}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.borde}>
                        <span style={{ fontWeight: "600", color: C.azulOscuro, marginRight: "8px" }}>{String.fromCharCode(65 + i)}.</span>{op.texto}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {feedbackInc && (
                <div className="slide-down" style={{ background: feedbackInc.correcto ? C.azulSuave : C.amarilloS, border: `2px solid ${feedbackInc.correcto ? C.azul : C.amarillo}`, borderRadius: "10px", padding: "20px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "22px" }}>{feedbackInc.correcto ? "✅" : "⚠️"}</span>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: feedbackInc.correcto ? C.azul : C.amarillo }}>
                      {feedbackInc.correcto ? "¡Correcto!" : "Respuesta incorrecta"}
                    </div>
                  </div>
                  {(modoSim === "entrenamiento" || !feedbackInc.correcto) && (
                    <div style={{ fontSize: "13px", color: C.textoSec, lineHeight: "1.6", marginBottom: "14px" }}>{feedbackInc.feedback}</div>
                  )}
                  <button onClick={continuarTrasFeedback} style={{ ...btnP, fontSize: "12px", padding: "9px 20px" }}>Continuar →</button>
                </div>
              )}

              {!incActiva && !feedbackInc && (
                <div style={{ background: C.blanco, border: `2px solid ${C.azulOscuro}`, borderRadius: "10px", padding: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: C.textoTer, marginBottom: "4px" }}>ETAPA ACTIVA</div>
                      <div style={{ fontSize: "26px", marginBottom: "2px" }}>{ETAPAS[etapaActual].icono}</div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: C.azulOscuro }}>{ETAPAS[etapaActual].nombre}</div>
                      <div style={{ fontSize: "13px", color: C.textoSec, marginTop: "4px" }}>{ETAPAS[etapaActual].desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: C.textoTer, marginBottom: "4px" }}>TIEMPO</div>
                      <div style={{ fontSize: "40px", fontWeight: "700", color: semaforoActual?.color || C.texto, fontVariantNumeric: "tabular-nums", transition: "color 0.3s" }}>
                        {fmtT(tiempoEtapa)}
                      </div>
                      {estandarActual && (
                        <div style={{ fontSize: "11px", color: C.textoTer }}>Estándar: {fmtT(estandarActual)}</div>
                      )}
                    </div>
                  </div>
                  {semaforoActual && (
                    <div style={{ display: "inline-block", padding: "5px 12px", background: semaforoActual.bg, borderRadius: "20px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: semaforoActual.color }}>● {semaforoActual.label}</span>
                    </div>
                  )}
                  <button onClick={avanzarEtapa} style={{ ...btnP, width: "100%", padding: "14px", fontSize: "14px" }}>
                    {etapaActual < ETAPAS.length - 1 ? `Completar ${ETAPAS[etapaActual].nombre} → ` : "Completar ciclo ✓"}
                  </button>
                </div>
              )}
            </div>

            <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "16px", height: "fit-content", position: "sticky", top: "20px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "12px" }}>LOG DE EVENTOS</div>
              <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                {log.length === 0 && <div style={{ fontSize: "12px", color: C.textoTer }}>Sin eventos aún</div>}
                {log.map((entry, i) => (
                  <div key={i} style={{ fontSize: "11px", color: i === 0 ? C.azulOscuro : C.textoTer, marginBottom: "6px", lineHeight: "1.4", fontFamily: "monospace", paddingBottom: "6px", borderBottom: i < log.length - 1 ? `1px solid ${C.fondo}` : "none" }}>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTADO ────────────────────────────────────────────────── */}
        {pantalla === "resultado" && pedidoActivo && tiempos.length > 0 && (
          <div className="fade-in" style={{ maxWidth: "820px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "8px" }}>SIMULACIÓN COMPLETADA</div>
            <div style={{ fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>{pedidoActivo.producto}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "PUNTUACIÓN", valor: `${puntuacionActual}`, unidad: "/ 100", color: puntuacionActual >= 80 ? C.azul : puntuacionActual >= 60 ? C.amarillo : C.rojo },
                { label: "TIEMPO TOTAL", valor: fmtT(tiempos.reduce((a,b) => a+b,0)), unidad: "", color: C.azulOscuro },
                { label: "INCIDENCIAS", valor: `${incResueltas.filter(r => r.correcto).length}/${incResueltas.length}`, unidad: "correctas", color: incResueltas.every(r => r.correcto) ? C.azul : C.amarillo },
                { label: "ETAPA MÁS LENTA", valor: ETAPAS[tiempos.indexOf(Math.max(...tiempos))].nombre, unidad: "", color: C.rojo },
              ].map(({ label, valor, unidad, color }) => (
                <div key={label} style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "600", color: C.textoTer, marginBottom: "8px" }}>{label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color }}>{valor}</div>
                  {unidad && <div style={{ fontSize: "11px", color: C.textoTer }}>{unidad}</div>}
                </div>
              ))}
            </div>

            <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 90px 90px 80px 1fr", padding: "10px 16px", background: C.azulMedio, fontSize: "10px", fontWeight: "600", color: C.blanco, letterSpacing: "0.5px" }}>
                {["ETAPA", "TIEMPO", "ESTÁNDAR", "DESV.", "RESULTADO"].map(h => <div key={h}>{h}</div>)}
              </div>
              {ETAPAS.map((e, i) => {
                const est  = getEstandar(i, pedidoActivo.categoria) || 75;
                const desv = Math.round(((tiempos[i] - est) / est) * 100);
                const sem  = getSemaforo(tiempos[i], est);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 90px 90px 80px 1fr", padding: "11px 16px", borderBottom: i < 4 ? `1px solid ${C.fondo}` : "none", alignItems: "center", background: i % 2 === 0 ? C.blanco : C.fondo }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", gap: "6px", alignItems: "center" }}>
                      <span>{e.icono}</span><span>{e.nombre}</span>
                    </div>
                    <div style={{ fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>{fmtT(tiempos[i])}</div>
                    <div style={{ color: C.textoTer, fontVariantNumeric: "tabular-nums" }}>{fmtT(est)}</div>
                    <div style={{ fontWeight: "700", color: desv > 0 ? C.rojo : C.azul }}>
                      {desv > 0 ? "+" : ""}{desv}%
                    </div>
                    <div style={{ display: "inline-block", padding: "3px 10px", background: sem?.bg, color: sem?.color, fontSize: "10px", fontWeight: "700", borderRadius: "4px" }}>
                      {sem?.label || "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {incResueltas.length > 0 && (
              <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "18px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: C.textoTer, letterSpacing: "0.5px", marginBottom: "12px" }}>INCIDENCIAS RESPONDIDAS</div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {incResueltas.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", background: r.correcto ? C.azulSuave : C.rojoSuave, borderRadius: "8px" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{r.correcto ? "✅" : "❌"}</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: r.correcto ? C.azul : C.rojo, marginBottom: "2px" }}>{r.titulo}</div>
                        <div style={{ fontSize: "12px", color: C.textoSec, lineHeight: "1.5" }}>{r.feedback}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ width: "28px", height: "28px", background: C.azulSuave, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✦</div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: C.textoTer, letterSpacing: "0.5px" }}>ANÁLISIS IA — {operario.nombre.toUpperCase()}</span>
              </div>
              {cargando ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", color: C.textoTer, fontSize: "13px" }}>
                  <div style={{ width: "16px", height: "16px", border: `2px solid ${C.borde}`, borderTopColor: C.azulClaro, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Analizando sesión…
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: C.textoSec, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{analisis}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={resetear} style={btnP}>Nueva simulación →</button>
              <button onClick={() => setPantalla("onboarding")} style={btnS}>Cambiar modo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
