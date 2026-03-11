import { useState, useEffect, useRef, useCallback } from "react";

// ── Paleta corporativa Sonepar ──────────────────────────────────────────────
const C = {
  azulOscuro: "#003087", azulMedio: "#1A4A8A", azulClaro: "#4A90D9",
  azulSuave:  "#EBF1FA", blanco: "#FFFFFF",    fondo: "#F5F6F8",
  texto:      "#1A1A2E", textoSec: "#4A5568",  textoTer: "#8A94A6",
  borde:      "#D1D9E6", bordeAct: "#4A90D9",  verde: "#1B6B3A",
  verdeSuave: "#EDF7F2", amarillo: "#C07010",  amarilloS: "#FFF8EE",
  rojo:       "#C62828", rojoSuave: "#FDECEA",
};

const LogoSonepar = ({ size = 28, color = "#FFFFFF" }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 120 38" fill="none">
    <ellipse cx="16" cy="19" rx="14" ry="7.5" stroke={C.azulClaro} strokeWidth="2.2" fill="none" transform="rotate(-20 16 19)" />
    <ellipse cx="16" cy="19" rx="14" ry="7.5" stroke={color} strokeWidth="2.2" fill="none" transform="rotate(20 16 19)" />
    <text x="34" y="25" fontFamily="Helvetica Neue,Arial,sans-serif" fontWeight="700" fontSize="17" fill={color} letterSpacing="0.5">sonepar</text>
  </svg>
);

// ── Catálogo completo v7 (~80 productos, 10 familias) ──────────────────────
const CATALOGO = [
  // PROTECCIÓN Y MANIOBRA
  { ref:"AF09-30-10-13",  desc:"Contactor ABB 9A 3P 230VAC",             marca:"ABB",                familia:"Protección y Maniobra",    specs:["9A 400V","3P","bobina 230VAC","1NA"],                        precio:"18-22€" },
  { ref:"AF16-30-10-13",  desc:"Contactor ABB 16A 3P 230VAC",            marca:"ABB",                familia:"Protección y Maniobra",    specs:["16A 400V","3P","bobina 230VAC","1NA"],                       precio:"22-28€" },
  { ref:"AF26-30-10-13",  desc:"Contactor ABB 26A 3P 230VAC",            marca:"ABB",                familia:"Protección y Maniobra",    specs:["26A 400V","3P","bobina 230VAC","1NA"],                       precio:"32-40€" },
  { ref:"AF40-30-11-13",  desc:"Contactor ABB 40A 3P 230VAC",            marca:"ABB",                familia:"Protección y Maniobra",    specs:["40A 400V","3P","bobina 230VAC","1NA+1NC"],                   precio:"48-58€" },
  { ref:"AF65-30-11-13",  desc:"Contactor ABB 65A 3P 230VAC",            marca:"ABB",                familia:"Protección y Maniobra",    specs:["65A 400V","3P","bobina 230VAC","motor 30kW"],                precio:"72-88€" },
  { ref:"MS116-1.6",      desc:"Guardamotor ABB 1-1.6A",                 marca:"ABB",                familia:"Protección y Maniobra",    specs:["rango 1-1.6A","Clase 10","térmico+magnético"],              precio:"28-35€" },
  { ref:"MS116-6.3",      desc:"Guardamotor ABB 4-6.3A",                 marca:"ABB",                familia:"Protección y Maniobra",    specs:["rango 4-6.3A","Clase 10","motor 2.2kW 400V"],               precio:"30-38€" },
  { ref:"MS116-16",       desc:"Guardamotor ABB 10-16A",                 marca:"ABB",                familia:"Protección y Maniobra",    specs:["rango 10-16A","motor 7.5kW 400V","arranque directo"],       precio:"35-44€" },
  { ref:"MS116-25",       desc:"Guardamotor ABB 16-25A",                 marca:"ABB",                familia:"Protección y Maniobra",    specs:["rango 16-25A","motor 11kW 400V"],                           precio:"42-52€" },
  { ref:"MS132-32",       desc:"Guardamotor ABB 25-32A",                 marca:"ABB",                familia:"Protección y Maniobra",    specs:["rango 25-32A","motor 15kW 400V","conexión directa AF"],     precio:"65-80€" },
  { ref:"LC1D09M7",       desc:"Contactor Schneider TeSys D 9A 220VAC",  marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["9A 400V","3P","bobina 220VAC","motor 4kW"],                 precio:"16-20€" },
  { ref:"LC1D25M7",       desc:"Contactor Schneider TeSys D 25A 220VAC", marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["25A 400V","3P","bobina 220VAC","motor 11kW"],               precio:"28-35€" },
  { ref:"LC1D40AM7",      desc:"Contactor Schneider TeSys D 40A 220VAC", marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["40A 400V","3P","bobina 220VAC","motor 18.5kW"],             precio:"42-52€" },
  { ref:"LC1D65AM7",      desc:"Contactor Schneider TeSys D 65A 220VAC", marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["65A 400V","3P","bobina 220VAC","motor 30kW"],               precio:"68-85€" },
  { ref:"GV2ME16",        desc:"Guardamotor Schneider TeSys 10-16A",     marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["rango 10-16A","motor 7.5kW 400V","clase 10A"],              precio:"38-47€" },
  { ref:"GV2ME22",        desc:"Guardamotor Schneider TeSys 16-22A",     marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["rango 16-22A","motor 11kW 400V"],                           precio:"44-55€" },
  { ref:"GV3ME40",        desc:"Guardamotor Schneider TeSys 29-40A",     marca:"Schneider Electric", familia:"Protección y Maniobra",    specs:["rango 29-40A","motor 18.5kW 400V","caja moldeada"],         precio:"95-115€" },
  // VARIADORES
  { ref:"ATV320U07M2C",      desc:"Variador Schneider ATV320 0.75kW mono",    marca:"Schneider Electric", familia:"Variadores y Arranque", specs:["0.75kW","230V mono","IP20"],                              precio:"180-220€" },
  { ref:"ATV320U15N4B",      desc:"Variador Schneider ATV320 1.5kW tri",      marca:"Schneider Electric", familia:"Variadores y Arranque", specs:["1.5kW","400V tri","IP20","bus SoMove"],                   precio:"240-290€" },
  { ref:"ATV320U40N4B",      desc:"Variador Schneider ATV320 4kW tri",        marca:"Schneider Electric", familia:"Variadores y Arranque", specs:["4kW","400V tri","IP20","Modbus integrado"],               precio:"380-450€" },
  { ref:"ATV320U75N4B",      desc:"Variador Schneider ATV320 7.5kW tri",      marca:"Schneider Electric", familia:"Variadores y Arranque", specs:["7.5kW","400V tri","IP20"],                               precio:"520-620€" },
  { ref:"ATV320D11N4B",      desc:"Variador Schneider ATV320 11kW tri",       marca:"Schneider Electric", familia:"Variadores y Arranque", specs:["11kW","400V tri","IP20","pantalla integrada"],            precio:"680-820€" },
  { ref:"ATV320D15N4B",      desc:"Variador Schneider ATV320 15kW tri",       marca:"Schneider Electric", familia:"Variadores y Arranque", specs:["15kW","400V tri","IP20"],                                precio:"850-1020€" },
  { ref:"ACS310-03E-07A5-4", desc:"Variador ABB ACS310 3kW 400V",            marca:"ABB",                familia:"Variadores y Arranque", specs:["3kW","400V tri","7.5A","IP20","panel básico"],            precio:"320-390€" },
  { ref:"ACS310-03E-17A2-4", desc:"Variador ABB ACS310 7.5kW 400V",          marca:"ABB",                familia:"Variadores y Arranque", specs:["7.5kW","400V tri","17.2A","IP20"],                       precio:"580-680€" },
  { ref:"ACS580-01-07A2-4",  desc:"Variador ABB ACS580 3kW con panel",       marca:"ABB",                familia:"Variadores y Arranque", specs:["3kW","400V tri","IP21","asistente arranque","Modbus"],    precio:"420-510€" },
  // PROTECCIÓN ELÉCTRICA
  { ref:"A9F74206",  desc:"iC60N Schneider 2P 6A curva C",     marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["2P","6A","curva C","6kA","IEC 60898"],  precio:"12-16€" },
  { ref:"A9F74210",  desc:"iC60N Schneider 2P 10A curva C",    marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["2P","10A","curva C","6kA"],             precio:"12-16€" },
  { ref:"A9F74216",  desc:"iC60N Schneider 2P 16A curva C",    marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["2P","16A","curva C","6kA"],             precio:"13-17€" },
  { ref:"A9F74316",  desc:"iC60N Schneider 3P 16A curva C",    marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["3P","16A","curva C","6kA"],             precio:"22-28€" },
  { ref:"A9F74332",  desc:"iC60N Schneider 3P 32A curva C",    marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["3P","32A","curva C","6kA"],             precio:"28-35€" },
  { ref:"A9F74363",  desc:"iC60N Schneider 3P 63A curva C",    marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["3P","63A","curva C","6kA"],             precio:"42-52€" },
  { ref:"A9R14225",  desc:"iID Schneider 2P 25A 30mA Tipo AC", marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["2P","25A","30mA","Tipo AC","IEC 61008"],precio:"28-35€" },
  { ref:"A9R14240",  desc:"iID Schneider 2P 40A 30mA Tipo AC", marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["2P","40A","30mA","Tipo AC"],            precio:"30-38€" },
  { ref:"A9R14440",  desc:"iID Schneider 4P 40A 30mA Tipo AC", marca:"Schneider Electric", familia:"Protección Eléctrica", specs:["4P","40A","30mA","Tipo AC"],            precio:"55-68€" },
  { ref:"MBN116",    desc:"Magnetotérmico Hager 1P+N 16A",     marca:"Hager",              familia:"Protección Eléctrica", specs:["1P+N","16A","curva C","6kA"],           precio:"14-18€" },
  { ref:"MBN120",    desc:"Magnetotérmico Hager 1P+N 20A",     marca:"Hager",              familia:"Protección Eléctrica", specs:["1P+N","20A","curva C","6kA"],           precio:"15-19€" },
  { ref:"CDN440D",   desc:"Diferencial Hager 4P 40A 30mA A",   marca:"Hager",              familia:"Protección Eléctrica", specs:["4P","40A","30mA","Tipo A"],             precio:"65-80€" },
  { ref:"S201M-C16", desc:"Magnetotérmico ABB S200 1P 16A",    marca:"ABB",                familia:"Protección Eléctrica", specs:["1P","16A","curva C","10kA","S200M"],    precio:"12-16€" },
  { ref:"S203M-C32", desc:"Magnetotérmico ABB S200 3P 32A",    marca:"ABB",                familia:"Protección Eléctrica", specs:["3P","32A","curva C","10kA"],            precio:"32-42€" },
  // CABLEADO
  { ref:"RVK 1X1.5",    desc:"Cable RVK 1x1.5mm² (metro)",        marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["1.5mm²","0.6/1kV","XLPE+PVC","90°C"],   precio:"0.5-0.7€/m" },
  { ref:"RVK 1X2.5",    desc:"Cable RVK 1x2.5mm² (metro)",        marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["2.5mm²","0.6/1kV","XLPE+PVC","90°C"],   precio:"0.8-1.1€/m" },
  { ref:"RVK 1X6",      desc:"Cable RVK 1x6mm² (metro)",          marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["6mm²","0.6/1kV","XLPE+PVC"],            precio:"1.8-2.4€/m" },
  { ref:"RVK 1X16",     desc:"Cable RVK 1x16mm² (metro)",         marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["16mm²","0.6/1kV","XLPE+PVC"],           precio:"4.2-5.5€/m" },
  { ref:"RVK 1X35",     desc:"Cable RVK 1x35mm² (metro)",         marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["35mm²","0.6/1kV","XLPE+PVC"],           precio:"8.5-11€/m" },
  { ref:"RVK 1X70",     desc:"Cable RVK 1x70mm² (metro)",         marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["70mm²","0.6/1kV","XLPE+PVC"],           precio:"16-21€/m" },
  { ref:"H07V-K 1.5",   desc:"Cable H07V-K 1x1.5mm² (metro)",     marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["1.5mm²","450/750V","PVC flexible"],     precio:"0.35-0.5€/m" },
  { ref:"H07V-K 2.5",   desc:"Cable H07V-K 1x2.5mm² (metro)",     marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["2.5mm²","450/750V","PVC flexible"],     precio:"0.55-0.75€/m" },
  { ref:"H07V-K 4",     desc:"Cable H07V-K 1x4mm² (metro)",       marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["4mm²","450/750V","PVC flexible"],       precio:"0.85-1.1€/m" },
  { ref:"MANGUERA 3G1.5",desc:"Manguera H05VV-F 3G1.5mm² (metro)",marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["3 cond.","1.5mm²","300/500V"],          precio:"0.9-1.2€/m" },
  { ref:"MANGUERA 5G2.5",desc:"Manguera H05VV-F 5G2.5mm² (metro)",marca:"Prysmian", familia:"Cableado y Canalizaciones", specs:["5 cond.","2.5mm²","300/500V"],          precio:"2.2-2.8€/m" },
  // VEHÍCULO ELÉCTRICO
  { ref:"EVL1S3P0A",    desc:"EVlink Smart 7.4kW mono Schneider",    marca:"Schneider Electric", familia:"Vehículo Eléctrico", specs:["7.4kW","230V mono","32A","Modo 3","IP54","cable 4.5m T2"], precio:"480-580€" },
  { ref:"EVH2S22P0AK",  desc:"EVlink Home 22kW tri Schneider",       marca:"Schneider Electric", familia:"Vehículo Eléctrico", specs:["22kW","400V tri","32A","Modo 3","IP55","T2"],              precio:"680-820€" },
  { ref:"EVB1A22PCSS",  desc:"EVlink Business 2x22kW doble toma",    marca:"Schneider Electric", familia:"Vehículo Eléctrico", specs:["2×22kW","400V tri","IP55","RFID","OCPP"],                 precio:"1850-2200€" },
  { ref:"W22G-MC-1-1-T2-5",  desc:"Wallbox Pulsar Plus 7.4kW",       marca:"Wallbox",            familia:"Vehículo Eléctrico", specs:["7.4kW mono","32A","Modo 3","IP54","WiFi+BT","App"],      precio:"420-500€" },
  { ref:"CMX2-2-SOCKET",     desc:"Wallbox Commander 2 22kW pantalla",marca:"Wallbox",            familia:"Vehículo Eléctrico", specs:["22kW tri","32A","pantalla 5\" táctil","RFID","OCPP"],    precio:"1200-1450€" },
  { ref:"EVE200WS",          desc:"ABB Terra 7kW monofásico",         marca:"ABB",                familia:"Vehículo Eléctrico", specs:["7kW mono","32A","Modo 3","IP55","T2"],                   precio:"520-620€" },
  // ENERGÍAS RENOVABLES
  { ref:"SYMO-3.0-3-M",     desc:"Fronius Symo 3kW trifásico",      marca:"Fronius",        familia:"Energías Renovables", specs:["3kW","trifásico","2 MPPT","98%","Wi-Fi integrado"],     precio:"980-1180€" },
  { ref:"SYMO-5.0-3-M",     desc:"Fronius Symo 5kW trifásico",      marca:"Fronius",        familia:"Energías Renovables", specs:["5kW","trifásico","2 MPPT","98.1%","Solar.web"],          precio:"1250-1500€" },
  { ref:"SYMO-8.2-3-M",     desc:"Fronius Symo 8.2kW trifásico",    marca:"Fronius",        familia:"Energías Renovables", specs:["8.2kW","trifásico","2 MPPT","98.3%"],                   precio:"1650-1950€" },
  { ref:"SB3.0-1AV-41",     desc:"SMA Sunny Boy 3kW monofásico",    marca:"SMA",            familia:"Energías Renovables", specs:["3kW mono","1 MPPT","97.2%","ShadeFix"],                 precio:"850-1050€" },
  { ref:"PYLONTECH-US3000",  desc:"Batería Pylontech US3000 3.5kWh", marca:"Pylontech",      familia:"Energías Renovables", specs:["3.5kWh","LiFePO4","48V","BMS integrado","apilable"],    precio:"1400-1700€" },
  { ref:"VICTRON-MPPT100/30",desc:"Victron SmartSolar MPPT 100/30",  marca:"Victron Energy", familia:"Energías Renovables", specs:["Voc 100V","30A","12/24/48V auto","Bluetooth"],           precio:"145-175€" },
  // ILUMINACIÓN
  { ref:"CoreLine-Led-G4",  desc:"Philips CoreLine Panel LED 36W 4000K", marca:"Philips",  familia:"Iluminación", specs:["36W","4000K","3400lm","IP44","600x600mm"],      precio:"65-85€" },
  { ref:"WT120C-LED36",     desc:"Philips WT120C LED 36W IP65 nave",     marca:"Philips",  familia:"Iluminación", specs:["36W","4000K","4000lm","IP65","industrial"],      precio:"88-110€" },
  { ref:"BY120P-G4-LED105", desc:"Philips BY120P LED 105W highbay",      marca:"Philips",  familia:"Iluminación", specs:["105W","4000K","12000lm","IP65","highbay"],       precio:"210-260€" },
  { ref:"LEDVANCE-T8-18W",  desc:"Ledvance SubstiTUBE T8 LED 18W 1200mm",marca:"Ledvance",familia:"Iluminación", specs:["18W","4000K","2000lm","1200mm","driver externo"],precio:"12-16€" },
  { ref:"ZEMPER-LED-EM",    desc:"Zemper bloque autónomo LED emergencia",  marca:"Zemper", familia:"Iluminación", specs:["1h autonomía","LED","autotest","IP42"],          precio:"35-45€" },
  // PLC Y AUTOMATIZACIÓN
  { ref:"M221CE16R",      desc:"PLC Schneider Modicon M221 16 E/S relé",  marca:"Schneider Electric", familia:"PLC y Automatización", specs:["16 E/S","8DI+8DO relé","Modbus RTU","CANopen"],precio:"285-345€" },
  { ref:"TM221CE24R",     desc:"PLC Schneider TM221 24 E/S Ethernet",     marca:"Schneider Electric", familia:"PLC y Automatización", specs:["24 E/S","14DI+10DO relé","Ethernet","USB"],    precio:"380-460€" },
  { ref:"SIEMENS-LOGO-12",desc:"Módulo lógico Siemens LOGO! 12/24RC",     marca:"Siemens",            familia:"PLC y Automatización", specs:["12/24V DC/AC","8DI","4DO relé","pantalla"],    precio:"155-190€" },
  { ref:"XB5AA31",        desc:"Pulsador Schneider NA 22mm verde",         marca:"Schneider Electric", familia:"PLC y Automatización", specs:["22mm","contacto NA","verde","IP65","XB5"],    precio:"8-11€" },
  { ref:"XB5AT42",        desc:"Pulsador seta emergencia NC 22mm rojo",    marca:"Schneider Electric", familia:"PLC y Automatización", specs:["22mm","seta NC","rojo","IP65","giro desbloqueo"],precio:"18-22€" },
  // HVAC
  { ref:"ACS355-03E-07A3-4",desc:"Variador ABB ACS355 3kW HVAC",   marca:"ABB", familia:"HVAC y Climatización", specs:["3kW","400V tri","PID integrado","IP20","HVAC optimizado"],precio:"340-420€" },
  { ref:"ACS355-03E-15A6-4",desc:"Variador ABB ACS355 7.5kW HVAC", marca:"ABB", familia:"HVAC y Climatización", specs:["7.5kW","400V tri","PID+BACnet opcional","IP20"],           precio:"620-750€" },
  // HERRAMIENTAS TRADEFORCE
  { ref:"TF-TESTKIP100", desc:"Tester aislamiento TradeForce 1000V",      marca:"TradeForce", familia:"Seguridad y Herramientas", specs:["prueba hasta 1000V","rango MΩ","continuidad","IEC 61557"],precio:"95-115€" },
  { ref:"TF-CLAMP600",   desc:"Pinza amperimétrica TradeForce TRMS 600A", marca:"TradeForce", familia:"Seguridad y Herramientas", specs:["600A AC","TRMS","600V CAT III","armónicos"],             precio:"68-85€" },
  { ref:"TF-MULTID1000", desc:"Multímetro TradeForce TRMS 1000V CAT III", marca:"TradeForce", familia:"Seguridad y Herramientas", specs:["1000V CAT III","TRMS","continuidad","diodo","frec."],   precio:"48-62€" },
];

// ── Helpers de catálogo ────────────────────────────────────────────────────
const KEYWORDS = [
  { f:"Protección y Maniobra",    k:["contactor","relé","guardamotor","bobina","af09","af16","lc1d","ms116","gv2","tesys","maniobra"] },
  { f:"Variadores y Arranque",    k:["variador","atv","acs","sinamics","vfd","arrancador","inverter","frecuencia","altivar"] },
  { f:"PLC y Automatización",     k:["plc","autómata","modicon","s7","simatic","logo","hmi","scada","sensor inductivo","encoder","m221"] },
  { f:"Iluminación",              k:["luminaria","led","downlight","alumbrado","proyector","lámpara","philips","ledvance","disano","emergencia"] },
  { f:"Cableado y Canalizaciones",k:["cable","sección","bandeja","tubo","rvk","xlpe","h07v","pvc","canaleta","manguera","prysmian"] },
  { f:"Protección Eléctrica",     k:["diferencial","magnetotérmico","iga","icp","interruptor automático","rccb","mcb","ic60","hager","a9f","a9r","fusible"] },
  { f:"Vehículo Eléctrico",       k:["vehículo eléctrico","recarga","carga ve","evlink","wallbox","punto de carga","modo 3","tipo 2"] },
  { f:"Energías Renovables",      k:["solar","fotovoltaica","inversor string","batería","fronius","sma","sunny","pylontech","victron","panel solar"] },
  { f:"HVAC y Climatización",     k:["hvac","climatización","bomba calor","ventilador","acs355","fan coil","presostato","termostato industrial"] },
  { f:"Seguridad y Herramientas", k:["tester","multímetro","pinza amperimétrica","medidor","tradeforce","epi","casco","guantes dieléctricos"] },
];

function detectarFamilia(texto) {
  const t = texto.toLowerCase();
  for (const { f, k } of KEYWORDS) {
    if (k.some(kw => t.includes(kw))) return f;
  }
  return null;
}

// ── Detección automática de modo ──────────────────────────────────────────
const MODO_KEYWORDS = {
  averia:      ["fallo","error","no arranca","no funciona","dispara","salta","avería","quemado","ohf","sc","ot","falla","no responde","alarma"],
  seleccion:   ["qué variador","qué contactor","qué cable","qué guardamotor","qué diferencial","necesito","recomienda","cuál","selección","para un motor","para una bomba"],
  normas:      ["normativa","norma","rebt","itc-bt","iec","une","reglamento","obligatorio","mínimo por norma","cumplir","certificación","legalmente"],
  residencial: ["vivienda","piso","apartamento","doméstico","hogar","casa","electrificación básica","circuito mínimo","cocina","termo"],
  comparativa: [" vs "," versus ","compara","diferencia entre","cuál es mejor","mejor entre"],
};

function detectarModoAuto(texto) {
  const t = texto.toLowerCase();
  for (const [modo, kws] of Object.entries(MODO_KEYWORDS)) {
    if (kws.some(kw => t.includes(kw))) return modo;
  }
  return null;
}

// ── Verificador de referencias ────────────────────────────────────────────
function verificarRefs(texto) {
  const refsEncontradas = [];
  CATALOGO.forEach(p => {
    const refLower = p.ref.toLowerCase();
    if (texto.toLowerCase().includes(refLower)) {
      refsEncontradas.push(p);
    }
  });
  return refsEncontradas;
}

// ── Contexto de productos para el prompt ─────────────────────────────────
function contextoProductos(familia) {
  if (!familia) return "";
  const prods = CATALOGO.filter(p => p.familia === familia).slice(0, 12);
  if (prods.length === 0) return "";
  const lineas = prods.map(p => `- ${p.ref} | ${p.desc} | ${p.specs.join(", ")} | Precio orientativo: ${p.precio}`).join("\n");
  return `\n\nPRODUCTOS SONEPAR A CORUÑA — ${familia.toUpperCase()} (stock habitual):\n${lineas}\nUsa estas referencias cuando recomiendes producto de esta familia. Confirma siempre que precio y disponibilidad se verifican en el sistema de la delegación.`;
}

// ── System prompt y modos ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres SONEX, el asistente técnico de Sonepar España en la delegación de A Coruña. Actúas como un técnico de mostrador senior con 15 años de experiencia en Sonepar, especializado en material eléctrico e industrial para instaladores, contratistas y mantenedores.

QUIÉN ERES:
- Técnico de mostrador de Sonepar España, delegación A Coruña
- Conoces el portfolio completo: protección y maniobra, variadores, automatización, iluminación, cableado, protección eléctrica, VE, energías renovables, HVAC y herramientas TradeForce
- Recomiendas ÚNICAMENTE marcas que Sonepar distribuye

MARCAS POR FAMILIA:
- Protección y Maniobra: ABB (AF/MS), Schneider (TeSys D/GV2), Hager, Eaton
- Variadores: Schneider (ATV320), ABB (ACS310/ACS580), Siemens (SINAMICS G120), Danfoss
- PLC/Automatización: Schneider (M221/TM221), Siemens LOGO!, ABB AC500
- Iluminación: Philips (CoreLine/WT), Ledvance, Disano, Zemper
- Cableado: Prysmian (RVK/H07V-K), Nexans, OBO Bettermann, Legrand
- Protección Eléctrica: Schneider (iC60N/iID), Hager (MBN/CDN), ABB (S200M), Eaton
- Vehículo Eléctrico: Schneider (EVlink), Wallbox (Pulsar/Commander), ABB Terra
- Energías Renovables: Fronius, SMA, Pylontech, Victron Energy
- HVAC: ABB (ACS355), Siemens LOGO!, Schneider Electric
- Herramientas: TradeForce (marca exclusiva Sonepar), Fluke, Testo

ESTRUCTURA DE RESPUESTA:
Avería: Causa probable → Verificaciones → Solución → Prevención → Consejo práctico
Selección: Confirmar parámetros → Recomendación con ref → Argumentación técnica → ALTERNATIVA
Normativa: Norma exacta (IEC/UNE/RD/ITC-BT) → Requisito concreto → Aplicación → Nota práctica
Residencial: ITC-BT aplicable → Requisito REBT → Producto Sonepar → Lo que más se pide

NORMAS: Respuestas concretas y directas. Si falta dato clave, pídelo antes. Vocabulario de mostrador, no manual técnico. Nunca inventes referencias — si no la tienes exacta, descríbela.

Al final de cada respuesta incluye ÚNICAMENTE en la última línea:
[CONFIANZA:X] donde X es 1 (baja — verificar con fabricante), 2 (media — orientativo), 3 (alta — dato contrastado)`;

const MODOS = [
  { id:"general",     label:"General",    icon:"◎", desc:"Cualquier consulta técnica" },
  { id:"averia",      label:"Avería",      icon:"⚡", desc:"Diagnóstico de fallos" },
  { id:"seleccion",   label:"Selección",   icon:"✓", desc:"Elegir el producto correcto" },
  { id:"normas",      label:"Normativa",   icon:"§", desc:"IEC, UNE, reglamentos" },
  { id:"residencial", label:"Residencial", icon:"⌂", desc:"Instalaciones domésticas" },
  { id:"comparativa", label:"Comparativa", icon:"⇄", desc:"Comparar referencias" },
];

const PROMPT_MODO = {
  general:     "",
  averia:      "\n\nMODO AVERÍA ACTIVO: El cliente tiene un equipo con fallo. Aplica siempre la estructura: Causa probable → Verificaciones → Solución → Prevención → Consejo práctico. Sé directo — el cliente está delante del equipo.",
  seleccion:   "\n\nMODO SELECCIÓN ACTIVO: El cliente necesita elegir un producto. Confirma los parámetros clave si faltan. Recomienda siempre marca Sonepar con argumentación técnica. Termina siempre con una sección 'ALTERNATIVA:' indicando otro producto del portfolio Sonepar.",
  normas:      "\n\nMODO NORMATIVA ACTIVO: Cita siempre la norma exacta (IEC, UNE, RD, ITC-BT con número y apartado). Explica el requisito concreto y cómo aplica al caso.",
  residencial: "\n\nMODO RESIDENCIAL ACTIVO: Instalación doméstica. Usa vocabulario REBT/ITC-BT. Referencia el ITC-BT aplicable. Recomienda productos Sonepar (Hager, Legrand, Schneider, Simon).",
  comparativa: "\n\nMODO COMPARATIVA ACTIVO: Devuelve una tabla comparativa con mínimo 5 parámetros técnicos relevantes:\n\nPARÁMETRO          | PRODUCTO A        | PRODUCTO B\n-------------------+-------------------+-------------------\n[parámetro 1]      | [valor A]         | [valor B]\n\nAl final: RECOMENDACIÓN: [cuál elegir y por qué en una frase].",
};

const SUGERENCIAS = {
  general:     ["¿Diferencia entre contactor y relé de maniobra?","El ATV320 da fallo OHF, ¿qué significa?","¿Sección de cable para motor de 11kW a 400V?","¿Normativa para instalaciones de carga de VE?","¿Cómo selecciono el guardamotor correcto para un 7.5kW?"],
  averia:      ["Contactor ABB AF09 no cierra. Piloto de bobina enciende pero contactos no cierran.","Variador da OHF en arranque aunque la temperatura ambiente es normal.","Motor trifásico vibra y consume más amperios de lo normal.","Diferencial salta al conectar la bomba pero no hay fallo de aislamiento.","PLC no reconoce señal del sensor de proximidad aunque hay tensión."],
  seleccion:   ["Guardamotor para motor de 7.5kW, 400V, arranque directo.","¿Qué variador para bomba de 15kW con control de presión?","Diferencial para tomas de corriente en nave industrial.","Contactor para motor de 22kW con inversión de giro.","Cable para bandeja en exterior, 6mm², 50 metros."],
  normas:      ["¿Normativa para recarga de VE en garaje comunitario?","Grado de protección mínimo para cuadro en exterior.","Sección mínima para instalación trifásica 22kW a 30 metros.","¿Qué dice el REBT sobre circuitos mínimos en vivienda?","Normativa para instalación de paneles solares en cubierta."],
  residencial: ["¿Circuitos mínimos en vivienda de electrificación básica?","¿Diferencial para el circuito del termo eléctrico?","¿Sección de cable para circuito de cocina y horno?","¿Punto de recarga VE para garaje de vivienda unifamiliar?","¿Cuántos puntos de luz puede tener un circuito de iluminación?"],
  comparativa: ["Contactor ABB AF09 vs Schneider LC1D09.","Variador ATV320 vs ABB ACS310 para bomba de 7.5kW.","Diferencial Schneider iID 4P 40A 30mA vs Hager CDN440D.","Guardamotor ABB MS116-16 vs Schneider GV2ME16 para 7.5kW.","Cable RVK vs H07V-K para instalación en bandeja interior."],
};

// ── Helpers de estado ─────────────────────────────────────────────────────
const CONV_NUEVA = (id) => ({ id, nombre: "Nueva conversación", mensajes: [], ts: Date.now() });

function guardarStat({ modo, confianza, familia }) {
  try {
    const stats = JSON.parse(localStorage.getItem("sonepar_sonex_stats") || "[]");
    stats.push({ ts: Date.now(), modo, confianza, familia });
    if (stats.length > 200) stats.splice(0, stats.length - 200);
    localStorage.setItem("sonepar_sonex_stats", JSON.stringify(stats));
  } catch {}
}

function leerStats() {
  try { return JSON.parse(localStorage.getItem("sonepar_sonex_stats") || "[]"); } catch { return []; }
}

function parseConfianza(t) { const m = t.match(/\[CONFIANZA:(\d)\]/); return m ? parseInt(m[1]) : null; }
function limpiarConfianza(t) { return t.replace(/\[CONFIANZA:\d\]\s*$/, "").trimEnd(); }

// ── Render de texto enriquecido ───────────────────────────────────────────
function renderNeg(texto) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ color: C.texto, fontWeight: "600" }}>{p.slice(2, -2)}</strong> : p
  );
}

function RenderTexto({ texto }) {
  return (
    <div style={{ fontSize: "14px", lineHeight: "1.65", color: C.texto }}>
      {texto.split("\n").map((ln, i) => {
        if (/^\d+[\.]\s/.test(ln)) return (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
            <span style={{ color: C.azulClaro, fontFamily: "monospace", fontSize: "12px", flexShrink: 0, minWidth: "18px", paddingTop: "1px" }}>{ln.match(/^\d+/)[0]}.</span>
            <span>{renderNeg(ln.replace(/^\d+[\.]\s/, ""))}</span>
          </div>
        );
        if (/^[-–•]\s/.test(ln)) return (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "4px", paddingLeft: "6px" }}>
            <span style={{ color: C.azulClaro, flexShrink: 0, fontSize: "12px" }}>—</span>
            <span>{renderNeg(ln.replace(/^[-–•]\s/, ""))}</span>
          </div>
        );
        if (/^[-+|]+$/.test(ln.replace(/\s/g, ""))) return <div key={i} style={{ borderBottom: `1px solid ${C.borde}`, margin: "3px 0" }} />;
        if (ln.includes("|") && ln.trim()) {
          const cells = ln.split("|").map(c => c.trim()).filter(Boolean);
          if (cells.length >= 2) return (
            <div key={i} style={{ display: "flex", marginBottom: "1px", fontFamily: "monospace", fontSize: "11px", borderBottom: `1px solid ${C.borde}` }}>
              {cells.map((c, j) => <span key={j} style={{ flex: 1, padding: "3px 8px", borderRight: j < cells.length - 1 ? `1px solid ${C.borde}` : "none", color: j === 0 ? C.textoSec : C.texto, background: j === 0 ? C.fondo : "transparent" }}>{c}</span>)}
            </div>
          );
        }
        if (/^[A-ZÁÉÍÓÚ][^:]+:\s*$/.test(ln) || /^[A-ZÁÉÍÓÚ ]{4,}:/.test(ln))
          return <div key={i} style={{ fontWeight: "600", color: C.azulMedio, marginTop: i > 0 ? "12px" : "0", marginBottom: "4px", fontSize: "13px" }}>{ln}</div>;
        if (!ln.trim()) return <div key={i} style={{ height: "7px" }} />;
        return <div key={i} style={{ marginBottom: "3px" }}>{renderNeg(ln)}</div>;
      })}
    </div>
  );
}

function Badge({ nivel }) {
  if (!nivel) return null;
  const m = { 3: { l: "Alta confianza", c: C.verde, bg: C.verdeSuave }, 2: { l: "Confianza media", c: C.amarillo, bg: C.amarilloS }, 1: { l: "Verificar", c: C.rojo, bg: C.rojoSuave } }[nivel];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", background: m.bg, color: m.c, fontSize: "10px", fontWeight: "600", borderRadius: "3px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: m.c, flexShrink: 0 }} />{m.l}
    </span>
  );
}

// ── Componente tarjeta de referencia verificada ───────────────────────────
function RefCard({ prod }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 10px", background: C.verdeSuave, border: `1px solid ${C.verde}30`, borderRadius: "6px", margin: "2px" }}>
      <span style={{ fontSize: "10px", fontWeight: "700", color: C.verde }}>✓</span>
      <div>
        <div style={{ fontSize: "11px", fontWeight: "700", color: C.texto }}>{prod.ref}</div>
        <div style={{ fontSize: "10px", color: C.textoTer }}>{prod.desc} · {prod.precio}</div>
      </div>
    </div>
  );
}

// ── Componente principal SONEX ────────────────────────────────────────────
export default function Sonex() {
  const [convs, setConvs]               = useState([]);
  const [activa, setActiva]             = useState(null);
  const [input, setInput]               = useState("");
  const [cargando, setCargando]         = useState(false);
  const [streamText, setStreamText]     = useState("");  // texto en streaming
  const [modo, setModo]                 = useState("general");
  const [modoDetectado, setModoDetectado] = useState(null); // modo auto-detectado
  const [sidebar, setSidebar]           = useState(true);
  const [toast, setToast]               = useState("");
  const [rapido, setRapido]             = useState(false);
  const [respRapida, setRespRapida]     = useState("");
  const [cargRap, setCargRap]           = useState(false);
  const [inputRap, setInputRap]         = useState("");
  const [verStats, setVerStats]         = useState(false);
  const [busq, setBusq]                 = useState("");
  const [refsTurno, setRefsTurno]       = useState([]); // refs detectadas en la sesión
  const [verConfig, setVerConfig]       = useState(false); // panel configurador multi-turno
  const [configTurno, setConfigTurno]   = useState({ instalacion: "", potencia: "", tension: "", notas: "" });
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Cargar datos
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_sonex_conversaciones");
      if (saved) {
        const cs = JSON.parse(saved);
        setConvs(cs);
        if (cs.length > 0) setActiva(cs[0].id);
      } else {
        const init = CONV_NUEVA("c0");
        setConvs([init]); setActiva("c0");
      }
    } catch {
      const init = CONV_NUEVA("c0");
      setConvs([init]); setActiva("c0");
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convs, activa, streamText]);

  const save = (cs) => { try { localStorage.setItem("sonepar_sonex_conversaciones", JSON.stringify(cs)); } catch {} };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const conv   = convs.find(c => c.id === activa);
  const msgs   = conv?.mensajes || [];
  const LIMITE = 20;
  const limitado    = msgs.filter(m => m.rol === "user").length >= LIMITE;
  const modoObj     = MODOS.find(m => m.id === modo);
  const sugs        = SUGERENCIAS[modo] || SUGERENCIAS.general;
  const convsFilt   = busq.trim() ? convs.filter(c => c.nombre.toLowerCase().includes(busq.toLowerCase())) : convs;
  const puedeEscalar = msgs.filter(m => m.rol === "user").length >= 2;

  const systemFinal = (fam) => {
    let sys = SYSTEM_PROMPT + (PROMPT_MODO[modo] || "") + contextoProductos(fam);
    if (configTurno.instalacion || configTurno.potencia) {
      sys += `\n\nCONTEXTO DEL TURNO (proporcionado por el técnico):\n`;
      if (configTurno.instalacion) sys += `- Tipo de instalación: ${configTurno.instalacion}\n`;
      if (configTurno.potencia)    sys += `- Potencia: ${configTurno.potencia}\n`;
      if (configTurno.tension)     sys += `- Tensión: ${configTurno.tension}\n`;
      if (configTurno.notas)       sys += `- Notas adicionales: ${configTurno.notas}\n`;
      sys += "Usa este contexto para todas las respuestas de la conversación.";
    }
    return sys;
  };

  // ── Enviar con streaming visual (simulado) ────────────────────────────
  const enviar = useCallback(async (override) => {
    const texto = (override || input).trim();
    if (!texto || cargando || limitado) return;
    setInput("");

    // Detección automática de modo
    const modoAuto = detectarModoAuto(texto);
    if (modoAuto && modoAuto !== modo) {
      setModoDetectado(modoAuto);
    } else {
      setModoDetectado(null);
    }

    // Detectar refs en la pregunta
    const refsQ = verificarRefs(texto);
    if (refsQ.length > 0) {
      setRefsTurno(prev => {
        const nuevas = refsQ.filter(r => !prev.some(p => p.ref === r.ref));
        return [...prev, ...nuevas];
      });
    }

    const mu = { rol: "user", texto, ts: Date.now() };
    const hist = [...msgs, mu];
    let nombre = conv?.nombre || "Nueva conversación";
    if (msgs.length === 0) nombre = texto.slice(0, 45) + (texto.length > 45 ? "…" : "");

    const nc = convs.map(c => c.id === activa ? { ...c, nombre, mensajes: hist } : c);
    setConvs(nc); save(nc);
    setCargando(true);
    setStreamText("");

    const modoFinal = modoAuto || modo;
    const fam = detectarFamilia(texto);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: systemFinal(fam),
          messages: hist.map(m => ({ role: m.rol === "user" ? "user" : "assistant", content: m.texto })),
        }),
      });
      const data = await res.json();
      const respCompleta = data.content?.map(i => i.text || "").join("") || "";

      // Streaming visual: reveal carácter a carácter
      let idx = 0;
      const intervalo = setInterval(() => {
        idx += Math.floor(Math.random() * 8) + 4; // 4-11 chars por tick
        if (idx >= respCompleta.length) {
          idx = respCompleta.length;
          clearInterval(intervalo);
          // Guardar mensaje completo
          const conf = parseConfianza(respCompleta);
          const refsR = verificarRefs(respCompleta);
          if (refsR.length > 0) {
            setRefsTurno(prev => {
              const nuevas = refsR.filter(r => !prev.some(p => p.ref === r.ref));
              return [...prev, ...nuevas];
            });
          }
          const mb = { rol: "bot", texto: limpiarConfianza(respCompleta), confianza: conf, familia: fam, refs: refsR, ts: Date.now() };
          guardarStat({ modo: modoFinal, confianza: conf, familia: fam });
          const cf = [...hist, mb];
          const nf = convs.map(c => c.id === activa ? { ...c, nombre, mensajes: cf } : c);
          setConvs(nf); save(nf);
          setStreamText("");
          setCargando(false);
          setModoDetectado(null);
        } else {
          setStreamText(respCompleta.slice(0, idx));
        }
      }, 18);
    } catch {
      const err = { rol: "bot", texto: "Error de conexión. Inténtalo de nuevo.", confianza: null, ts: Date.now() };
      const ne = convs.map(c => c.id === activa ? { ...c, mensajes: [...hist, err] } : c);
      setConvs(ne); save(ne);
      setStreamText("");
      setCargando(false);
    }
  }, [input, cargando, limitado, msgs, conv, convs, activa, modo, configTurno]);

  const consultaRapida = async () => {
    const texto = inputRap.trim();
    if (!texto || cargRap) return;
    setCargRap(true); setRespRapida("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 400,
          system: SYSTEM_PROMPT + "\n\nResponde en máximo 3 frases. Ve directo al dato. Sin estructura ni encabezados.",
          messages: [{ role: "user", content: texto }],
        }),
      });
      const data = await res.json();
      setRespRapida(limpiarConfianza(data.content?.map(i => i.text || "").join("") || ""));
    } catch { setRespRapida("Error de conexión."); }
    setCargRap(false);
  };

  const nuevaConv = () => {
    const id = `c${Date.now()}`, n = CONV_NUEVA(id);
    const ns = [n, ...convs].slice(0, 10);
    setConvs(ns); setActiva(id); save(ns);
    setRefsTurno([]); setModoDetectado(null);
  };

  const borrarConv = (id) => {
    const ns = convs.filter(c => c.id !== id);
    if (ns.length === 0) { const i = CONV_NUEVA("c_new"); setConvs([i]); setActiva("c_new"); save([i]); }
    else { setConvs(ns); if (activa === id) setActiva(ns[0].id); save(ns); }
  };

  const copiar = (t) => navigator.clipboard.writeText(t).then(() => showToast("Copiado al portapapeles"));

  const exportarPDF = () => {
    if (!conv || msgs.length === 0) return;
    // Abrir ventana para imprimir
    const ventana = window.open("", "_blank");
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>SONEX — ${conv.nombre}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1A1A2E; max-width: 800px; margin: 40px auto; padding: 0 20px; }
  h1 { color: #003087; font-size: 18px; border-bottom: 3px solid #4A90D9; padding-bottom: 8px; }
  .meta { color: #8A94A6; font-size: 10px; margin-bottom: 24px; }
  .msg { margin-bottom: 18px; }
  .msg-user { background: #EBF1FA; padding: 10px 14px; border-left: 3px solid #003087; border-radius: 0 6px 6px 0; }
  .msg-bot { background: #F5F6F8; padding: 10px 14px; border-left: 3px solid #4A90D9; border-radius: 0 6px 6px 0; }
  .label { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #8A94A6; text-transform: uppercase; margin-bottom: 4px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #D1D9E6; font-size: 10px; color: #8A94A6; }
  pre { white-space: pre-wrap; word-wrap: break-word; }
</style>
</head>
<body>
<h1>SONEX · Asistente Técnico Sonepar</h1>
<div class="meta">
  Conversación: ${conv.nombre}<br>
  Modo: ${modoObj?.label} · Fecha: ${new Date().toLocaleString("es-ES")}<br>
  Consultas: ${msgs.filter(m => m.rol === "user").length}
</div>
${msgs.map(m => `
<div class="msg">
  <div class="label">${m.rol === "user" ? "Técnico" : "SONEX"} · ${new Date(m.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
  <div class="msg-${m.rol}"><pre>${m.texto}</pre></div>
</div>`).join("")}
<div class="footer">⚠ Documento generado por SONEX — prototipo de apoyo al mostrador. Verificar con catálogo Sonepar y documentación del fabricante antes de cualquier pedido o instalación.</div>
</body>
</html>`;
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
    showToast("Abriendo diálogo de impresión/PDF…");
  };

  const escalar = () => {
    const ub = [...msgs].reverse().find(m => m.rol === "bot");
    const uu = [...msgs].reverse().find(m => m.rol === "user");
    const cl = ub?.confianza === 1 ? "Baja" : ub?.confianza === 2 ? "Media" : "Alta";
    const txt = `ESCALADO SONEX — ${new Date().toLocaleString("es-ES")}\nModo: ${modoObj?.label} | Confianza: ${cl}\n\nÚLTIMA PREGUNTA:\n${uu?.texto || ""}\n\nÚLTIMA RESPUESTA:\n${ub?.texto || ""}\n\nSolicito revisión por técnico senior.`;
    navigator.clipboard.writeText(txt).then(() => showToast("Escalado copiado al portapapeles"));
  };

  const guardarConvTxt = () => {
    if (!conv || msgs.length === 0) return;
    const lineas = [`CONVERSACIÓN SONEX — ${new Date().toLocaleString("es-ES")}`, `Modo: ${modoObj?.label}`, `Consultas: ${msgs.filter(m => m.rol === "user").length}`, "═".repeat(60), ""];
    msgs.forEach(m => {
      const h = new Date(m.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      if (m.rol === "user") { lineas.push(`[${h}] TÉCNICO:`); lineas.push(m.texto); }
      else { const c = m.confianza === 3 ? "Alta" : m.confianza === 2 ? "Media" : m.confianza === 1 ? "Baja" : "—"; lineas.push(`[${h}] SONEX (Confianza: ${c}${m.familia ? ` · ${m.familia}` : ""}):`) ; lineas.push(m.texto); }
      lineas.push("");
    });
    lineas.push("─".repeat(60)); lineas.push("⚠ Verificar con documentación del fabricante y catálogo Sonepar antes de cualquier pedido o instalación.");
    const blob = new Blob([lineas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = `SONEX-${conv.nombre.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
    showToast("Conversación descargada (.txt)");
  };

  const stats = (() => {
    const s = leerStats(); if (s.length === 0) return null;
    const total = s.length, alta = s.filter(x => x.confianza === 3).length, baja = s.filter(x => x.confianza === 1).length;
    const mc = {}, fc = {};
    s.forEach(x => { mc[x.modo] = (mc[x.modo] || 0) + 1; });
    s.filter(x => x.familia).forEach(x => { fc[x.familia] = (fc[x.familia] || 0) + 1; });
    const mt = Object.entries(mc).sort((a, b) => b[1] - a[1])[0];
    const ft = Object.entries(fc).sort((a, b) => b[1] - a[1])[0];
    return { total, pA: Math.round(alta / total * 100), pB: Math.round(baja / total * 100), mT: mt?.[0], fT: ft?.[0] };
  })();

  const B = (bg = C.azulOscuro, outline = false) => ({
    padding: "7px 15px", fontSize: "11px", fontWeight: "600",
    fontFamily: "system-ui, Arial, sans-serif",
    background: outline ? "transparent" : bg,
    color: outline ? bg : C.blanco,
    border: `1px solid ${bg}`, cursor: "pointer", borderRadius: "4px",
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${C.fondo}; }
        ::-webkit-scrollbar-thumb { background: ${C.borde}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.azulClaro}; }
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8);} 50%{opacity:1;transform:scale(1.1);} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px);} to{opacity:1;transform:translateY(0);} }
        @keyframes cursor-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        textarea:focus, input:focus { outline: none; border-color: ${C.azulClaro}!important; box-shadow: 0 0 0 3px rgba(74,144,217,.12); }
        button:hover { opacity: .85; }
        button:active { opacity: .7; }
        .conv-item:hover { background: ${C.fondo}!important; }
        .sug-btn:hover { border-color: ${C.azulClaro}!important; background: ${C.azulSuave}!important; }
        .modo-btn:hover { background: ${C.azulSuave}!important; }
        .streaming-cursor::after { content: '▌'; animation: cursor-blink 0.7s step-end infinite; color: ${C.azulClaro}; margin-left: 1px; font-size: 13px; }
        @media (max-width: 768px) {
          .sidebar-panel { display: none !important; }
          .sidebar-panel.open { display: flex !important; position: fixed; left: 0; top: 0; bottom: 0; z-index: 100; box-shadow: 4px 0 20px rgba(0,0,0,.15); }
          .chat-area { width: 100% !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: C.azulOscuro, color: C.blanco, padding: "11px 20px", fontSize: "13px", fontWeight: "500", zIndex: 9999, borderRadius: "6px", boxShadow: "0 4px 20px rgba(0,48,135,.3)", animation: "fadeIn .2s ease" }}>
          {toast}
        </div>
      )}

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.fondo, fontFamily: "system-ui,-apple-system,'Segoe UI',Arial,sans-serif", color: C.texto }}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{ background: C.azulOscuro, padding: "0 16px 0 12px", display: "flex", alignItems: "center", gap: "12px", height: "56px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,48,135,.25)" }}>
          <button onClick={() => setSidebar(!sidebar)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", padding: "6px 8px", fontSize: "18px", borderRadius: "4px" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderRight: "1px solid rgba(255,255,255,.15)", paddingRight: "14px" }}>
            <LogoSonepar size={20} color={C.blanco} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
            <span style={{ color: C.blanco, fontSize: "16px", fontWeight: "700", letterSpacing: ".3px" }}>SONEX</span>
            <span style={{ color: "rgba(255,255,255,.35)", fontSize: "13px" }}>·</span>
            <span style={{ color: "rgba(255,255,255,.5)", fontSize: "12px", whiteSpace: "nowrap" }}>Asistente Técnico · A Coruña</span>
            <span style={{ color: "rgba(255,255,255,.25)", fontSize: "11px" }}>v7</span>
            {modoDetectado && (
              <span style={{ padding: "2px 10px", background: C.amarillo, color: C.blanco, fontSize: "10px", fontWeight: "700", borderRadius: "10px", animation: "fadeIn .2s ease" }}>
                ⚡ Auto: {MODOS.find(m => m.id === modoDetectado)?.label}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            {msgs.length > 0 && (
              <>
                <button onClick={exportarPDF} style={{ padding: "5px 12px", background: "rgba(255,255,255,.1)", color: C.blanco, border: "1px solid rgba(255,255,255,.2)", borderRadius: "4px", fontSize: "11px", fontWeight: "500", cursor: "pointer" }}>
                  ↓ PDF
                </button>
                <button onClick={guardarConvTxt} style={{ padding: "5px 12px", background: "rgba(255,255,255,.1)", color: C.blanco, border: "1px solid rgba(255,255,255,.2)", borderRadius: "4px", fontSize: "11px", fontWeight: "500", cursor: "pointer" }}>
                  ↓ .txt
                </button>
              </>
            )}
            <button onClick={() => { setRapido(!rapido); setRespRapida(""); setInputRap(""); }}
              style={{ padding: "5px 12px", background: rapido ? C.amarillo : "rgba(255,255,255,.1)", color: C.blanco, border: `1px solid ${rapido ? C.amarillo : "rgba(255,255,255,.2)"}`, borderRadius: "4px", fontSize: "11px", fontWeight: "500", cursor: "pointer" }}>
              {rapido ? "✕ Rápido" : "⚡ Rápido"}
            </button>
          </div>
        </div>
        {/* Línea degradado */}
        <div style={{ height: "3px", background: `linear-gradient(90deg,${C.azulOscuro},${C.azulClaro},${C.azulOscuro})`, flexShrink: 0 }} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── SIDEBAR ─────────────────────────────────────────────── */}
          {sidebar && (
            <div className="sidebar-panel open" style={{ width: "252px", background: C.blanco, borderRight: `1px solid ${C.borde}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
              {/* Nueva conversación */}
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.borde}` }}>
                <button onClick={nuevaConv} style={{ ...B(C.azulOscuro), width: "100%", padding: "9px 14px", textAlign: "left", borderRadius: "6px", fontSize: "12px" }}>
                  + Nueva conversación
                </button>
              </div>
              {/* Búsqueda */}
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.borde}` }}>
                <input value={busq} onChange={e => setBusq(e.target.value)} placeholder="Buscar conversación..."
                  style={{ width: "100%", padding: "7px 10px", background: C.fondo, border: `1px solid ${C.borde}`, color: C.texto, fontSize: "12px", borderRadius: "5px" }} />
              </div>
              {/* Lista conversaciones */}
              <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: C.textoTer, letterSpacing: ".8px", textTransform: "uppercase", padding: "5px 4px 4px", marginBottom: "2px" }}>
                  Conversaciones ({convs.length}/10)
                </div>
                {convsFilt.map(c => (
                  <div key={c.id} className="conv-item"
                    style={{ padding: "8px 10px", marginBottom: "2px", cursor: "pointer", borderRadius: "6px", background: c.id === activa ? C.azulSuave : "transparent", border: `1px solid ${c.id === activa ? C.bordeAct : "transparent"}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}
                    onClick={() => setActiva(c.id)}>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "12px", color: c.id === activa ? C.azulMedio : C.textoSec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: c.id === activa ? "600" : "400" }}>{c.nombre}</div>
                      <div style={{ fontSize: "10px", color: C.textoTer, marginTop: "2px" }}>{c.mensajes.filter(m => m.rol === "user").length} mensajes</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); borrarConv(c.id); }} style={{ background: "none", border: "none", color: C.textoTer, cursor: "pointer", fontSize: "14px", padding: "0", lineHeight: "1", flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>

              {/* Modos */}
              <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.borde}` }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: C.textoTer, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "6px" }}>Modo de consulta</div>
                {MODOS.map(m => (
                  <button key={m.id} className="modo-btn" onClick={() => { setModo(m.id); setModoDetectado(null); }}
                    style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "7px 9px", marginBottom: "1px", textAlign: "left", fontSize: "12px", cursor: "pointer", borderRadius: "5px", background: modo === m.id ? C.azulSuave : "transparent", color: modo === m.id ? C.azulMedio : C.textoSec, border: `1px solid ${modo === m.id ? C.bordeAct : "transparent"}`, fontWeight: modo === m.id ? "600" : "400" }}>
                    <span style={{ fontSize: "13px", width: "16px", textAlign: "center", flexShrink: 0 }}>{m.icon}</span>
                    <div>
                      <div>{m.label}</div>
                      <div style={{ fontSize: "9px", color: modo === m.id ? C.azulClaro : C.textoTer, fontWeight: "400" }}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Configurador de turno */}
              <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.borde}` }}>
                <button onClick={() => setVerConfig(!verConfig)} style={{ width: "100%", padding: "7px 10px", background: "transparent", border: `1px solid ${C.borde}`, color: C.textoSec, fontSize: "11px", cursor: "pointer", borderRadius: "5px", textAlign: "left", fontWeight: "500", display: "flex", justifyContent: "space-between" }}>
                  <span>⚙ Contexto del turno</span>
                  <span>{verConfig ? "▲" : "▼"}</span>
                </button>
                {verConfig && (
                  <div style={{ marginTop: "8px", display: "grid", gap: "7px" }}>
                    {[
                      { key: "instalacion", label: "Tipo de instalación", placeholder: "Ej: industrial, fotovoltaica…" },
                      { key: "potencia",    label: "Potencia",            placeholder: "Ej: 15kW, 22kW…" },
                      { key: "tension",     label: "Tensión",             placeholder: "Ej: 400V tri, 230V mono…" },
                      { key: "notas",       label: "Notas adicionales",   placeholder: "Cliente, proyecto…" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <div style={{ fontSize: "9px", fontWeight: "600", color: C.textoTer, marginBottom: "3px" }}>{label.toUpperCase()}</div>
                        <input value={configTurno[key]} onChange={e => setConfigTurno(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                          style={{ width: "100%", padding: "6px 9px", background: C.fondo, border: `1px solid ${C.borde}`, color: C.texto, fontSize: "11px", borderRadius: "4px" }} />
                      </div>
                    ))}
                    <button onClick={() => { setVerConfig(false); showToast("Contexto del turno guardado"); }} style={{ ...B(C.azulOscuro), width: "100%", padding: "7px", fontSize: "11px", borderRadius: "4px" }}>
                      Aplicar contexto
                    </button>
                  </div>
                )}
                {/* Indicador de contexto activo */}
                {(configTurno.instalacion || configTurno.potencia) && (
                  <div style={{ marginTop: "6px", padding: "5px 8px", background: C.verdeSuave, border: `1px solid ${C.verde}30`, borderRadius: "4px", fontSize: "10px", color: C.verde, fontWeight: "600" }}>
                    ✓ Contexto activo: {[configTurno.instalacion, configTurno.potencia, configTurno.tension].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>

              {/* Refs del turno */}
              {refsTurno.length > 0 && (
                <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.borde}` }}>
                  <div style={{ fontSize: "9px", fontWeight: "700", color: C.textoTer, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                    <span>Refs. del turno ({refsTurno.length})</span>
                    <button onClick={() => setRefsTurno([])} style={{ background: "none", border: "none", color: C.textoTer, cursor: "pointer", fontSize: "10px" }}>Limpiar</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "100px", overflowY: "auto" }}>
                    {refsTurno.map((r, i) => (
                      <div key={i} style={{ fontSize: "10px", padding: "3px 7px", background: C.verdeSuave, borderRadius: "4px", color: C.texto }}>
                        <span style={{ fontWeight: "700", color: C.verde }}>✓</span> {r.ref} <span style={{ color: C.textoTer }}>· {r.precio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.borde}` }}>
                <button onClick={() => setVerStats(!verStats)} style={{ width: "100%", padding: "6px 10px", background: "transparent", border: `1px solid ${C.borde}`, color: C.textoSec, fontSize: "11px", cursor: "pointer", borderRadius: "5px", textAlign: "left", fontWeight: "500" }}>
                  {verStats ? "▲ Ocultar estadísticas" : "▼ Ver estadísticas"}
                </button>
                {verStats && (
                  <div style={{ marginTop: "8px", padding: "9px 11px", background: C.fondo, border: `1px solid ${C.borde}`, borderRadius: "5px" }}>
                    {!stats ? <div style={{ fontSize: "11px", color: C.textoTer }}>Sin datos aún.</div> : (
                      <>
                        <div style={{ fontSize: "11px", color: C.textoSec, marginBottom: "4px" }}>Total: <strong style={{ color: C.azulMedio }}>{stats.total}</strong></div>
                        <div style={{ fontSize: "11px", color: C.textoSec, marginBottom: "4px" }}>Alta confianza: <strong style={{ color: C.verde }}>{stats.pA}%</strong></div>
                        <div style={{ fontSize: "11px", color: C.textoSec, marginBottom: "4px" }}>A verificar: <strong style={{ color: C.rojo }}>{stats.pB}%</strong></div>
                        {stats.mT && <div style={{ fontSize: "11px", color: C.textoSec, marginBottom: "4px" }}>Modo top: <strong style={{ color: C.azulMedio }}>{stats.mT}</strong></div>}
                        {stats.fT && <div style={{ fontSize: "11px", color: C.textoSec }}>Familia top: <strong style={{ color: C.azulMedio }}>{stats.fT}</strong></div>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ÁREA PRINCIPAL ──────────────────────────────────────── */}
          <div className="chat-area" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.fondo }}>

            {/* Consulta rápida */}
            {rapido && (
              <div style={{ padding: "12px 20px", background: C.blanco, borderBottom: `1px solid ${C.borde}`, flexShrink: 0 }}>
                <div style={{ maxWidth: "720px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: C.textoTer, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: "7px" }}>⚡ Consulta rápida — sin historial</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={inputRap} onChange={e => setInputRap(e.target.value)} onKeyDown={e => { if (e.key === "Enter") consultaRapida(); }}
                      placeholder="Consulta de dato rápido..."
                      style={{ flex: 1, padding: "8px 13px", border: `1px solid ${C.borde}`, borderRadius: "5px", fontSize: "13px", color: C.texto, background: C.fondo }} />
                    <button onClick={consultaRapida} disabled={cargRap || !inputRap.trim()} style={{ ...B(C.azulOscuro), borderRadius: "5px", opacity: cargRap || !inputRap.trim() ? 0.4 : 1 }}>
                      {cargRap ? "…" : "Preguntar"}
                    </button>
                  </div>
                  {respRapida && (
                    <div style={{ marginTop: "9px", padding: "11px 14px", background: C.azulSuave, border: `1px solid ${C.bordeAct}`, borderRadius: "5px", fontSize: "13px", color: C.texto, lineHeight: "1.6" }}>
                      {respRapida}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Banner modo auto-detectado */}
            {modoDetectado && (
              <div style={{ padding: "8px 20px", background: C.amarilloS, borderBottom: `1px solid ${C.amarillo}40`, flexShrink: 0, display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: C.amarillo, fontWeight: "600" }}>
                  ⚡ Modo detectado automáticamente: <strong>{MODOS.find(m => m.id === modoDetectado)?.label}</strong>
                </span>
                <button onClick={() => { setModo(modoDetectado); setModoDetectado(null); showToast(`Modo cambiado a ${MODOS.find(m => m.id === modoDetectado)?.label}`); }}
                  style={{ ...B(C.amarillo), padding: "3px 10px", fontSize: "10px" }}>Aplicar</button>
                <button onClick={() => setModoDetectado(null)} style={{ background: "none", border: "none", color: C.textoTer, cursor: "pointer", fontSize: "14px", marginLeft: "auto" }}>×</button>
              </div>
            )}

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {msgs.length === 0 && !streamText && (
                <div style={{ maxWidth: "620px", margin: "0 auto", animation: "fadeIn .3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: C.azulOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <LogoSonepar size={13} color={C.blanco} />
                    </div>
                    <div>
                      <div style={{ fontSize: "19px", fontWeight: "700", color: C.texto }}>SONEX <span style={{ fontSize: "11px", color: C.textoTer, fontWeight: "400" }}>v7</span></div>
                      <div style={{ fontSize: "12px", color: C.textoSec }}>Asistente técnico · Sonepar España · A Coruña</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: C.textoSec, lineHeight: "1.6", marginBottom: "18px", paddingLeft: "58px" }}>
                    Modo activo: <strong style={{ color: C.azulMedio }}>{modoObj?.icon} {modoObj?.label}</strong> — {modoObj?.desc}
                    {(configTurno.instalacion || configTurno.potencia) && (
                      <span style={{ display: "block", marginTop: "4px", fontSize: "11px", color: C.verde }}>
                        ✓ Contexto: {[configTurno.instalacion, configTurno.potencia, configTurno.tension].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </p>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: C.textoTer, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: "9px" }}>Consultas frecuentes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {sugs.map((s, i) => (
                      <button key={i} className="sug-btn" onClick={() => enviar(s)}
                        style={{ padding: "10px 14px", background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "6px", color: C.textoSec, fontSize: "13px", textAlign: "left", cursor: "pointer", lineHeight: "1.4", transition: "all .12s" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((msg, i) => (
                <div key={i} style={{ marginBottom: "18px", display: "flex", flexDirection: msg.rol === "user" ? "row-reverse" : "row", gap: "10px", alignItems: "flex-start", animation: "fadeIn .2s ease" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "7px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.rol === "user" ? C.azulSuave : C.azulOscuro, border: `1px solid ${msg.rol === "user" ? C.bordeAct : C.azulOscuro}`, fontSize: "9px", fontWeight: "700", color: msg.rol === "user" ? C.azulMedio : C.blanco }}>
                    {msg.rol === "user" ? "TÚ" : "SX"}
                  </div>
                  <div style={{ maxWidth: "76%" }}>
                    <div style={{ background: msg.rol === "user" ? C.azulSuave : C.blanco, border: `1px solid ${msg.rol === "user" ? C.bordeAct : C.borde}`, borderRadius: msg.rol === "user" ? "10px 3px 10px 10px" : "3px 10px 10px 10px", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                      {msg.rol === "user"
                        ? <span style={{ whiteSpace: "pre-wrap", fontSize: "14px", color: C.texto, lineHeight: "1.6" }}>{msg.texto}</span>
                        : <RenderTexto texto={msg.texto} />
                      }
                    </div>
                    {/* Refs verificadas en la respuesta */}
                    {msg.rol === "bot" && msg.refs && msg.refs.length > 0 && (
                      <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap" }}>
                        {msg.refs.map((r, j) => <RefCard key={j} prod={r} />)}
                      </div>
                    )}
                    {msg.rol === "bot" && (
                      <div style={{ display: "flex", gap: "5px", alignItems: "center", marginTop: "5px", flexWrap: "wrap" }}>
                        <Badge nivel={msg.confianza} />
                        {msg.familia && <span style={{ padding: "2px 8px", background: C.fondo, color: C.textoSec, fontSize: "10px", borderRadius: "10px", border: `1px solid ${C.borde}`, fontWeight: "500" }}>{msg.familia}</span>}
                        <button onClick={() => copiar(msg.texto)} style={{ ...B(C.textoTer, true), padding: "2px 8px", fontSize: "10px" }}>Copiar</button>
                        {puedeEscalar && i === msgs.length - 1 && (
                          <button onClick={escalar} style={{ ...B(C.amarillo, true), padding: "2px 8px", fontSize: "10px" }}>↑ Escalar</button>
                        )}
                        <span style={{ fontSize: "10px", color: C.textoTer }}>{new Date(msg.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming en curso */}
              {(cargando || streamText) && (
                <div style={{ marginBottom: "18px", display: "flex", flexDirection: "row", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "7px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.azulOscuro, fontSize: "9px", fontWeight: "700", color: C.blanco }}>SX</div>
                  <div style={{ maxWidth: "76%" }}>
                    <div style={{ background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: "3px 10px 10px 10px", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                      {streamText ? (
                        <div className="streaming-cursor" style={{ fontSize: "14px", lineHeight: "1.65", color: C.texto, whiteSpace: "pre-wrap" }}>{streamText}</div>
                      ) : (
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {[0, 1, 2].map(i => <div key={i} style={{ width: "6px", height: "6px", background: C.azulClaro, borderRadius: "50%", animation: `pulse 1.2s ease-in-out ${i * .2}s infinite` }} />)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {limitado && (
                <div style={{ background: C.rojoSuave, border: `1px solid ${C.rojo}`, borderRadius: "6px", padding: "11px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: C.rojo, fontWeight: "500" }}>Límite de {LIMITE} mensajes alcanzado</span>
                  <button onClick={nuevaConv} style={{ ...B(C.rojo), borderRadius: "4px", fontSize: "11px" }}>Nueva conversación</button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── INPUT ────────────────────────────────────────────── */}
            <div style={{ padding: "12px 20px 16px", background: C.blanco, borderTop: `1px solid ${C.borde}`, flexShrink: 0 }}>
              <div style={{ maxWidth: "860px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                  <div style={{ fontSize: "11px", color: C.textoTer }}>
                    <span style={{ fontWeight: "600", color: C.azulMedio }}>{modoObj?.icon} {modoObj?.label}</span>
                    <span style={{ color: C.borde, margin: "0 5px" }}>·</span>
                    <span>{modoObj?.desc}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: limitado ? C.rojo : C.textoTer, fontWeight: limitado ? "700" : "400" }}>
                    {msgs.filter(m => m.rol === "user").length}/{LIMITE}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "9px", alignItems: "flex-end" }}>
                  <textarea ref={textareaRef}
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                    placeholder={limitado ? "Límite alcanzado — inicia una nueva conversación" : "Escribe tu consulta técnica… (Enter envía, Shift+Enter nueva línea)"}
                    disabled={limitado || cargando} rows={2}
                    style={{ flex: 1, padding: "11px 13px", background: C.fondo, border: `1px solid ${C.borde}`, borderRadius: "6px", color: C.texto, fontSize: "14px", resize: "none", opacity: limitado ? .4 : 1, lineHeight: "1.5" }}
                  />
                  <button onClick={() => enviar()} disabled={cargando || limitado || !input.trim()}
                    style={{ ...B(C.azulOscuro), padding: "0 20px", height: "56px", fontSize: "20px", borderRadius: "6px", opacity: cargando || limitado || !input.trim() ? 0.3 : 1 }}>→</button>
                </div>
                <div style={{ fontSize: "10px", color: C.textoTer, marginTop: "6px", textAlign: "center" }}>
                  SONEX v7 — prototipo de apoyo al mostrador. Verifica siempre con catálogo Sonepar y documentación del fabricante antes de cualquier pedido o instalación.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
