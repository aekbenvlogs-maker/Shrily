import { PropertyOpportunity, LbcSearchCriteria, LbcPayload, ApiConnectorConfig } from "../types";

const REAL_ESTATE_CATEGORY_ID = "9";

// --- BUILDER ---
const buildPayload = (criteria: LbcSearchCriteria): LbcPayload => {
  return {
    limit: 30,
    offset: 0,
    filters: {
      category: { id: REAL_ESTATE_CATEGORY_ID },
      enums: {
        ad_type: ["offer"],
        real_estate_type: criteria.real_estate_type || ["1", "4", "5"]
      },
      ranges: {
        price: { min: criteria.price_min, max: criteria.price_max },
        square: { min: criteria.square_min, max: criteria.square_max }
      },
      keywords: {
        text: criteria.query
      },
      location: {
        locations: (criteria.locations || ["54000"]).map(loc => ({
          locationType: "city",
          zipcode: loc
        }))
      }
    },
    sort_by: "time"
  };
};

// --- PROVIDER 1: LOBSTR ---
const fetchViaLobstr = async (payload: LbcPayload, apiKey: string): Promise<PropertyOpportunity[]> => {
  try {
    console.log("🚀 [LOBSTR] Running...");
    const response = await fetch('https://api.lobstr.io/v1/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        squid: "leboncoin-search-api", 
        param: payload 
      })
    });
    if (!response.ok) throw new Error(`Lobstr Error: ${response.statusText}`);
    const data = await response.json();
    // Mapper le résultat
    return (data.results || []).map((item: any) => mapToOpportunity(item, 'LBC'));
  } catch (error) {
    console.error("❌ Erreur Lobstr:", error);
    throw error;
  }
};

// --- PROVIDER 2: APIFY ---
const fetchViaApify = async (payload: LbcPayload, apiKey: string, apiUrl?: string): Promise<PropertyOpportunity[]> => {
  try {
    console.log("🚀 [APIFY] Running...");
    const endpoint = apiUrl || `https://api.apify.com/v2/acts/leboncoin-scraper/runs?token=${apiKey}`;
    
    // Apify uses a different payload structure usually, but for demo we assume it accepts our config
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        searchConfig: payload // Passing our payload to the actor
      })
    });
    
    if (!response.ok) throw new Error(`Apify Error: ${response.statusText}`);
    const data = await response.json();
    return (data.items || []).map((item: any) => mapToOpportunity(item, 'LBC'));
  } catch (error) {
    console.error("❌ Erreur Apify:", error);
    throw error;
  }
};

// --- PROVIDER 3: CUSTOM PROXY (PYTHON SERVER) ---
const fetchViaProxy = async (payload: LbcPayload, url?: string): Promise<PropertyOpportunity[]> => {
  if (!url) {
    console.error("❌ Custom Proxy URL is missing");
    throw new Error("Custom Proxy URL is missing");
  }
  try {
    console.log("🚀 [PROXY] Sending to " + url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Proxy Error: ${response.statusText} (Is server.py running?)`);
    
    const data = await response.json();
    console.log("✅ Proxy Response:", data);
    
    return (data.items || []).map((item: any) => mapToOpportunity(item, 'LBC'));
  } catch (error) {
    console.error("❌ Erreur Proxy:", error);
    throw error;
  }
};

// --- ORCHESTRATOR ---
export const searchLeboncoin = async (criteria: LbcSearchCriteria, config?: ApiConnectorConfig): Promise<PropertyOpportunity[]> => {
  const payload = buildPayload(criteria);
  
  if (!config) return generateMockResults(criteria.price_min || 150000);

  switch (config.provider) {
    case 'LOBSTR':
      return config.apiKey ? fetchViaLobstr(payload, config.apiKey) : [];
    
    case 'APIFY':
      return config.apiKey ? fetchViaApify(payload, config.apiKey, config.apiUrl) : [];

    case 'CUSTOM_PROXY':
      return fetchViaProxy(payload, config.apiUrl);

    case 'SIMULATION':
    default:
      console.log("⚠️ [DEV] Simulation Mode. Payload:", JSON.stringify(payload));
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateMockResults(criteria.price_min || 150000));
        }, 1500);
      });
  }
};

// --- HELPERS ---
const mapToOpportunity = (item: any, sourceName: 'LBC' | 'SeLoger'): PropertyOpportunity => ({
  id: item.id || Math.random().toString(),
  title: item.title || item.subject || "Titre inconnu",
  location: item.location?.city || item.zipcode || item.location || "Inconnu",
  price: item.price?.[0] || item.price || 0,
  marketValue: 0,
  score: 60,
  imageUrl: item.imageUrl || item.images?.[0] || item.image || "", // Compatible Python Server (imageUrl) et Lobstr (images)
  tags: [sourceName, 'API'],
  source: sourceName,
  url: item.url,
  publishedAt: new Date()
});

const generateMockResults = (basePrice: number): PropertyOpportunity[] => {
  return [
    {
      id: `lbc-${Date.now()}-1`,
      title: `Opportunité : Maison + Terrain (Simulation)`,
      location: 'Malzéville (54220)',
      price: basePrice + 25000,
      marketValue: basePrice * 1.4,
      score: 94,
      tags: ['Division possible', 'LBC API', 'Zone UB'],
      imageUrl: 'https://picsum.photos/400/300?random=10',
      source: 'LBC',
      url: 'https://www.leboncoin.fr',
      aiAnalysis: `Simulation IA: Façade importante détectée, division parcellaire probable.`,
      publishedAt: new Date()
    },
    {
      id: `lbc-${Date.now()}-2`,
      title: 'Grand terrain constructible (Simulation)',
      location: 'Nancy (54000)',
      price: basePrice + 60000,
      marketValue: (basePrice + 60000) * 1.3,
      score: 89,
      tags: ['Potentiel Immeuble', 'Déficit Foncier'],
      imageUrl: 'https://picsum.photos/400/300?random=11',
      source: 'LBC',
      url: 'https://www.leboncoin.fr',
      aiAnalysis: "Annonce récente LBC.",
      publishedAt: new Date(Date.now() - 1000 * 60 * 30)
    }
  ];
};