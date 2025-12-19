// services/propertyExtractorService.ts
// Service pour l'extraction de données d'annonces immobilières depuis des pages web

export interface ExtractedLocationData {
  ville?: string;
  secteur?: string;
  prix?: number;
  surface?: number;
  terrainSurface?: number;
}

type Platform = 'LEBONCOIN' | 'NOTAIRES' | 'SELOGER' | 'BIENICI' | 'UNKNOWN';

/**
 * Identifie la plateforme à partir d'une URL
 */
export function identifyPlatform(url: string): Platform {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('leboncoin')) return 'LEBONCOIN';
    if (hostname.includes('notaires')) return 'NOTAIRES';
    if (hostname.includes('seloger')) return 'SELOGER';
    if (hostname.includes('bienici')) return 'BIENICI';
    return 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Extrait les données de localisation depuis une page annonce
 */
export async function extractPropertyLocation(
  dom: Document | string,
  url: string
): Promise<ExtractedLocationData> {
  const platform = identifyPlatform(url);
  let doc: Document;

  // Convertir la chaîne en Document si nécessaire
  if (typeof dom === 'string') {
    const parser = new DOMParser();
    doc = parser.parseFromString(dom, 'text/html');
  } else {
    doc = dom;
  }

  switch (platform) {
    case 'LEBONCOIN':
      return extractFromLeboncoin(doc);
    case 'NOTAIRES':
      return extractFromNotaires(doc);
    case 'SELOGER':
      return extractFromSeloger(doc);
    case 'BIENICI':
      return extractFromBienici(doc);
    default:
      return extractFromGeneric(doc);
  }
}

/**
 * Extraction spécifique LeBonCoin
 */
function extractFromLeboncoin(doc: Document): ExtractedLocationData {
  const result: ExtractedLocationData = {};

  // Chercher la ville (plusieurs emplacements possibles)
  const villeSelectors = [
    '[class*="city"]',
    '[class*="location"]',
    'h1 span:first-child',
    '[itemprop="addressLocality"]'
  ];

  for (const selector of villeSelectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent) {
      result.ville = cleanText(element.textContent);
      break;
    }
  }

  // Chercher le secteur/quartier
  const secteurSelectors = [
    '[class*="district"]',
    '[class*="sector"]',
    '[class*="neighborhood"]',
    'span[class*="subtitle"]'
  ];

  for (const selector of secteurSelectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent) {
      const text = cleanText(element.textContent);
      if (text && text !== result.ville) {
        result.secteur = text;
        break;
      }
    }
  }

  // Fallback: chercher dans le texte de la page
  if (!result.ville) {
    const bodyText = doc.body.innerText;
    const villeMatch = bodyText.match(/(?:Lieu|Ville|Localité)[:\s]*([A-Za-zÀ-ÿ\s-]+)/i);
    if (villeMatch) {
      result.ville = cleanText(villeMatch[1]);
    }
  }

  return result;
}

/**
 * Extraction spécifique Notaires
 */
function extractFromNotaires(doc: Document): ExtractedLocationData {
  const result: ExtractedLocationData = {};

  // Chercher la ville
  const villeElement = doc.querySelector('[class*="localite"], h1, [data-location]');
  if (villeElement) {
    const text = cleanText(villeElement.textContent || '');
    const match = text.match(/([A-Za-zÀ-ÿ\s-]+)/);
    if (match) {
      result.ville = match[1];
    }
  }

  // Chercher le prix
  const priceElement = doc.querySelector('[class*="prix"], [class*="price"]');
  if (priceElement) {
    const priceText = cleanText(priceElement.textContent || '');
    const priceMatch = priceText.match(/(\d+(?:\s?\d{3})*)/);
    if (priceMatch) {
      result.prix = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
    }
  }

  return result;
}

/**
 * Extraction spécifique SeLoger
 */
function extractFromSeloger(doc: Document): ExtractedLocationData {
  const result: ExtractedLocationData = {};

  // Chercher la ville dans les meta tags
  const villeMetaTag = doc.querySelector('meta[property="og:title"]');
  if (villeMetaTag) {
    const title = villeMetaTag.getAttribute('content') || '';
    const match = title.match(/([A-Za-zÀ-ÿ\s-]+)\s*\(/);
    if (match) {
      result.ville = cleanText(match[1]);
    }
  }

  // Fallback: chercher dans les headings
  const h1 = doc.querySelector('h1, [class*="title"]');
  if (h1 && !result.ville) {
    const text = cleanText(h1.textContent || '');
    const parts = text.split('à');
    if (parts.length > 1) {
      result.ville = cleanText(parts[parts.length - 1].split('(')[0]);
    }
  }

  return result;
}

/**
 * Extraction spécifique BienIci
 */
function extractFromBienici(doc: Document): ExtractedLocationData {
  const result: ExtractedLocationData = {};

  // Chercher dans les data attributes
  const dataVille = doc.querySelector('[data-city], [data-ville]');
  if (dataVille) {
    result.ville = cleanText(dataVille.getAttribute('data-city') || dataVille.getAttribute('data-ville') || '');
  }

  // Fallback: chercher dans les textes
  if (!result.ville) {
    const heading = doc.querySelector('h1, .h1, [class*="title"]');
    if (heading) {
      const text = cleanText(heading.textContent || '');
      result.ville = text.split(',')[0];
    }
  }

  return result;
}

/**
 * Extraction générique pour les sites inconnus
 */
function extractFromGeneric(doc: Document): ExtractedLocationData {
  const result: ExtractedLocationData = {};

  // Chercher la ville dans les headings
  const heading = doc.querySelector('h1');
  if (heading) {
    const text = cleanText(heading.textContent || '');
    result.ville = text.split(',')[0] || text.split('à')[0];
  }

  // Chercher dans le texte de la page
  const bodyText = doc.body.innerText;
  if (!result.ville) {
    const villeMatch = bodyText.match(/(?:Ville|Localité|Quartier)[:\s]*([A-Za-zÀ-ÿ\s-]+)/i);
    if (villeMatch) {
      result.ville = cleanText(villeMatch[1]);
    }
  }

  return result;
}

/**
 * Nettoie un texte extrait
 */
function cleanText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[,;/]/)[0]
    .trim();
}

export default {
  extractPropertyLocation,
  identifyPlatform
};
