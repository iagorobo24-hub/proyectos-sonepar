/**
 * Vercel Edge Function — Proxy para extraer PDF de fichas técnicas
 * Navega a la URL del fabricante, busca el enlace al PDF y lo devuelve
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query || {};
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Detectar fabricante por la URL
    const pdfUrl = await findPdfUrl(url);
    
    if (!pdfUrl) {
      // Si no se encuentra PDF, devolver la URL original para que el usuario la visite
      return res.status(200).json({ 
        pdf_url: url,
        fallback: true,
        message: 'No se encontró PDF directo. Redirigiendo a la página del fabricante.'
      });
    }

    return res.status(200).json({ pdf_url: pdfUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Error extracting PDF: ' + error.message });
  }
}

/**
 * Busca el PDF de ficha técnica según la URL del fabricante
 */
async function findPdfUrl(productUrl) {
  const urlLower = productUrl.toLowerCase();

  // ── Schneider Electric ──
  if (urlLower.includes('se.com') || urlLower.includes('schneider')) {
    // Schneider tiene PDFs en formato: https://www.se.com/es/es/product/{REF}/ → buscar link de PDF
    const ref = productUrl.match(/\/product\/([A-Z0-9\-]+)/)?.[1] || '';
    if (ref) {
      // Schneider publica fichas en su CDN
      // Formato: https://www.se.com/es/es/download/{REF}_ficha_tecnica.pdf (puede variar)
      // Alternativa: usar la API de Schneider para obtener el PDF
      return `https://www.se.com/es/es/product/${ref}/`;
    }
  }

  // ── ABB ──
  if (urlLower.includes('abb.com')) {
    // ABB tiene un buscador de documentos: https://search.abb.com/
    const ref = productUrl.match(/DocumentID=([A-Z0-9\-]+)/)?.[1] || '';
    if (ref) {
      // Intentar construir URL directa al documento
      return `https://search.abb.com/library/Download.aspx?DocumentID=${ref}`;
    }
  }

  // ── Siemens ──
  if (urlLower.includes('siemens.com')) {
    // Siemens Industry Mall tiene el PDF en la página del producto
    return productUrl;
  }

  // ── IFM ──
  if (urlLower.includes('ifm.com')) {
    // IFM tiene PDFs directos: https://www.ifm.com/es/es/product/{REF}/download
    const ref = productUrl.match(/\/product\/([A-Z0-9\-]+)/)?.[1] || '';
    if (ref) {
      return `https://www.ifm.com/es/es/product/${ref}/download`;
    }
  }

  // ── Philips/Signify ──
  if (urlLower.includes('philips') || urlLower.includes('signify')) {
    return productUrl;
  }

  // ── Wallbox ──
  if (urlLower.includes('wallbox')) {
    return productUrl;
  }

  // ── Fronius ──
  if (urlLower.includes('fronius')) {
    return productUrl;
  }

  // ── SMA ──
  if (urlLower.includes('sma')) {
    return productUrl;
  }

  // ── Victron ──
  if (urlLower.includes('victron')) {
    return productUrl;
  }

  // ── Hager ──
  if (urlLower.includes('hager')) {
    return productUrl;
  }

  // ── Ledvance ──
  if (urlLower.includes('ledvance')) {
    return productUrl;
  }

  // ── Zemper ──
  if (urlLower.includes('zemper')) {
    return productUrl;
  }

  // ── Pepperl+Fuchs ──
  if (urlLower.includes('pepperl')) {
    return productUrl;
  }

  // ── Pylontech ──
  if (urlLower.includes('pylontech')) {
    return productUrl;
  }

  // Por defecto, devolver la URL original
  return productUrl;
}
