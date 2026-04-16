/**
 * Brand Logo Service - Complete mapping
 * 
 * Priority:
 * 1. Local logos in /public/logos/
 * 2. Brand-specific domains → Clearbit Logo API
 * 3. Generic fallback
 */

const LOCAL_LOGOS = {
  // Top Spanish/European brands in catalog
  "SCHNEIDER ELECTRIC": "/logos/schneider.png",
  "SIMON": "/logos/simon.png",
  "LEGRAND": "/logos/legrand.png",
  "NIESSEN": "/logos/niessen.png",
  "SIEMENS": "/logos/siemens.png",
  "HAGER": "/logos/hager.png",
  "PHOENIX CONTACT": "/logos/phoenix.png",
  "BTICINO": "/logos/bticino.png",
  "BJC": "/logos/bjc.png",
  "TOP CABLE": "/logos/topcable.png",
  "IDE": "/logos/ide.png",
  "MIGUELEZ": "/logos/miguelez.png",
  "JUNG": "/logos/jung.png",
  "UNEX": "/logos/unex.png",
  "TELEVES": "/logos/televes.png",
  "GENERAL CABLE": "/logos/generalcable.png",
  "PRYSMIAN": "/logos/prysmians.png",
  "EXCEL": "/logos/excel.png",
  "NEXANS": "/logos/nexans.png",
  "SOLERA": "/logos/solera.png",
  "COMMSCOPE": "/logos/commscope.png",
  "FERMAX": "/logos/fermax.png",
  "WEIDMULLER": "/logos/weidmuller.png",
  "GEWISS": "/logos/gewiss.png",
  "RITTAL": "/logos/rittal.png",
  "EATON": "/logos/eaton.png",
  "GOLMAR": "/logos/golmar.png",
  "HELLERMANN": "/logos/hellermann.png",
  "ABB": "/logos/abb.png",
  "WAGO": "/logos/wago.png",
  "CAME": "/logos/came.png",
  "CORNING": "/logos/corning.png",
  "HARTING": "/logos/harting.png",
  "ROCKWELL": "/logos/rockwell.png",
  "OBO BETTERMANN": "/logos/obo.png",
  "HIKVISION": "/logos/hikvision.png",
  "PEMSA": "/logos/pemsa.png",
  "FAMATEL": "/logos/famatel.png",
  "SALICRU": "/logos/salicru.png",
  "TUPERSA": "/logos/tupersa.png",
  "MURRELEKTRONIK": "/logos/murrelektronik.png",
  "LAPP KABEL": "/logos/lapp.png",
  "SODECA": "/logos/sodeca.png",
  "FINDER": "/logos/finder.png",
  "CAME": "/logos/came.png",
  "BEG": "/logos/beg.png",
  "KIEBACK&PETER": "/logos/kieback.png",
  "BXI": "/logos/baxi.png",
  
  // Legacy mappings (lowercase variants)
  "Schneider Electric": "/logos/schneider.png",
  "Legrand": "/logos/legrand.png",
  "Siemens": "/logos/siemens.png",
  "Abb": "/logos/abb.png",
};

// Map brand to domain for Clearbit API
const BRAND_DOMAINS = {
  // Top 30 brands - almost all have clearbit logos
  "SCHNEIDER ELECTRIC": "schneider-electric.com",
  "SIMON": "simon.es",
  "LEGRAND": "legrand.com",
  "NIESSEN": "niessen.es",
  "SIEMENS": "siemens.com",
  "HAGER": "hager.es",
  "PHOENIX CONTACT": "phoenixcontact.com",
  "BTICINO": "bticino.com",
  "BJC": "bjc.es",
  "TOP CABLE": "topcable.es",
  "IDE": "ide.es",
  "MIGUELEZ": "miguelez.es",
  "JUNG": "jung.de",
  "UNEX": "unex.es",
  "TELEVES": "televes.com",
  "GENERAL CABLE": "generalcable.com",
  "PRYSMIAN": "prysmiangroup.com",
  "EXCEL": "excelcable.com",
  "NEXANS": "nexans.com",
  "SOLERA": "solera.es",
  "COMMSCOPE": "commscope.com",
  "FERMAX": "fermax.es",
  "WEIDMULLER": "weidmueller.com",
  "GEWISS": "gewiss.com",
  "RITTAL": "rittal.com",
  "EATON": "eaton.com",
  "GOLMAR": "golmar.com",
  "HELLERMANN": "hellermanntyton.com",
  "ABB": "abb.com",
  "WAGO": "wago.com",
  "CAME": "came.com",
  "HARTING": "harting.com",
  "ROCKWELL": "rockwellautomation.com",
  "OBO BETTERMANN": "obobettermann.com",
  "HIKVISION": "hikvision.com",
  "PEMSA": "pemsa.es",
  "FAMATEL": "famatel.es",
  "SALICRU": "salicru.com",
  "TUPERSA": "tupersa.es",
  "MURRELEKTRONIK": "murrelektronik.com",
  "LAPP KABEL": "lapp.com",
  "SODECA": "sodeca.com",
  "FINDER": "finder.eu",
  "CORNING": "corning.com",
  "COMELIT": "comelitgroup.com",
  "FERRAZ SHAWMUT": "ferrazshawmut.com",
  "SOCOMEC": "socomec.com",
  "CAHORS": "cahors.es",
  "MENNEKES": "mennekes.com",
  "GESCABLE": "gescable.es",
  "NEXANS CS": "nexans.com",
  "GAVE": "gave.com",
  "DRAKA": "draka.com",
  "BXI": "baxi.es",
  "TOSHIBA": "toshiba.com",
  "CABLES RCT": "rct.es",
  "TP-LINK": "tp-link.com",
  "D-LINK": "dlink.com",
  "PANDUIT": "panduit.com",
  "LEVITON": "leviton.com",
  "APOLO": "apolo.es",
  "CERVINOR": "cervinor.es",
  "CERVI": "cervi.es",
  "CEMBRE": "cembre.it",
  "ORBIS": "orbis.es",
  "AISCAN": "aiscan.com",
  "CABLES RCT": "rct.es",
  "DINUY": "dinuy.com",
  "AVALVA": "avalva.es",
  "REVALCO": "revalco.es",
  "INCASA": "incasa.es",
  "HONEYWELL": "honeywell.com",
  "BEG": "beg-tech.de",
  "TEKOX": "tekox.com",
  "LLENARI": "llenari.es",
  "ARMENGOL": "armengol.es",
  "RETEX": "retex.es",
  "INMAEL": "inmael.es",
  "PINAZO": "pinazo.es",
  "ECOTEL": "ecotel.es",
  "BASORPLAST": "basorplast.es",
  "SEAVI": "seavi.es",
  "FONTINI": "fontini.com",
  "FAGOR ELTRON.": "fagor.com",
  "CIRPROTEC": "cirprotec.com",
  "WOHNELEC": "wohnelec.com",
  "ALG": "alg.es",
  "ILME": "ilme.com",
  "OPENETICS": "openetics.com",
  "TOSCANO": "toscano.es",
  "MICRO DETECTORS": "micro-detectors.com",
  "NILED": "niled.com",
  "KPS": "kps-group.com",
  "EKSELANS BY ITS": "ekselans.com",
  "GTLAN": "gtlan.es",
  "QUINTELA": "quintela.es",
  "BASORFIL": "basorfil.es",
  "BACHMANN": "bachmann.com",
  "MMCONECTA": "mmconecta.es",
  "CIRCUTOR": "circutor.com",
  "KLK": "klk-elektro.de",
  "BOXTAR": "boxtrac.com",
  "FENOPLASTICA": "fenoplastica.es",
  "TECNOTRAFO": "tecnitrafo.es",
  "METALBLINDS": "metalblinds.com",
  "DELECSA": "delecsa.es",
  "GRUPO AGUILERA": "grupoaguilera.es",
  "POLYLUX": "polylux.com",
  "KNIPEX": "knipex.de",
  "SPELSBERG": "spelsberg.de",
  "GTLED": "gtled.es",
  "EISSOUND": "eissound.com",
  "BASORTRAY": "basortray.es",
  "ELECTRO DH": "electro-dh.com",
  "MAXGE": "maxge.es",
  "PRONUTEC": "pronutec.com",
  "WIELAND": "wieland-electric.com",
  "DEHN": "dehn.de",
  "LUCECO": "luceco.es",
  "PRITEC": "pritec.es",
  "RODMAN": "rodman.com",
  "DELTAELECTRONICS": "deltaelectronics.com",
  "TECNICAS DEL CABLE": "tecnicasdelcable.es",
  "GARSACO": "garsaco.es",
  "MAGNUM HEATING": "magnumheating.eu",
  "MORA": "mora.es",
  "SIBA": "siba.es",
  "EFIBAT": "efibat.es",
  "AIRZONE": "airzone.es",
  "TELECTRISA": "telectrisa.es",
  "INTESIS": "intesis.com",
  "TEKNOMEGA": "teknomega.it",
  "GIACOMINI": "giacomini.com",
  "SONELCO": "sonelco.com",
  "MCI LIGHT": "mcilight.com",
  "ILARDIA": "ilardia.com",
  "TELERGON": "telergon.com",
  "TESE": "tese.es",
  "ACO": "aco.com",
  "PHILIPS LIGHTING SOLUTIONS": "philips.com",
  "SAET-94": "saet-94.it",
  "INDUSTRIAS MORA": "industriasmora.es",
  "LIGHTED": "lighted.es",
  "CELLPACK": "cellpack.com",
  "ONE LIGHT": "onelight.es",
  "IDEAL": "ideal.es",
  "AUTA": "auta.es",
  "OBSEQUIOS": "obsequios.es",
  "IES": "ies.es",
  "FLEXAQUICK": "flexaquick.com",
  "LUXLIGHT": "luxlight.es",
  "ENVERTEC": "envertec.com",
  "KAINOS": "kainos.es",
  "GAVE": "gave.es",
  "SPIT PASLODE": "spit-paslode.com",
  "ESLA": "esla.es",
  "DUCASA": "ducasa.com",
  "KIEBACK&PETER": "kieback-peter.de",
  "MT VF": "mtvf.es",
  "SODECA": "sodeca.es",
  "CODEMB": "codemb.es",
  "BENTEL": "bentel.com",
  "TSL": "tsl.es",
  "SLV": "slv.com",
  "AMIDA": "amida.es",
  "JANGAR": "jangar.es",
  "TRES": "tres.es",
  "CANFOR": "canfor.com",
  "JISO": "jiso.es",
  "BASORFIX": "basorfix.es",
  "BLUELED": "blueled.es",
  "VELILLA": "velilla.es",
  "GROHE": "grohe.com",
  "MONOLYTH": "monolith.es",
  "WOHNER": "whoner.de",
  "TBK": "tbk.com",
  "LUZ NEGRA": "luznegra.es",
  "ETI": "eti.si",
  "SCHUTZ": "schutz.de",
  "PLYMOUTH": "plymouth.com",
  "ERICO": "erico.com",
  "FISCHER": "fischer-group.com",
  "FESTO": "festo.com",
  "POTERMIC": "potermic.com",
};

/**
 * Get logo URL for a brand
 */
export function getBrandLogo(brandName) {
  if (!brandName) return null;
  
  const normalized = brandName.trim().toUpperCase();
  
  // 1. Check local logos (exact match)
  if (LOCAL_LOGOS[normalized]) {
    return LOCAL_LOGOS[normalized];
  }
  
  // 2. Try case-insensitive local
  const localKey = Object.keys(LOCAL_LOGOS).find(
    key => key.toUpperCase() === normalized
  );
  if (localKey) return LOCAL_LOGOS[localKey];
  
  // 3. Try Clearbit with known domains
  if (BRAND_DOMAINS[normalized]) {
    return `https://logo.clearbit.com/${BRAND_DOMAINS[normalized]}`;
  }
  
  // 4. No logo found
  return null;
}

/**
 * Get brand color based on first letter
 */
export function getBrandColor(brandName) {
  if (!brandName) return '#666666';
  
  const colors = {
    A: '#E74C3C', B: '#3498DB', C: '#9B59B6', D: '#E67E22',
    E: '#1ABC9C', F: '#F39C12', G: '#2ECC71', H: '#E91E63',
    I: '#00BCD4', J: '#FF9800', K: '#8BC34A', L: '#673AB7',
    M: '#F44336', N: '#03A9F4', O: '#4CAF50', P: '#FF5722',
    Q: '#9C27B0', R: '#00BCD4', S: '#FFEB3B', T: '#009688',
    U: '#CDDC39', V: '#3F51B5', W: '#FFC107', X: '#795548',
    Y: '#607D8B', Z: '#4DB6AC'
  };
  
  const first = brandName.charAt(0).toUpperCase();
  return colors[first] || '#666666';
}

export default { getBrandLogo, getBrandColor };