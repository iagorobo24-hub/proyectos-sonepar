/**
 * Brand Logo Service
 * 
 * Priority:
 * 1. Local logos in /public/logos/
 * 2. Clearbit Logo API (free, no key needed)
 * 3. First letter avatar fallback
 */

const LOCAL_LOGOS = {
  // Already have local logos
  "Schneider Electric": "/logos/schneider.png",
  "ABB": "/logos/abb.png",
  "Siemens": "/logos/siemens.jpg",
  "Mitsubishi Electric": "/logos/mitsubishi.png",
  "IFM": "/logos/ifm.jpg",
  "Pepperl+Fuchs": "/logos/pepperl.png",
  "Philips": "/logos/philips.jpg",
  "Philips Lighting Solutions": "/logos/philips.jpg",
  "Ledvance": "/logos/ledvance.jpg",
  "Zemper": "/logos/zemper.png",
  "Wallbox": "/logos/wallbox.png",
  "Hager": "/logos/hager.png",
  "Fronius": "/logos/fronius.png",
  "SMA": "/logos/sma.png",
  "Pylontech": "/logos/pylontech.png",
  "Legrand": "/logos/legrand.png",
  "Simon": "/logos/simon.png",
  "Nexans": "/logos/nexans.png",
  "Prensato": "/logos/prensato.png",
  "Lapp Kabel": "/logos/lapp.png",
  
  // Add more known brands from Firestore
  "EATON": "/logos/eaton.png",
  "RITTAL": "/logos/rittal.png",
  "Phoenix Contact": "/logos/phoenix.png",
  "WAGO": "/logos/wago.png",
  "Weidmüller": "/logos/weidmuller.png",
  "Rockwell": "/logos/rockwell.png",
  "Came": "/logos/came.png",
  "Ferroli": "/logos/ferroli.png",
  "Baxi": "/logos/baxi.png",
  "Saunier Duval": "/logos/saunier.png",
  "Viessmann": "/logos/viessmann.png",
  "Daikin": "/logos/daikin.png",
  "Mitsubishi Heavy Industries": "/logos/mitsubishi.png",
  "Toshiba": "/logos/toshiba.png",
  "LG": "/logos/lg.png",
  "Samsung": "/logos/samsung.png",
  "Panasonic": "/logos/panasonic.png",
  "Fujitsu": "/logos/fujitsu.png",
  "Hitachi": "/logos/hitachi.png",
  "Carrier": "/logos/carrier.png",
  "Trane": "/logos/trane.png",
  "Daitsu": "/logos/daitsu.png",
  "Junker": "/logos/junker.png",
  "Cointra": "/logos/cointra.png",
  "Aquarel": "/logos/aquarel.png",
  "Bosh": "/logos/bosh.png",
  "Celly": "/logos/celly.png",
  "S&P": "/logos/sandp.png",
  "Sodeca": "/logos/sodeca.png",
  "Helios": "/logos/helios.png",
  "Klimawent": "/logos/klimawent.png",
  "Vent-Axia": "/logos/ventaxia.png",
  "Orcon": "/logos/orcon.png",
  "Zehnder": "/logos/zehnder.png",
  "Roth": "/logos/roth.png",
  "Purmo": "/logos/purmo.png",
  "Vogel": "/logos/vogel.png",
  "Henrad": "/logos/henrad.png",
  "IRSAP": "/logos/irsap.png",
  "Arcade": "/logos/arcade.png",
  "B人民医院": "/logos/hp.png",
  "Nefit": "/logos/nefit.png",
  "Viessmann": "/logos/viessmann.png",
  "Viessmann": "/logos/viessmann.png",
};

/**
 * Get logo URL for a brand
 * @param {string} brandName - Brand name from Firestore
 * @returns {string} Logo URL or fallback
 */
export function getBrandLogo(brandName) {
  if (!brandName) return null;
  
  const normalized = brandName.trim();
  
  // 1. Check local logos (exact match or case-insensitive)
  if (LOCAL_LOGOS[normalized]) {
    return LOCAL_LOGOS[normalized];
  }
  
  // Try case-insensitive search
  const found = Object.keys(LOCAL_LOGOS).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  if (found) return LOCAL_LOGOS[found];
  
  // 2. Use Clearbit Logo API (free, no API key needed)
  // Domain guessing from brand name
  const domain = guessDomain(normalized);
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  
  // 3. Return null to trigger avatar fallback
  return null;
}

/**
 * Guess domain from brand name
 */
function guessDomain(brand) {
  const domainMap = {
    "Schneider Electric": "schneider-electric.com",
    "ABB": "abb.com",
    "Siemens": "siemens.com",
    "Mitsubishi Electric": "mitsubishielectric.com",
    "Legrand": "legrand.com",
    "Simon": "simon.es",
    "Hager": "hager.es",
    "Nexans": "nexans.com",
    "Eaton": "eaton.com",
    "Rittal": "rittal.com",
    "Phoenix Contact": "phoenixcontact.com",
    "WAGO": "wago.com",
    "Weidmüller": "weidmueller.com",
    "Rockwell Automation": "rockwellautomation.com",
    "Came": "came.com",
    "Lapp Kabel": "lapp.com",
    "General Cable": "generalcable.com",
    "Prysmians": "prysmiangroup.com",
    "Baxi": "baxi.es",
    "Ferroli": "ferroli.es",
    "Daikin": "daikin.es",
    "Samsung": "samsung.com",
    "LG": "lg.com",
    "Panasonic": "panasonic.com",
    "Toshiba": "toshiba.com",
    "Hitachi": "hitachi.com",
    "Mitsubishi Heavy Industries": "mhi.com",
    "Carrier": "carrier.com",
    "Trane": "trane.com",
    "S&P": "sandp.es",
    "Sodeca": "sodeca.com",
    "Helios": "helios-ventilation.com",
    "Zehnder": "zehndergroup.com",
    "Viessmann": "viessmann.com",
  };
  
  return domainMap[brand] || null;
}

/**
 * Get brand color based on first letter
 */
export function getBrandColor(brandName) {
  if (!brandName) return '#666666';
  
  const colors = {
    A: '#FF6B6B', B: '#4ECDC4', C: '#45B7D1', D: '#96CEB4',
    E: '#FFEAA7', F: '#DDA0DD', G: '#98D8C8', H: '#F7DC6F',
    I: '#BB8FCE', J: '#85C1E9', K: '#F8B500', L: '#58D68D',
    M: '#5DADE2', N: '#F39C12', O: '#E74C3C', P: '#1ABC9C',
    Q: '#9B59B6', R: '#3498DB', S: '#E67E22', T: '#2ECC71',
    U: '#1ABC9C', V: '#E74C3C', W: '#9B59B6', X: '#34495E',
    Y: '#F1C40F', Z: '#16A085'
  };
  
  const first = brandName.charAt(0).toUpperCase();
  return colors[first] || '#666666';
}

export default {
  getBrandLogo,
  getBrandColor
};