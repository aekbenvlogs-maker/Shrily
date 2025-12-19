
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SOURCING = 'SOURCING',
  ANALYSIS = 'ANALYSIS',
  FINANCE = 'FINANCE',
  MARKETING = 'MARKETING',
  EMAIL_ALERTS = 'EMAIL_ALERTS',
  FICHES_ANNONCES = 'FICHES_ANNONCES'
}

export interface PropertyOpportunity {
  id: string;
  title: string;
  location: string;
  price: number;
  marketValue: number;
  score: number;
  imageUrl: string;
  tags: string[];
  source?: 'LBC' | 'SeLoger' | 'BienIci' | 'Pap' | 'Notaires';
  url?: string;
  aiAnalysis?: string;
  publishedAt?: Date;
}

export interface AnalysisResult {
  markdown: string;
  sources?: { uri: string; title: string }[];
}

export interface SavedAlert {
  id: string;
  name: string;
  criteria: {
    priceMin: number;
    priceMax: number;
    landMin: number;
    landMax: number;
    keyword: string;
    detectDivision: boolean;
  };
  active: boolean;
  createdAt: Date;
}

// --- LEBONCOIN API SPECIFIC TYPES ---

export interface LbcSearchCriteria {
  query: string;
  price_min?: number;
  price_max?: number;
  square_min?: number;
  square_max?: number;
  locations?: string[]; // Code postal ou ville
  real_estate_type?: string[]; // 1=Maison, 2=Appt, 4=Terrain, 5=Immeuble
}

export interface LbcPayload {
  limit: number;
  offset: number;
  filters: {
    category: { id: string }; // 9 for Real Estate
    enums: { [key: string]: string[] };
    ranges: { [key: string]: { min?: number; max?: number } };
    keywords: { text: string };
    location: { locations: { locationType: string; zipcode?: string }[] };
  };
  sort_by: string;
}

// --- API CONNECTOR CONFIG ---

export interface ApiConnectorConfig {
  provider: 'SIMULATION' | 'LOBSTR' | 'APIFY' | 'CUSTOM_PROXY';
  apiKey?: string;
  apiUrl?: string; // URL du proxy ou de l'acteur Apify spécifique
  webhookUrl?: string; 
}