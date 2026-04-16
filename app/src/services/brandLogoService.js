/**
 * Brand Logo Service - Clean Version
 * 
 * Uses text-based avatars with nice gradient backgrounds
 * No external API dependencies to avoid ugly logo backgrounds
 */

const LOCAL_LOGOS = {
  // Brands with actual logo files in /public/logos/
  "SCHNEIDER ELECTRIC": "/logos/schneider.png",
  "ABB": "/logos/abb.png",
  "SIEMENS": "/logos/siemens.jpg",
  "HAGER": "/logos/hager.png",
  "MITSUBISHI ELECTRIC": "/logos/mitsubishi.png",
  "IFM": "/logos/ifm.jpg",
  "IFM ELECTRONIC": "/logos/ifm.jpg",
  "PEPPERL+FUCHS": "/logos/pepperl.png",
  "PHILIPS": "/logos/philips.jpg",
  "PHILIPS LIGHTING": "/logos/philips.jpg",
  "LEDVANCE": "/logos/ledvance.jpg",
  "ZEMPER": "/logos/zemper.png",
  "WALLBOX": "/logos/wallbox.png",
  "FRONIUS": "/logos/fronius.png",
  "SMA": "/logos/sma.png",
  "SMA SOLAR": "/logos/sma.png",
  "PYLONTECH": "/logos/pylontech.png",
  // Case variants
  "Schneider Electric": "/logos/schneider.png",
  "Abb": "/logos/abb.png",
  "Siemens": "/logos/siemens.jpg",
  "Hager": "/logos/hager.png",
  "Mitsubishi Electric": "/logos/mitsubishi.png",
  "IFM Electronic": "/logos/ifm.jpg",
  "Pepperl+Fuchs": "/logos/pepperl.png",
  "Philips": "/logos/philips.jpg",
  "Philips Lighting": "/logos/philips.jpg",
  "Ledvance": "/logos/ledvance.jpg",
  "Zemper": "/logos/zemper.png",
  "Wallbox": "/logos/wallbox.png",
  "Fronius": "/logos/fronius.png",
  "SMA Solar": "/logos/sma.png",
  "Pylontech": "/logos/pylontech.png",
  // Brands with real products but fallback to gradient
  "LEGRAND": null,
  "SIMON": null,
  "NEXANS": null,
  "BTICINO": null,
  "EATON": null,
  "WAGO": null,
  "CAME": null,
  "HIKVISION": null,
  "TELEVES": null,
  "FERMAX": null,
  "UNEX": null,
  "FINDER": null,
  "GENERAL CABLE": null,
  "PRYSMIAN": null,
  "GEWISS": null,
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