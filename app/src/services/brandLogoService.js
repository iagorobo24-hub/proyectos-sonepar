/**
 * Brand Logo Service - Clean Version
 * 
 * Uses text-based avatars with nice gradient backgrounds
 * No external API dependencies to avoid ugly logo backgrounds
 */

const LOCAL_LOGOS = {
  // Only use local logos that you have personally - these are guaranteed to look good
  "SCHNEIDER ELECTRIC": "/logos/schneider.png",
  "LEGRAND": "/logos/legrand.png",
  "SIMON": "/logos/simon.png",
  "SIEMENS": "/logos/siemens.png",
  "ABB": "/logos/abb.png",
  "HAGER": "/logos/hager.png",
  "PHOENIX CONTACT": "/logos/phoenix.png",
  "RITTAL": "/logos/rittal.png",
  "EATON": "/logos/eaton.png",
  "WAGO": "/logos/wago.png",
  "CAME": "/logos/came.png",
  "NEXANS": "/logos/nexans.png",
  "BTICINO": "/logos/bticino.png",
  "JUNG": "/logos/jung.png",
  "BJC": "/logos/bjc.png",
  "NIESSEN": "/logos/niessen.png",
  "IDE": "/logos/ide.png",
  "TELEVES": "/logos/televes.png",
  "FERMAX": "/logos/fermax.png",
  "UNEX": "/logos/unex.png",
  "HIKVISION": "/logos/hikvision.png",
  "LAPP KABEL": "/logos/lapp.png",
  "TOP CABLE": "/logos/topcable.png",
  "SOLERA": "/logos/solera.png",
  "GENERAL CABLE": "/logos/generalcable.png",
  "PRYSMIAN": "/logos/prysmian.png",
  "EXCEL": "/logos/excel.png",
  "COMMSCOPE": "/logos/commscope.png",
  "CORNING": "/logos/corning.png",
  "HARTING": "/logos/harting.png",
  "WEIDMULLER": "/logos/weidmuller.png",
  "GEWISS": "/logos/gewiss.png",
  "OBO BETTERMANN": "/logos/obo.png",
  "ROCKWELL": "/logos/rockwell.png",
  "PEMSA": "/logos/pemsa.png",
  "FAMATEL": "/logos/famatel.png",
  "SALICRU": "/logos/salicru.png",
  "TUPERSA": "/logos/tupersa.png",
  "SODECA": "/logos/sodeca.png",
  "FINDER": "/logos/finder.png",
  "BEG": "/logos/beg.png",
  
  // Legacy names
  "Schneider Electric": "/logos/schneider.png",
  "Legrand": "/logos/legrand.png",
};

/**
 * Generate nice gradient colors for brands
 */
function getGradientForBrand(brandName) {
  if (!brandName) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  // Predefined gradient pairs - assign consistently based on brand name
  const gradients = [
    ['#667eea', '#764ba2'], // Purple
    ['#f093fb', '#f5576c'], // Pink
    ['#4facfe', '#00f2fe'], // Blue cyan
    ['#43e97b', '#38f9d7'], // Green
    ['#fa709a', '#fee140'], // Pink yellow
    ['#a8edea', '#fed6e3'], // Pastel
    ['#ff9a9e', '#fecfef'], // Rose
    ['#ffecd2', '#fcb69f'], // Peach
    ['#fbc2eb', '#a6c1ee'], // Lavender
    ['#ff6b6b', '#feca57'], // Red orange
    ['#84fab0', '#8fd3f4'], // Mint blue
    ['#cfd9df', '#e2ebf0'], // Silver
    ['#a1c4fd', '#c2e9fb'], // Light blue
    ['#d4fc79', '#96e6a1'], // Lime
    ['#e0c3fc', '#8ec5fc'], // Light purple
  ];
  
  // Hash brand name to get consistent gradient
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = brandName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  
  return `linear-gradient(135deg, ${gradients[index][0]} 0%, ${gradients[index][1]} 100%)`;
}

/**
 * Get initials from brand name (max 2 characters)
 */
function getInitials(brandName) {
  if (!brandName) return '??';
  
  const clean = brandName.trim().toUpperCase();
  
  // Handle multi-word brands
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return words[0].charAt(0) + words[1].charAt(0);
  }
  
  // Single word - take first 2 letters
  return clean.substring(0, 2).padEnd(2, '?');
}

/**
 * Get logo data for a brand
 * @returns {Object} { logo: string|null, initials: string, gradient: string }
 */
export function getBrandLogoData(brandName) {
  if (!brandName) {
    return { logo: null, initials: '??', gradient: getGradientForBrand('') };
  }
  
  const normalized = brandName.trim().toUpperCase();
  
  // Check local logos first (exact match)
  if (LOCAL_LOGOS[normalized]) {
    return { 
      logo: LOCAL_LOGOS[normalized], 
      initials: getInitials(normalized), 
      gradient: getGradientForBrand(normalized) 
    };
  }
  
  // Try case-insensitive
  const localKey = Object.keys(LOCAL_LOGOS).find(
    key => key.toUpperCase() === normalized
  );
  if (localKey) {
    return { 
      logo: LOCAL_LOGOS[localKey], 
      initials: getInitials(localKey), 
      gradient: getGradientForBrand(localKey) 
    };
  }
  
  // No local logo - return initials with gradient (no ugly backgrounds!)
  return { 
    logo: null, 
    initials: getInitials(normalized), 
    gradient: getGradientForBrand(normalized) 
  };
}

/**
 * Legacy function - returns logo URL or null
 */
export function getBrandLogo(brandName) {
  const data = getBrandLogoData(brandName);
  return data.logo;
}

/**
 * Legacy function - returns brand color
 */
export function getBrandColor(brandName) {
  const gradients = [
    '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
    '#a8edea', '#ff9a9e', '#ffecd2', '#fbc2eb', '#ff6b6b',
    '#84fab0', '#cfd9df', '#a1c4fd', '#d4fc79', '#e0c3fc'
  ];
  
  if (!brandName) return '#667eea';
  
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = brandName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

export default { getBrandLogo, getBrandColor, getBrandLogoData };