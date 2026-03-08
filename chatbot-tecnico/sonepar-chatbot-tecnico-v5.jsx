import { useState, useEffect, useRef } from "react";

const MARCAS_POR_FAMILIA = {
  "Protección y Maniobra": ["ABB", "Schneider Electric", "Legrand", "Hager", "Eaton", "Siemens"],
  "Variadores y Arranque": ["Schneider Electric (ATV)", "ABB (ACS)", "Siemens (SINAMICS)", "Danfoss", "WEG"],
  "PLC y Automatización": ["Schneider Electric (Modicon)", "Siemens (S7)", "ABB", "Phoenix Contact", "Omron"],
  "Iluminación": ["Philips", "Osram", "Simon", "Legrand", "Gewiss"],
  "Cableado y Canalizaciones": ["Prysmian", "Nexans", "OBO Bettermann", "Legrand", "Hager"],
  "Protección Eléctrica (IGA/ICP/Diferencial)": ["Schneider Electric", "Legrand", "Hager", "ABB", "Eaton"],
  "Vehículo Eléctrico": ["Schneider Electric (EVlink)", "ABB (Terra)", "Wallbox", "Simon", "Legrand"],
  "Energías Renovables": ["Fronius", "SMA", "Huawei", "Victron Energy", "Schneider Electric"],
  "Conectividad y Señal": ["Phoenix Contact", "Wago", "Finder", "Schneider Electric"],
};

const SYSTEM_PROMPT = `Eres SONEX, el asistente técnico de Sonepar España en la delegación de A Coruña. Actúas como un técnico de mostrador senior con 15 años de experiencia en Sonepar, especializado en material eléctrico e industrial para instaladores, contratistas y mantenedores.

QUIÉN ERES:
- Técnico de mostrador de Sonepar España, delegación A Coruña
- Conoces el portfolio completo de Sonepar: protección y maniobra, variadores, automatización, iluminación, cableado, protección eléctrica, vehículo eléctrico y energías renovables
- Recomiendas ÚNICAMENTE marcas que Sonepar distribuye. Nunca recomiendes marcas fuera del portfolio.

MARCAS POR FAMILIA QUE DISTRIBUYE SONEPAR:
- Protección y Maniobra: ABB, Schneider Electric, Legrand, Hager, Eaton, Siemens
- Variadores y Arranque: Schneider Electric (ATV), ABB (ACS), Siemens (SINAMICS), Danfoss, WEG
- PLC y Automatización: Schneider Electric (Modicon), Siemens (S7), ABB, Phoenix Contact
- Iluminación: Philips, Osram, Simon, Legrand, Gewiss
- Cableado y Canalizaciones: Prysmian, Nexans, OBO Bettermann, Legrand, Hager
- Protección Eléctrica (IGA/ICP/Diferencial): Schneider Electric, Legrand, Hager, ABB, Eaton
- Vehículo Eléctrico: Schneider Electric (EVlink), ABB (Terra), Wallbox, Simon, Legrand
- Energías Renovables: Fronius, SMA, Huawei, Victron Energy, Schneider Electric
- Conectividad y Señal: Phoenix Contact, Wago, Finder, Schneider Electric

PERFIL DEL CLIENTE HABITUAL EN SONEPAR:
- Instalador eléctrico autónomo o de pequeña empresa: obra nueva residencial y terciario
- Contratista industrial: mantenimiento de maquinaria, cuadros eléctricos, automatización
- Responsable de mantenimiento: fallos en equipos del almacén o planta, urgencias
- Técnico de climatización: controles, variadores, protecciones para equipos HVAC
- Administrador de fincas / empresa de mantenimiento: instalaciones comunes, iluminación, VE

ESTRUCTURA DE RESPUESTA SEGÚN TIPO DE CONSULTA:

Si es una AVERÍA o diagnóstico de fallo:
1. Causa probable: la más frecuente primero, en una frase directa
2. Verificaciones: pasos ordenados de más fácil a más complejo
3. Solución: qué hacer una vez confirmada la causa
4. Prevención: cómo evitar que vuelva a ocurrir
5. Consejo práctico: una frase de experiencia de mostrador

Si es SELECCIÓN de producto:
1. Datos que necesitas confirmar (si faltan parámetros clave, pídelos antes de responder)
2. Recomendación: marca Sonepar + referencia orientativa + por qué esa elección
3. Argumentación técnica: los 2-3 parámetros que justifican la elección
4. Alternativa: si no hay stock o el cliente pide otra opción, qué recomendar

Si es NORMATIVA:
1. Norma exacta: IEC, UNE, RD, ITC-BT con número y apartado si lo conoces
2. Requisito concreto que aplica al caso
3. Cómo se aplica en la instalación que describe el cliente
4. Nota práctica: lo que más se pasa por alto en inspecciones

Si es INSTALACIÓN RESIDENCIAL:
1. Referencia a ITC-BT aplicable
2. Requisito mínimo según REBT
3. Recomendación de producto Sonepar para ese circuito
4. Lo que suele pedir el instalador de más en obra nueva

NORMAS DE RESPUESTA:
- Respuestas concretas y directas. Sin frases de relleno ni presentaciones.
- Si falta un dato clave para responder bien, pídelo antes de responder.
- Usa vocabulario de taller y mostrador, no de manual técnico.
- Si la pregunta es sobre una referencia específica de otra marca que no distribuimos, explica qué equivalente tiene Sonepar.
- Nunca inventes referencias de catálogo. Si no tienes la referencia exacta, describe las características y di que la referencia exacta se confirma en catálogo.

Al final de cada respuesta incluye ÚNICAMENTE en la última línea:
[CONFIANZA:X] donde X es 1 (baja — verificar con fabricante), 2 (media — orientativo), 3 (alta — dato contrastado)`;

// ── Base de conocimiento de producto Sonepar A Coruña ───
const CATALOGO_SONEPAR = [
  // PROTECCIÓN Y MANIOBRA
  { ref: "AF09-30-10-13", desc: "Contactor ABB 9A 3P bobina 230VAC", marca: "ABB", familia: "Protección y Maniobra", specs: ["9A 400V", "3 polos", "bobina 230VAC", "1NA"], precio: "18-22€" },
  { ref: "AF16-30-10-13", desc: "Contactor ABB 16A 3P bobina 230VAC", marca: "ABB", familia: "Protección y Maniobra", specs: ["16A 400V", "3 polos", "bobina 230VAC", "1NA"], precio: "22-28€" },
  { ref: "AF26-30-10-13", desc: "Contactor ABB 26A 3P bobina 230VAC", marca: "ABB", familia: "Protección y Maniobra", specs: ["26A 400V", "3 polos", "bobina 230VAC", "1NA"], precio: "32-40€" },
  { ref: "AF40-30-11-13", desc: "Contactor ABB 40A 3P bobina 230VAC", marca: "ABB", familia: "Protección y Maniobra", specs: ["40A 400V", "3 polos", "bobina 230VAC", "1NA+1NC"], precio: "48-58€" },
  { ref: "MS116-1.6", desc: "Guardamotor ABB 1-1.6A", marca: "ABB", familia: "Protección y Maniobra", specs: ["rango 1-1.6A", "protección Clase 10", "disparo térmico y magnético"], precio: "28-35€" },
  { ref: "MS116-6.3", desc: "Guardamotor ABB 4-6.3A", marca: "ABB", familia: "Protección y Maniobra", specs: ["rango 4-6.3A", "protección Clase 10", "motor hasta 2.2kW 400V"], precio: "30-38€" },
  { ref: "MS116-16", desc: "Guardamotor ABB 10-16A", marca: "ABB", familia: "Protección y Maniobra", specs: ["rango 10-16A", "motor hasta 7.5kW 400V", "arranque directo"], precio: "35-44€" },
  { ref: "MS116-25", desc: "Guardamotor ABB 16-25A", marca: "ABB", familia: "Protección y Maniobra", specs: ["rango 16-25A", "motor hasta 11kW 400V"], precio: "42-52€" },
  { ref: "LC1D09M7", desc: "Contactor Schneider 9A bobina 220VAC", marca: "Schneider Electric", familia: "Protección y Maniobra", specs: ["9A 400V", "3 polos", "bobina 220VAC", "motor hasta 4kW"], precio: "16-20€" },
  { ref: "LC1D25M7", desc: "Contactor Schneider 25A bobina 220VAC", marca: "Schneider Electric", familia: "Protección y Maniobra", specs: ["25A 400V", "3 polos", "bobina 220VAC", "motor hasta 11kW"], precio: "28-35€" },
  { ref: "GV2ME16", desc: "Guardamotor Schneider 10-16A", marca: "Schneider Electric", familia: "Protección y Maniobra", specs: ["rango 10-16A", "motor hasta 7.5kW 400V", "clase 10A"], precio: "38-47€" },
  { ref: "GV2ME22", desc: "Guardamotor Schneider 16-22A", marca: "Schneider Electric", familia: "Protección y Maniobra", specs: ["rango 16-22A", "motor hasta 11kW 400V"], precio: "44-55€" },

  // VARIADORES
  { ref: "ATV320U07M2C", desc: "Variador Schneider ATV320 0.75kW 230V monofásico", marca: "Schneider Electric", familia: "Variadores y Arranque", specs: ["0.75kW", "230V monofásico entrada", "400V trifásico salida", "IP20"], precio: "180-220€" },
  { ref: "ATV320U15N4B", desc: "Variador Schneider ATV320 1.5kW 400V trifásico", marca: "Schneider Electric", familia: "Variadores y Arranque", specs: ["1.5kW", "400V trifásico", "IP20", "bus SoMove"], precio: "240-290€" },
  { ref: "ATV320U40N4B", desc: "Variador Schneider ATV320 4kW 400V trifásico", marca: "Schneider Electric", familia: "Variadores y Arranque", specs: ["4kW", "400V trifásico", "IP20", "Modbus integrado"], precio: "380-450€" },
  { ref: "ATV320U75N4B", desc: "Variador Schneider ATV320 7.5kW 400V trifásico", marca: "Schneider Electric", familia: "Variadores y Arranque", specs: ["7.5kW", "400V trifásico", "IP20"], precio: "520-620€" },
  { ref: "ACS310-03E-07A5-4", desc: "Variador ABB ACS310 3kW 400V trifásico", marca: "ABB", familia: "Variadores y Arranque", specs: ["3kW", "400V trifásico", "7.5A", "IP20", "panel básico incluido"], precio: "320-390€" },
  { ref: "ACS310-03E-17A2-4", desc: "Variador ABB ACS310 7.5kW 400V trifásico", marca: "ABB", familia: "Variadores y Arranque", specs: ["7.5kW", "400V trifásico", "17.2A", "IP20"], precio: "580-680€" },

  // PROTECCIÓN ELÉCTRICA
  { ref: "A9F74206", desc: "iC60N Schneider 2P 6A curva C", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["2 polos", "6A", "curva C", "6kA", "IEC 60898"], precio: "12-16€" },
  { ref: "A9F74210", desc: "iC60N Schneider 2P 10A curva C", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["2 polos", "10A", "curva C", "6kA"], precio: "12-16€" },
  { ref: "A9F74216", desc: "iC60N Schneider 2P 16A curva C", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["2 polos", "16A", "curva C", "6kA"], precio: "13-17€" },
  { ref: "A9F74316", desc: "iC60N Schneider 3P 16A curva C", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["3 polos", "16A", "curva C", "6kA"], precio: "22-28€" },
  { ref: "A9F74332", desc: "iC60N Schneider 3P 32A curva C", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["3 polos", "32A", "curva C", "6kA"], precio: "28-35€" },
  { ref: "A9R14225", desc: "iID Schneider diferencial 2P 25A 30mA Tipo AC", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["2 polos", "25A", "30mA", "Tipo AC", "IEC 61008"], precio: "28-35€" },
  { ref: "A9R14240", desc: "iID Schneider diferencial 2P 40A 30mA Tipo AC", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["2 polos", "40A", "30mA", "Tipo AC"], precio: "30-38€" },
  { ref: "A9R14440", desc: "iID Schneider diferencial 4P 40A 30mA Tipo AC", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["4 polos", "40A", "30mA", "Tipo AC"], precio: "55-68€" },
  { ref: "A9R21440", desc: "iID Schneider diferencial 4P 40A 300mA Tipo AC", marca: "Schneider Electric", familia: "Protección Eléctrica", specs: ["4 polos", "40A", "300mA", "selectivo", "Tipo AC"], precio: "72-88€" },
  { ref: "MBN116", desc: "Magnetotérmico Hager 1P+N 16A curva C", marca: "Hager", familia: "Protección Eléctrica", specs: ["1P+N", "16A", "curva C", "6kA", "ancho 18mm"], precio: "14-18€" },
  { ref: "CDN440D", desc: "Diferencial Hager 4P 40A 30mA Tipo A", marca: "Hager", familia: "Protección Eléctrica", specs: ["4 polos", "40A", "30mA", "Tipo A", "super-inmunizado"], precio: "65-80€" },

  // CABLEADO
  { ref: "RVK 1X2.5", desc: "Cable RVK 1x2.5mm² negro (por metro)", marca: "Prysmian", familia: "Cableado y Canalizaciones", specs: ["sección 2.5mm²", "tensión 0.6/1kV", "XLPE + PVC", "temperatura max 90°C"], precio: "0.8-1.1€/m" },
  { ref: "RVK 1X6", desc: "Cable RVK 1x6mm² negro (por metro)", marca: "Prysmian", familia: "Cableado y Canalizaciones", specs: ["sección 6mm²", "tensión 0.6/1kV", "XLPE + PVC", "temp max 90°C"], precio: "1.8-2.4€/m" },
  { ref: "RVK 1X16", desc: "Cable RVK 1x16mm² negro (por metro)", marca: "Prysmian", familia: "Cableado y Canalizaciones", specs: ["sección 16mm²", "tensión 0.6/1kV", "XLPE + PVC"], precio: "4.2-5.5€/m" },
  { ref: "RVK 1X35", desc: "Cable RVK 1x35mm² negro (por metro)", marca: "Prysmian", familia: "Cableado y Canalizaciones", specs: ["sección 35mm²", "tensión 0.6/1kV", "XLPE + PVC"], precio: "8.5-11€/m" },
  { ref: "H07V-K 1.5", desc: "Cable H07V-K 1x1.5mm² (por metro)", marca: "Prysmian", familia: "Cableado y Canalizaciones", specs: ["sección 1.5mm²", "450/750V", "PVC flexible", "uso en tubo"], precio: "0.35-0.5€/m" },
  { ref: "H07V-K 2.5", desc: "Cable H07V-K 1x2.5mm² (por metro)", marca: "Prysmian", familia: "Cableado y Canalizaciones", specs: ["sección 2.5mm²", "450/750V", "PVC flexible", "uso en tubo"], precio: "0.55-0.75€/m" },

  // VEHÍCULO ELÉCTRICO
  { ref: "EVL1S3P0A", desc: "Cargador Schneider EVlink Smart 7.4kW monofásico", marca: "Schneider Electric", familia: "Vehículo Eléctrico", specs: ["7.4kW", "230V monofásico", "32A", "Modo 3", "IP54", "cable 4.5m Tipo 2"], precio: "480-580€" },
  { ref: "EVH2S22P0AK", desc: "Cargador Schneider EVlink Home 22kW trifásico", marca: "Schneider Electric", familia: "Vehículo Eléctrico", specs: ["22kW", "400V trifásico", "32A", "Modo 3", "IP55", "Tipo 2"], precio: "680-820€" },
  { ref: "W22G-MC-1-1-T2-5", desc: "Wallbox Pulsar Plus 7.4kW", marca: "Wallbox", familia: "Vehículo Eléctrico", specs: ["7.4kW monofásico", "32A", "Modo 3", "IP54", "WiFi+Bluetooth", "App"], precio: "420-500€" },
  { ref: "W22G-MC-0-T2-5", desc: "Wallbox Pulsar Plus 22kW", marca: "Wallbox", familia: "Vehículo Eléctrico", specs: ["22kW trifásico", "32A", "Modo 3", "IP54", "WiFi+Bluetooth"], precio: "560-680€" },

  // ENERGÍAS RENOVABLES
  { ref: "SYMO-3.0-3-M", desc: "Inversor Fronius Symo 3kW trifásico", marca: "Fronius", familia: "Energías Renovables", specs: ["3kW", "trifásico", "2 MPPT", "rendimiento 98%", "Wi-Fi integrado"], precio: "980-1.180€" },
  { ref: "SYMO-5.0-3-M", desc: "Inversor Fronius Symo 5kW trifásico", marca: "Fronius", familia: "Energías Renovables", specs: ["5kW", "trifásico", "2 MPPT", "rendimiento 98.1%"], precio: "1.250-1.500€" },
  { ref: "SB3.0-1AV-41", desc: "Inversor SMA Sunny Boy 3kW monofásico", marca: "SMA", familia: "Energías Renovables", specs: ["3kW monofásico", "1 MPPT", "rendimiento 97.2%", "SMA ShadeFix"], precio: "850-1.050€" },
];

function getProductosPorFamilia(familia) {
  return CATALOGO_SONEPAR.filter(p => p.familia === familia).slice(0, 10);
}

function contextoProductos(familia) {
  if (!familia) return "";
  const prods = getProductosPorFamilia(familia);
  if (prods.length === 0) return "";
  const lineas = prods.map(p => `- ${p.ref} | ${p.desc} | ${p.specs.join(", ")} | Precio orientativo: ${p.precio}`).join("\n");
  return `\n\nPRODUCTOS SONEPAR A CORUÑA — ${familia.toUpperCase()} (stock habitual):\n${lineas}\nUsa estas referencias cuando recomiendes producto de esta familia. Confirma siempre que el precio y disponibilidad deben verificarse en el sistema de la delegación.`;
}

const MODOS = [
  { id: "general",      label: "General",     desc: "Cualquier consulta técnica" },
  { id: "averia",       label: "Avería",       desc: "Diagnóstico de fallos" },
  { id: "seleccion",    label: "Selección",    desc: "Elegir el producto correcto" },
  { id: "normas",       label: "Normativa",    desc: "IEC, UNE, reglamentos" },
  { id: "residencial",  label: "Residencial",  desc: "Instalaciones domésticas y terciario" },
  { id: "comparativa",  label: "Comparativa",  desc: "Comparar dos productos o referencias" },
];

const PROMPT_MODO = {
  general:     "",
  averia:      "\n\nMODO AVERÍA ACTIVO: El cliente tiene un equipo con fallo. Aplica siempre la estructura: Causa probable → Verificaciones → Solución → Prevención → Consejo práctico. Sé directo — el cliente está delante del equipo.",
  seleccion:   "\n\nMODO SELECCIÓN ACTIVO: El cliente necesita elegir un producto. Confirma los parámetros clave si faltan. Recomienda siempre marca Sonepar con argumentación técnica. Termina siempre con una sección 'ALTERNATIVA:' indicando otro producto del portfolio Sonepar para el mismo caso, con la diferencia técnica principal respecto a tu recomendación.",
  normas:      "\n\nMODO NORMATIVA ACTIVO: Cita siempre la norma exacta (IEC, UNE, RD, ITC-BT con número y apartado). Explica el requisito concreto y cómo aplica al caso del cliente.",
  residencial: "\n\nMODO RESIDENCIAL ACTIVO: Instalación doméstica o terciario. Usa vocabulario REBT/ITC-BT. Referencia el ITC-BT aplicable. Recomienda productos Sonepar para instalación doméstica (Hager, Legrand, Schneider Homeline, Simon). El cliente suele ser instalador autónomo de obra nueva o reforma.",
  comparativa: "\n\nMODO COMPARATIVA ACTIVO: El cliente quiere comparar dos productos o referencias. Si no te da las dos referencias, pídelas. Luego devuelve una tabla de texto con este formato exacto:\n\nPARÁMETRO          | PRODUCTO A        | PRODUCTO B\n-------------------+-------------------+-------------------\n[parámetro 1]      | [valor A]         | [valor B]\n[parámetro 2]      | [valor A]         | [valor B]\n\nAl final de la tabla añade: RECOMENDACIÓN: [cuál elegir y por qué en una frase]. Usa mínimo 5 parámetros técnicos relevantes para la familia del producto.",
};

const SUGERENCIAS_POR_MODO = {
  general: [
    "¿Cuál es la diferencia entre un contactor y un relé de maniobra?",
    "El variador ATV320 da fallo OHF, ¿qué significa?",
    "¿Qué sección de cable necesito para un motor de 11kW a 400V?",
    "¿Qué normativa aplica a instalaciones de carga de VE?",
    "¿Cómo selecciono el guardamotor correcto para un motor de 7.5kW?",
  ],
  averia: [
    "Un contactor ABB AF09 no cierra. El piloto de bobina enciende pero los contactos no cierran.",
    "El variador da OHF en arranque aunque la temperatura ambiente es normal.",
    "Un motor trifásico vibra y consume más amperios de lo normal.",
    "El diferencial salta al conectar la bomba pero no hay fallo de aislamiento.",
    "El PLC no reconoce la señal del sensor de proximidad aunque hay tensión.",
  ],
  seleccion: [
    "Necesito un guardamotor para un motor de 7.5kW, 400V, arranque directo.",
    "¿Qué variador me recomiendas para una bomba de 15kW con control de presión?",
    "Necesito un diferencial para un circuito de tomas de corriente en nave industrial.",
    "¿Qué contactor uso para un motor de 22kW con inversión de giro?",
    "Necesito un cable para bandeja portacables en exterior, 6mm², 50 metros.",
  ],
  normas: [
    "¿Qué normativa aplica a las instalaciones de recarga de VE en garaje comunitario?",
    "¿Qué grado de protección mínimo necesita un cuadro eléctrico en exterior?",
    "¿Cuál es la sección mínima de cable para una instalación trifásica de 22kW a 30 metros?",
    "¿Qué dice el REBT sobre los circuitos mínimos en una vivienda?",
    "¿Qué normativa regula la instalación de paneles solares en cubierta?",
  ],
  residencial: [
    "¿Qué circuitos mínimos necesita una vivienda de grado de electrificación básico?",
    "¿Qué diferencial pongo para el circuito del termo eléctrico?",
    "¿Qué sección de cable uso para el circuito de cocina y horno?",
    "¿Qué punto de recarga de VE me recomiendas para garaje de vivienda unifamiliar?",
    "¿Cuántos puntos de luz puede tener un circuito de iluminación?",
  ],
  comparativa: [
    "Compara contactor ABB AF09 vs Schneider LC1D09.",
    "Diferencias entre variador ATV320 y ABB ACS310 para una bomba de 7.5kW.",
    "Compara diferencial Schneider iID 4P 40A 30mA Tipo AC vs Hager CDN440D.",
    "¿Qué es mejor para un guardamotor de 7.5kW, el ABB MS116-16 o el Schneider GV2ME16?",
    "Compara cable RVK vs H07V-K para instalación en bandeja interior.",
  ],
};

const CONV_NUEVA = (id) => ({ id, nombre: "Nueva conversación", mensajes: [], ts: Date.now() });

// ── Detección de familia por palabras clave ──────────────
const KEYWORDS_FAMILIA = [
  { familia: "Protección y Maniobra",            keys: ["contactor", "relé", "guardamotor", "bobina", "af09", "lc1", "ms", "msx", "rm"] },
  { familia: "Variadores y Arranque",             keys: ["variador", "atv", "acs", "sinamics", "vfd", "arrancador", "inverter", "frecuencia"] },
  { familia: "PLC y Automatización",              keys: ["plc", "autómata", "modicon", "s7", "simatic", "hmi", "scada", "sensor", "encoder"] },
  { familia: "Iluminación",                       keys: ["luminaria", "led", "downlight", "pantalla", "alumbrado", "proyector", "lámpara"] },
  { familia: "Cableado y Canalizaciones",         keys: ["cable", "sección", "bandeja", "tubo", "rvk", "xlpe", "pvc", "canaleta", "manguera"] },
  { familia: "Protección Eléctrica",              keys: ["diferencial", "magnetotérmico", "iga", "icp", "interruptor", "rccb", "mcb", "fusible"] },
  { familia: "Vehículo Eléctrico",                keys: ["vehículo eléctrico", "recarga", "carga ve", "evlink", "wallbox", "punto de carga", "modo 2", "modo 3"] },
  { familia: "Energías Renovables",               keys: ["solar", "fotovoltaica", "inversor", "batería", "fronius", "sma", "huawei", "panel"] },
  { familia: "Conectividad y Señal",              keys: ["relé de señal", "finder", "phoenix", "wago", "regleta", "borner", "conector"] },
];

function detectarFamilia(texto) {
  const t = texto.toLowerCase();
  for (const { familia, keys } of KEYWORDS_FAMILIA) {
    if (keys.some(k => t.includes(k))) return familia;
  }
  return null;
}

// ── Stats ────────────────────────────────────────────────
function guardarStat({ modo, confianza, familia }) {
  try {
    const raw = localStorage.getItem("sonepar_sonex_stats");
    const stats = raw ? JSON.parse(raw) : [];
    stats.push({ ts: Date.now(), modo, confianza, familia });
    if (stats.length > 200) stats.splice(0, stats.length - 200);
    localStorage.setItem("sonepar_sonex_stats", JSON.stringify(stats));
  } catch {}
}

function leerStats() {
  try {
    const raw = localStorage.getItem("sonepar_sonex_stats");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function parseConfianza(texto) {
  const match = texto.match(/\[CONFIANZA:(\d)\]/);
  return match ? parseInt(match[1]) : null;
}

function limpiarConfianza(texto) {
  return texto.replace(/\[CONFIANZA:\d\]\s*$/, "").trimEnd();
}

// ── Parser de formato básico para respuestas bot ─────────
function RenderTexto({ texto }) {
  const lineas = texto.split("\n");
  return (
    <div>
      {lineas.map((linea, i) => {
        // Línea numerada: "1. Texto" o "1) Texto"
        if (/^\d+[\.\)]\s/.test(linea)) {
          const contenido = linea.replace(/^\d+[\.\)]\s/, "");
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", paddingLeft: "4px" }}>
              <span style={{ color: "#4a7ab5", fontFamily: "'Courier New', monospace", fontSize: "11px", flexShrink: 0, minWidth: "16px" }}>
                {linea.match(/^\d+/)[0]}.
              </span>
              <span>{renderNegritas(contenido)}</span>
            </div>
          );
        }
        // Línea con guión o bullet
        if (/^[-–•]\s/.test(linea)) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", paddingLeft: "8px" }}>
              <span style={{ color: "#4a7ab5", flexShrink: 0 }}>–</span>
              <span>{renderNegritas(linea.replace(/^[-–•]\s/, ""))}</span>
            </div>
          );
        }
        // Separador de tabla (---|---|---)
        if (/^[-+|]+$/.test(linea.replace(/\s/g, ""))) {
          return <div key={i} style={{ borderBottom: "1px solid #1a2a4a", margin: "2px 0" }} />;
        }
        // Línea de tabla con pipes
        if (linea.includes("|") && linea.trim().startsWith("|") === false && linea.includes("|")) {
          const celdas = linea.split("|").map(c => c.trim()).filter(Boolean);
          if (celdas.length >= 2) {
            return (
              <div key={i} style={{ display: "flex", gap: "0", marginBottom: "1px", fontFamily: "'Courier New', monospace", fontSize: "11px" }}>
                {celdas.map((c, j) => (
                  <span key={j} style={{ flex: 1, padding: "2px 6px", borderRight: j < celdas.length - 1 ? "1px solid #1a2a4a" : "none", color: j === 0 ? "#888" : "#d4ccc4" }}>
                    {c}
                  </span>
                ))}
              </div>
            );
          }
        }
        // Encabezado tipo "CAUSA PROBABLE:" o "Consejo práctico:"
        if (/^[A-ZÁÉÍÓÚ][^:]+:\s*$/.test(linea) || /^[A-ZÁÉÍÓÚ ]{4,}:/.test(linea)) {
          return <div key={i} style={{ fontWeight: "700", color: "#c8c0b8", marginTop: i > 0 ? "10px" : "0", marginBottom: "4px" }}>{linea}</div>;
        }
        // Línea vacía → separador visual
        if (linea.trim() === "") {
          return <div key={i} style={{ height: "6px" }} />;
        }
        // Texto normal
        return <div key={i} style={{ marginBottom: "2px" }}>{renderNegritas(linea)}</div>;
      })}
    </div>
  );
}

function renderNegritas(texto) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ color: "#e8e0d4" }}>{p.slice(2, -2)}</strong>
      : p
  );
}

function BadgeConfianza({ nivel }) {
  if (!nivel) return null;
  const cfg = {
    3: { label: "Alta confianza",  color: "#2e7d32", bg: "#e8f5e9" },
    2: { label: "Confianza media", color: "#f9a825", bg: "#fffde7" },
    1: { label: "Verificar",       color: "#c62828", bg: "#ffebee" },
  }[nivel];
  return (
    <span style={{ padding: "2px 8px", background: cfg.bg, color: cfg.color, fontSize: "9px", fontFamily: "'Courier New', monospace", fontWeight: "700", letterSpacing: "0.5px" }}>
      {cfg.label}
    </span>
  );
}

export default function Sonex() {
  const [conversaciones, setConversaciones] = useState([]);
  const [convActiva, setConvActiva] = useState(null);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modo, setModo] = useState("general");
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [toast, setToast] = useState("");
  const [modoRapido, setModoRapido] = useState(false);
  const [respuestaRapida, setRespuestaRapida] = useState("");
  const [cargandoRapido, setCargandoRapido] = useState(false);
  const [inputRapido, setInputRapido] = useState("");
  const [verAnalytics, setVerAnalytics] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_sonex_conversaciones");
      if (saved) {
        const convs = JSON.parse(saved);
        setConversaciones(convs);
        if (convs.length > 0) setConvActiva(convs[0].id);
      } else {
        const init = CONV_NUEVA("c0");
        setConversaciones([init]);
        setConvActiva("c0");
      }
    } catch {
      const init = CONV_NUEVA("c0");
      setConversaciones([init]);
      setConvActiva("c0");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversaciones, convActiva]);

  const guardar = (convs) => {
    try { localStorage.setItem("sonepar_sonex_conversaciones", JSON.stringify(convs)); } catch {}
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const conv = conversaciones.find(c => c.id === convActiva);
  const mensajes = conv?.mensajes || [];
  const LIMITE = 20;
  const limitAlcanzado = mensajes.filter(m => m.rol === "user").length >= LIMITE;
  const modoActual = MODOS.find(m => m.id === modo);
  const sugerencias = SUGERENCIAS_POR_MODO[modo] || SUGERENCIAS_POR_MODO.general;
  const convsFiltradas = busqueda.trim()
    ? conversaciones.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : conversaciones;
  const puedeEscalar = mensajes.filter(m => m.rol === "user").length >= 2;

  const systemFinal = (familiaDetectada) => {
    const base = SYSTEM_PROMPT + (PROMPT_MODO[modo] || "");
    return base + contextoProductos(familiaDetectada);
  };

  const enviar = async (textoOverride) => {
    const texto = (textoOverride || input).trim();
    if (!texto || cargando || limitAlcanzado) return;
    setInput("");

    const mensajeUser = { rol: "user", texto, ts: Date.now() };
    const historialActualizado = [...mensajes, mensajeUser];

    let nombreConv = conv?.nombre || "Nueva conversación";
    if (mensajes.length === 0) {
      nombreConv = texto.slice(0, 40) + (texto.length > 40 ? "..." : "");
    }

    const nuevasConvs = conversaciones.map(c => c.id === convActiva ? { ...c, nombre: nombreConv, mensajes: historialActualizado } : c);
    setConversaciones(nuevasConvs);
    guardar(nuevasConvs);
    setCargando(true);

    const familiaDetectada = detectarFamilia(texto);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: systemFinal(familiaDetectada),
          messages: historialActualizado.map(m => ({ role: m.rol === "user" ? "user" : "assistant", content: m.texto })),
        }),
      });
      const data = await res.json();
      const respuesta = data.content?.map(i => i.text || "").join("") || "";
      const confianza = parseConfianza(respuesta);
      const textoLimpio = limpiarConfianza(respuesta);

      const mensajeBot = { rol: "bot", texto: textoLimpio, confianza, familia: familiaDetectada, ts: Date.now() };
      guardarStat({ modo, confianza, familia: familiaDetectada });
      const conFinal = [...historialActualizado, mensajeBot];
      const convsFinales = conversaciones.map(c => c.id === convActiva ? { ...c, nombre: nombreConv, mensajes: conFinal } : c);
      setConversaciones(convsFinales);
      guardar(convsFinales);
    } catch {
      const err = { rol: "bot", texto: "Error de conexión. Inténtalo de nuevo.", confianza: null, ts: Date.now() };
      const convsErr = conversaciones.map(c => c.id === convActiva ? { ...c, mensajes: [...historialActualizado, err] } : c);
      setConversaciones(convsErr);
      guardar(convsErr);
    }
    setCargando(false);
  };

  const consultaRapida = async () => {
    const texto = inputRapido.trim();
    if (!texto || cargandoRapido) return;
    setCargandoRapido(true);
    setRespuestaRapida("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: SYSTEM_PROMPT + "\n\nResponde en máximo 3 frases. Ve directo al dato. Sin estructura, sin encabezados.",
          messages: [{ role: "user", content: texto }],
        }),
      });
      const data = await res.json();
      const respuesta = data.content?.map(i => i.text || "").join("") || "";
      setRespuestaRapida(limpiarConfianza(respuesta));
    } catch { setRespuestaRapida("Error de conexión."); }
    setCargandoRapido(false);
  };

  const nuevaConversacion = () => {
    const id = `c${Date.now()}`;
    const nueva = CONV_NUEVA(id);
    const nuevas = [nueva, ...conversaciones].slice(0, 10);
    setConversaciones(nuevas);
    setConvActiva(id);
    guardar(nuevas);
  };

  const borrarConversacion = (id) => {
    const nuevas = conversaciones.filter(c => c.id !== id);
    if (nuevas.length === 0) {
      const init = CONV_NUEVA("c_new");
      setConversaciones([init]);
      setConvActiva("c_new");
      guardar([init]);
    } else {
      setConversaciones(nuevas);
      if (convActiva === id) setConvActiva(nuevas[0].id);
      guardar(nuevas);
    }
  };

  const copiarMensaje = (texto) => {
    navigator.clipboard.writeText(texto).then(() => showToast("Respuesta copiada"));
  };

  const exportarConsulta = (pregunta, respuesta) => {
    const fecha = new Date().toLocaleString("es-ES");
    const txt = `CONSULTA SONEX — ${fecha}\nModo: ${modoActual?.label}\n\nPREGUNTA:\n${pregunta}\n\nRESPUESTA:\n${respuesta}\n\n⚠ Verificar con documentación técnica del fabricante y catálogo Sonepar antes de cualquier instalación o pedido.`;
    navigator.clipboard.writeText(txt).then(() => showToast("Consulta exportada al portapapeles"));
  };

  const escalarTecnico = () => {
    const fecha = new Date().toLocaleString("es-ES");
    const ultimaBot = [...mensajes].reverse().find(m => m.rol === "bot");
    const ultimaUser = [...mensajes].reverse().find(m => m.rol === "user");
    const confianzaLabel = ultimaBot?.confianza === 1 ? "Baja — verificar" : ultimaBot?.confianza === 2 ? "Media" : "Alta";
    const txt = `ESCALADO SONEX — ${fecha}\nModo: ${modoActual?.label} | Confianza última respuesta: ${confianzaLabel}\n\nÚLTIMA PREGUNTA:\n${ultimaUser?.texto || ""}\n\nÚLTIMA RESPUESTA SONEX:\n${ultimaBot?.texto || ""}\n\nSolicito revisión por técnico senior.`;
    navigator.clipboard.writeText(txt).then(() => showToast("Escalado copiado al portapapeles"));
  };

  const exportarConversacion = () => {
    if (!conv || mensajes.length === 0) return;
    const fecha = new Date().toLocaleString("es-ES");
    const lineas = [`CONVERSACIÓN SONEX — ${fecha}`, `Modo: ${modoActual?.label}`, `Consultas: ${mensajes.filter(m => m.rol === "user").length}`, "═".repeat(60), ""];
    mensajes.forEach((m, i) => {
      const hora = new Date(m.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      if (m.rol === "user") {
        lineas.push(`[${hora}] TÉCNICO:`);
        lineas.push(m.texto);
      } else {
        const conf = m.confianza === 3 ? "Alta" : m.confianza === 2 ? "Media" : m.confianza === 1 ? "Baja" : "—";
        lineas.push(`[${hora}] SONEX (Confianza: ${conf}${m.familia ? ` · ${m.familia}` : ""}):`);
        lineas.push(m.texto);
      }
      lineas.push("");
    });
    lineas.push("─".repeat(60));
    lineas.push("⚠ Verificar con documentación técnica del fabricante y catálogo Sonepar antes de cualquier instalación o pedido.");
    const blob = new Blob([lineas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SONEX-${conv.nombre.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Conversación descargada");
  };

  const calcularAnalytics = () => {
    const stats = leerStats();
    if (stats.length === 0) return null;
    const total = stats.length;
    const alta = stats.filter(s => s.confianza === 3).length;
    const baja = stats.filter(s => s.confianza === 1).length;
    const modoCount = {};
    stats.forEach(s => { modoCount[s.modo] = (modoCount[s.modo] || 0) + 1; });
    const modoTop = Object.entries(modoCount).sort((a, b) => b[1] - a[1])[0];
    const familiaCount = {};
    stats.filter(s => s.familia).forEach(s => { familiaCount[s.familia] = (familiaCount[s.familia] || 0) + 1; });
    const familiaTop = Object.entries(familiaCount).sort((a, b) => b[1] - a[1])[0];
    return { total, pctAlta: Math.round(alta / total * 100), pctBaja: Math.round(baja / total * 100), modoTop: modoTop?.[0], familiaTop: familiaTop?.[0] };
  };

  const analytics = calcularAnalytics();

  const S = {
    btn: (color = "#1a1a2e", full = false) => ({
      padding: "8px 18px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: color, color: "#fff", border: "none", cursor: "pointer",
      width: full ? "100%" : "auto",
    }),
    btnOutline: (color = "#1a1a2e") => ({
      padding: "6px 12px", fontSize: "10px", letterSpacing: "1.5px",
      fontFamily: "'Courier New', monospace", fontWeight: "700",
      background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer",
    }),
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a1a2e", color: "#e8a020", padding: "12px 20px", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0f0f1a", fontFamily: "'Georgia', serif", color: "#e8e0d4" }}>

        {/* Header */}
        <div style={{ background: "#0f0f1a", padding: "0 20px", display: "flex", alignItems: "stretch", borderBottom: "1px solid #1a1a2e", flexShrink: 0 }}>
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "0 16px 0 0", fontSize: "16px" }}>
            ☰
          </button>
          <div style={{ background: "#1a2a4a", padding: "12px 18px", display: "flex", alignItems: "center", marginRight: "16px" }}>
            <span style={{ fontWeight: "900", fontSize: "11px", letterSpacing: "3px", color: "#fff", fontFamily: "'Courier New', monospace" }}>SONEPAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <span style={{ color: "#4a7ab5", fontFamily: "'Courier New', monospace", fontSize: "13px", letterSpacing: "4px", fontWeight: "700" }}>SONEX</span>
            <span style={{ color: "#333", fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>ASISTENTE TÉCNICO · v5 · SONEPAR</span>
            {!sidebarAbierto && (
              <span style={{ padding: "2px 8px", background: "#1a2a4a", color: "#4a9eff", fontSize: "9px", fontFamily: "'Courier New', monospace", letterSpacing: "1px", fontWeight: "700" }}>
                {modoActual?.label.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {mensajes.length > 0 && (
              <button onClick={exportarConversacion}
                style={{ ...S.btn("#1a2a4a") }}>
                ↓ GUARDAR
              </button>
            )}
            <button onClick={() => { setModoRapido(!modoRapido); setRespuestaRapida(""); setInputRapido(""); }}
              style={{ ...S.btn(modoRapido ? "#c07010" : "#1a2a4a") }}>
              {modoRapido ? "MODO NORMAL" : "⚡ CONSULTA RÁPIDA"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Sidebar */}
          {sidebarAbierto && (
            <div style={{ width: "240px", background: "#0a0a14", borderRight: "1px solid #1a1a2e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ padding: "12px" }}>
                <button onClick={nuevaConversacion} style={{ ...S.btn("#1a2a4a", true), padding: "10px" }}>
                  + NUEVA CONVERSACIÓN
                </button>
              </div>

              <div style={{ padding: "8px 12px", borderBottom: "1px solid #1a1a2e" }}>
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar conversación..."
                  style={{ width: "100%", padding: "6px 10px", background: "#0f0f1a", border: "1px solid #1a2a4a", color: "#888", fontSize: "11px", fontFamily: "'Courier New', monospace", outline: "none" }}
                />
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#333", fontFamily: "'Courier New', monospace", padding: "8px 4px", marginBottom: "4px" }}>
                  CONVERSACIONES ({conversaciones.length}/10)
                </div>
                {convsFiltradas.map(c => (
                  <div key={c.id}
                    style={{ padding: "10px 10px", marginBottom: "2px", cursor: "pointer", background: c.id === convActiva ? "#1a2a4a" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}
                    onClick={() => setConvActiva(c.id)}>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "11px", color: c.id === convActiva ? "#e8e0d4" : "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "2px" }}>
                        {c.nombre}
                      </div>
                      <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace" }}>
                        {c.mensajes.filter(m => m.rol === "user").length} mensajes
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); borrarConversacion(c.id); }}
                      style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "12px", padding: "0", flexShrink: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Modos */}
              <div style={{ padding: "12px", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "8px" }}>MODO DE CONSULTA</div>
                {MODOS.map(m => (
                  <button key={m.id} onClick={() => setModo(m.id)}
                    style={{ display: "block", width: "100%", padding: "7px 10px", marginBottom: "3px", textAlign: "left", fontSize: "11px", fontFamily: "'Courier New', monospace", cursor: "pointer", background: modo === m.id ? "#1a2a4a" : "transparent", color: modo === m.id ? "#4a9eff" : "#555", border: `1px solid ${modo === m.id ? "#1a2a4a" : "transparent"}` }}>
                    {m.label}
                    <div style={{ fontSize: "9px", color: "#333", marginTop: "1px" }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Analytics */}
              <div style={{ padding: "8px 12px", borderTop: "1px solid #1a1a2e" }}>
                <button onClick={() => setVerAnalytics(!verAnalytics)}
                  style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "1px solid #1a2a4a", color: "#555", fontSize: "9px", fontFamily: "'Courier New', monospace", cursor: "pointer", letterSpacing: "1px", textAlign: "left" }}>
                  {verAnalytics ? "▲ OCULTAR STATS" : "▼ VER ESTADÍSTICAS"}
                </button>
                {verAnalytics && (
                  <div style={{ marginTop: "8px", padding: "10px", background: "#0f0f1a", border: "1px solid #1a2a4a" }}>
                    {!analytics ? (
                      <div style={{ fontSize: "10px", color: "#333", fontFamily: "'Courier New', monospace" }}>Sin datos aún. Haz algunas consultas primero.</div>
                    ) : (
                      <>
                        <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>CONSULTAS TOTALES: <span style={{ color: "#4a9eff" }}>{analytics.total}</span></div>
                        <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>CONFIANZA ALTA: <span style={{ color: "#4caf82" }}>{analytics.pctAlta}%</span></div>
                        <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>CONFIANZA BAJA: <span style={{ color: "#e57373" }}>{analytics.pctBaja}%</span></div>
                        <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>MODO TOP: <span style={{ color: "#ffb74d" }}>{analytics.modoTop || "—"}</span></div>
                        <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace" }}>FAMILIA TOP: <span style={{ color: "#4a7ab5" }}>{analytics.familiaTop || "—"}</span></div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ fontSize: "9px", color: "#333", lineHeight: "1.5", fontFamily: "'Courier New', monospace" }}>
                  ⚠ SONEX es una herramienta de apoyo para el técnico de mostrador. Las respuestas son orientativas — verificar con documentación del fabricante y catálogo Sonepar antes de cualquier instalación o pedido.
                </div>
              </div>
            </div>
          )}

          {/* Área principal */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Modo consulta rápida */}
            {modoRapido && (
              <div style={{ background: "#0f0f1a", borderBottom: "1px solid #1a1a2e", padding: "16px 24px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#c07010", fontFamily: "'Courier New', monospace", marginBottom: "10px" }}>⚡ CONSULTA RÁPIDA — respuesta en máx. 3 frases · no guarda historial</div>
                <div style={{ display: "flex", gap: "8px", marginBottom: respuestaRapida ? "12px" : "0" }}>
                  <input
                    value={inputRapido}
                    onChange={e => setInputRapido(e.target.value)}
                    placeholder="Pregunta directa..."
                    style={{ flex: 1, padding: "9px 14px", background: "#0a0a14", border: "1px solid #1a2a4a", color: "#e8e0d4", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none" }}
                    onKeyDown={e => e.key === "Enter" && consultaRapida()}
                  />
                  <button onClick={consultaRapida} disabled={cargandoRapido}
                    style={{ ...S.btn(cargandoRapido ? "#333" : "#c07010") }}>
                    {cargandoRapido ? "..." : "›"}
                  </button>
                </div>
                {respuestaRapida && (
                  <div style={{ background: "#0a0a14", border: "1px solid #1a2a4a", padding: "12px 16px", fontSize: "13px", color: "#e8e0d4", lineHeight: "1.6" }}>
                    {respuestaRapida}
                    <div style={{ marginTop: "10px" }}>
                      <button onClick={() => { navigator.clipboard.writeText(respuestaRapida); showToast("Copiado"); }}
                        style={{ ...S.btnOutline("#333"), padding: "3px 8px", fontSize: "9px" }}>
                        COPIAR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {mensajes.length === 0 && (
                <div style={{ maxWidth: "580px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.15 }}>◈</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#4a7ab5", marginBottom: "8px" }}>SONEX</div>
                    <div style={{ fontSize: "12px", color: "#444", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>ASISTENTE TÉCNICO · SONEPAR A CORUÑA</div>
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#333", fontFamily: "'Courier New', monospace" }}>
                      Modo: <span style={{ color: "#4a9eff" }}>{modoActual?.label}</span> — {modoActual?.desc}
                    </div>
                  </div>
                  <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#333", fontFamily: "'Courier New', monospace", marginBottom: "12px" }}>CONSULTAS FRECUENTES — {modoActual?.label.toUpperCase()}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {sugerencias.map((s, i) => (
                      <button key={i} onClick={() => enviar(s)}
                        style={{ padding: "12px 16px", background: "#0a0a14", border: "1px solid #1a2a4a", color: "#888", fontSize: "12px", textAlign: "left", cursor: "pointer", fontFamily: "'Georgia', serif", lineHeight: "1.4" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensajes.map((msg, i) => (
                <div key={i} style={{ marginBottom: "20px", display: "flex", flexDirection: msg.rol === "user" ? "row-reverse" : "row", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "28px", height: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.rol === "user" ? "#1a2a4a" : "#0a0a14", border: "1px solid #1a2a4a", fontSize: "10px", fontFamily: "'Courier New', monospace", color: msg.rol === "user" ? "#4a9eff" : "#4a7ab5", fontWeight: "700" }}>
                    {msg.rol === "user" ? "YO" : "SX"}
                  </div>
                  <div style={{ maxWidth: "75%" }}>
                  <div style={{ background: msg.rol === "user" ? "#0d1a2e" : "#0a0a14", border: `1px solid ${msg.rol === "user" ? "#1a2a4a" : "#1a1a2e"}`, padding: "14px 18px", fontSize: "13px", lineHeight: "1.7", color: "#d4ccc4", wordBreak: "break-word" }}>
                      {msg.rol === "user"
                        ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.texto}</span>
                        : <RenderTexto texto={msg.texto} />
                      }
                    </div>
                    {msg.rol === "bot" && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                        <BadgeConfianza nivel={msg.confianza} />
                        {msg.familia && (
                          <span style={{ padding: "2px 8px", background: "#0d1a2e", color: "#4a7ab5", fontSize: "9px", fontFamily: "'Courier New', monospace", letterSpacing: "0.5px", border: "1px solid #1a2a4a" }}>
                            {msg.familia}
                          </span>
                        )}
                        <button onClick={() => copiarMensaje(msg.texto)}
                          style={{ ...S.btnOutline("#333"), padding: "3px 8px", fontSize: "9px", color: "#444" }}>
                          COPIAR
                        </button>
                        <button onClick={() => {
                          const prev = mensajes[mensajes.indexOf(msg) - 1];
                          exportarConsulta(prev?.texto || "", msg.texto);
                        }}
                          style={{ ...S.btnOutline("#1a2a4a"), padding: "3px 8px", fontSize: "9px", color: "#4a7ab5" }}>
                          EXPORTAR
                        </button>
                        <span style={{ fontSize: "9px", color: "#2a2a3e", fontFamily: "'Courier New', monospace" }}>
                          {new Date(msg.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {cargando && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a14", border: "1px solid #1a2a4a", fontSize: "10px", fontFamily: "'Courier New', monospace", color: "#4a7ab5", fontWeight: "700" }}>SX</div>
                  <div style={{ background: "#0a0a14", border: "1px solid #1a2a4a", padding: "14px 18px", display: "flex", gap: "6px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: "5px", height: "5px", background: "#4a7ab5", borderRadius: "50%", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              {limitAlcanzado && (
                <div style={{ background: "#1a0a0a", border: "1px solid #c62828", padding: "12px 18px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#c62828", fontFamily: "'Courier New', monospace" }}>
                    Límite de {LIMITE} mensajes alcanzado
                  </span>
                  <button onClick={nuevaConversacion} style={{ ...S.btn("#c62828"), padding: "6px 14px", fontSize: "9px" }}>
                    NUEVA CONVERSACIÓN
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "16px 24px", background: "#0a0a14", borderTop: "1px solid #1a1a2e", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'Courier New', monospace" }}>
                  MODO: <span style={{ color: "#4a7ab5" }}>{modoActual?.label.toUpperCase()}</span>
                  <span style={{ color: "#222", marginLeft: "8px" }}>· {modoActual?.desc}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {puedeEscalar && (
                    <button onClick={escalarTecnico}
                      style={{ ...S.btnOutline("#c07010"), padding: "3px 10px", fontSize: "9px", color: "#c07010" }}>
                      ESCALAR ↑
                    </button>
                  )}
                  <div style={{ fontSize: "9px", color: limitAlcanzado ? "#c62828" : "#333", fontFamily: "'Courier New', monospace" }}>
                    {mensajes.filter(m => m.rol === "user").length}/{LIMITE}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder={limitAlcanzado ? "Límite alcanzado — inicia una nueva conversación" : "Escribe tu consulta técnica... (Enter para enviar, Shift+Enter para nueva línea)"}
                  disabled={limitAlcanzado}
                  rows={2}
                  style={{ flex: 1, padding: "11px 14px", background: "#0f0f1a", border: "1px solid #1a2a4a", color: "#e8e0d4", fontSize: "13px", fontFamily: "'Georgia', serif", outline: "none", resize: "none", opacity: limitAlcanzado ? 0.4 : 1 }}
                />
                <button onClick={() => enviar()} disabled={cargando || limitAlcanzado || !input.trim()}
                  style={{ ...S.btn(cargando || limitAlcanzado || !input.trim() ? "#1a1a2e" : "#1a2a4a"), padding: "0 20px", alignSelf: "stretch", fontSize: "16px" }}>
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
