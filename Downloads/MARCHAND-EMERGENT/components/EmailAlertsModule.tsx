/**
 * ============================================================================
 * ALERTS EMAILS - MODULE DE SOURCING IMMOBILIER
 * ============================================================================
 * 
 * CONTEXTE:
 *   Application SaaS pour automatiser la récupération et l'analyse d'annonces
 *   immobilières reçues par email (Leboncoin & équivalents).
 *
 * RESPONSABILITÉS:
 *   1. OAuth Google - Authentification sécurisée et gestion de tokens
 *   2. Extraction Emails - Récupération depuis Gmail API
 *   3. Parsing Intelligent - Extraction de données semi-structurées
 *   4. Vignettes UI - Affichage clair et optimisé
 *   5. Data Analysis - Préparation pour analyse et montage financier
 *
 * ARCHITECTURE:
 *   - Séparation claire des responsabilités
 *   - Services dédiés pour chaque domaine
 *   - Gestion d'erreurs robuste
 *   - Logs production-ready
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  LogIn,
  Lock,
  Settings,
  Loader2,
  ExternalLink,
  Trash2,
  Filter,
  Check
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface PropertyData {
  url?: string;
  price?: number;
  surface?: number;
  landSurface?: number;
  city?: string;
  propertyType?: 'maison' | 'immeuble' | 'villa' | 'terrain' | 'local' | 'autre';
}

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  read: boolean;
  extractedLinks: string[];
  properties: Map<string, PropertyData>;
}

interface ExtractedAnnonce {
  id: string;
  url: string;
  emailSource: string;
  emailDate: string;
  propertyData: PropertyData;
  extractedAt: Date;
  analyzed: boolean;
  analysisId?: string;
}

interface EmailAlertsModuleProps {
  onTransferToSourcing: (urls: string[]) => void;
}

// ============================================================================
// CONSTANTES & CONFIGURATION
// ============================================================================

const DEFAULT_CLIENT_ID = "986942911932-rvvbu4qfdqg6a67ilhmpe71sasvlec20.apps.googleusercontent.com";
const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';
const STORAGE_KEYS = {
  TOKEN: 'marchand_gpt_gmail_token',
  CLIENT_ID: 'marchand_gpt_google_client_id',
  ANNONCES: 'marchand_gpt_annonces_extracted'
};

// Données de simulation (jusqu'à la première connexion réelle)
const MOCK_EMAILS: Email[] = [
  {
    id: 'mock-1',
    from: 'alerts@leboncoin.fr',
    subject: '[LBC] 3 annonces correspondant à votre recherche',
    date: '14:30',
    read: false,
    body: `Bonjour,

Voici les 3 annonces correspondant à votre recherche :

1. Immeuble 4 lots - Nancy
   Prix: 180 000€
   Surface: 320m²
   Terrain: 500m²
   Type: Immeuble
   https://www.leboncoin.fr/vi/2874593210

2. Maison divisible - Secteur Gare
   Prix: 250 000€
   Surface: 180m²
   Type: Maison
   https://www.leboncoin.fr/vi/2874593211

3. Terrain constructible - Périphérie
   Surface terrain: 2500m²
   Type: Terrain
   https://www.leboncoin.fr/vi/2874593212

Cordialement,
LeBonCoin Alerts`,
    extractedLinks: [
      'https://www.leboncoin.fr/vi/2874593210',
      'https://www.leboncoin.fr/vi/2874593211',
      'https://www.leboncoin.fr/vi/2874593212'
    ],
    properties: new Map()
  }
];

// ============================================================================
// SERVICES MÉTIER - Extraction et Parsing
// ============================================================================

/**
 * Service d'extraction de données immobilières depuis du texte semi-structuré
 */
class PropertyExtractorService {
  /**
   * Extrait les données immobilières d'un corps de mail
   */
  static extractPropertyData(emailBody: string, url: string): PropertyData {
    const data: PropertyData = { url };

    // 1. Extraction du prix (€ 180 000, 180000€, EUR 180000, etc.)
    const pricePatterns = [
      /(?:Prix|Montant|PRIX)[:\s]+€?\s*([\d\s]+)\s*€?/i,
      /€\s*([\d\s]+)/,
      /([\d\s]+)\s*€/,
      /EUR\s+([\d\s]+)/i,
    ];
    for (const pattern of pricePatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        const priceStr = match[1].replace(/\s/g, '');
        const price = parseInt(priceStr, 10);
        if (!isNaN(price) && price > 10000) {
          data.price = price;
          break;
        }
      }
    }

    // 2. Extraction surface bien (m², m2, surface)
    const surfacePatterns = [
      /(?:Surface|surf|Surf|SURFACE)[:\s]+(\d+)\s*m²?/i,
      /(\d+)\s*m²/i,
      /(\d+)\s*m2/i,
    ];
    for (const pattern of surfacePatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        const surface = parseInt(match[1], 10);
        if (!isNaN(surface) && surface > 10) {
          data.surface = surface;
          break;
        }
      }
    }

    // 3. Extraction surface terrain (terrain, land)
    const landPatterns = [
      /(?:Terrain|TERRAIN)[:\s]+(\d+)\s*m²?/i,
      /(?:jardin|JARDIN)[:\s]+(\d+)\s*m²?/i,
      /(?:surface\s+terrain|SURFACE TERRAIN)[:\s]+(\d+)\s*m²?/i,
    ];
    for (const pattern of landPatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        const land = parseInt(match[1], 10);
        if (!isNaN(land) && land > 100) {
          data.landSurface = land;
          break;
        }
      }
    }

    // 4. Extraction de la ville (CP + Ville ou juste Ville)
    const cityPatterns = [
      /(?:Lieu|Ville|VILLE|Localité)[:\s]+([A-Za-zÀ-ÿ\s-]+)(?:[,\n]|$)/i,
      /(\d{5})\s+([A-Za-zÀ-ÿ\s-]+)/,
      /(?:Secteur|SECTEUR)[:\s]+([A-Za-zÀ-ÿ\s-]+)(?:[,\n]|$)/i,
    ];
    for (const pattern of cityPatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        const city = match[2] || match[1];
        if (city && city.trim().length > 2) {
          data.city = city.trim().split('\n')[0];
          break;
        }
      }
    }

    // 5. Extraction du type de bien (classification hiérarchique)
    const typePatterns = [
      { pattern: /maison/i, type: 'maison' as const },
      { pattern: /immeuble|collectif/i, type: 'immeuble' as const },
      { pattern: /villa/i, type: 'villa' as const },
      { pattern: /terrain|parcelle/i, type: 'terrain' as const },
      { pattern: /local|commerce|boutique/i, type: 'local' as const },
    ];
    for (const { pattern, type } of typePatterns) {
      if (pattern.test(emailBody)) {
        data.propertyType = type;
        break;
      }
    }

    return data;
  }

  /**
   * Extrait les URLs Leboncoin du contenu
   * Pattern: .fr/vi/ (annonces Leboncoin strictes)
   */
  static extractAnnounceUrls(text: string): string[] {
    if (!text) return [];

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const found = text.match(urlRegex) || [];

    return found
      .filter(url => {
        // Inclusion: .fr/vi/ (annonces LBC)
        if (!url.includes('.fr/vi/')) return false;

        // Exclusion: liens utilitaires non-pertinents
        if (url.includes('unsubscribe')) return false;
        if (url.includes('facebook')) return false;
        if (url.includes('tracking')) return false;

        return true;
      })
      .map(url => {
        // Nettoyage: remove trailing params
        return url.split('>')[0].split('"')[0].trim();
      });
  }
}

/**
 * Service de gestion OAuth Google
 */
class GoogleOAuthService {
  static initTokenClient(clientId: string, onTokenReceived: (token: string) => void) {
    return window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: (tokenResponse: GoogleTokenResponse) => {
        if (tokenResponse.access_token) {
          onTokenReceived(tokenResponse.access_token);
        }
      },
      error_callback: (error: any) => {
        console.error('OAuth Error:', error);
        throw error;
      }
    });
  }
}

/**
 * Service Gmail API
 */
class GmailService {
  static async fetchMessages(accessToken: string, maxResults: number = 15): Promise<Email[]> {
    try {
      // 1. Récupérer liste des messages
      const listResponse = await fetch(
        `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}&q=is:unread`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!listResponse.ok) {
        throw new Error(`Gmail API error: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const messageIds = listData.messages?.map((m: any) => m.id) || [];

      if (messageIds.length === 0) {
        return [];
      }

      // 2. Récupérer le détail de chaque message en parallèle
      const emailPromises = messageIds.map(id =>
        this.fetchMessageDetail(accessToken, id)
      );

      const emails = await Promise.all(emailPromises);
      return emails.filter(email => email !== null) as Email[];
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  private static async fetchMessageDetail(accessToken: string, messageId: string): Promise<Email | null> {
    try {
      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) return null;

      const message = await response.json();
      const headers = message.payload.headers;

      // Parser les headers
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name === name)?.value || '';

      const from = getHeader('From');
      const subject = getHeader('Subject');
      const date = new Date(parseInt(message.internalDate, 10));

      // Extraire le body (texte brut ou HTML)
      let body = '';
      if (message.payload.parts) {
        const textPart = message.payload.parts.find((p: any) =>
          p.mimeType === 'text/plain' || p.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = GmailService.decodeBase64(textPart.body.data);
        }
      } else if (message.payload.body?.data) {
        body = GmailService.decodeBase64(message.payload.body.data);
      }

      // Extraire liens et données
      const extractedLinks = PropertyExtractorService.extractAnnounceUrls(body);
      const properties = new Map<string, PropertyData>();

      extractedLinks.forEach(url => {
        const propData = PropertyExtractorService.extractPropertyData(body, url);
        properties.set(url, propData);
      });

      return {
        id: messageId,
        from,
        subject,
        date: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        body,
        read: message.labelIds?.includes('UNREAD') ? false : true,
        extractedLinks,
        properties
      };
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
      return null;
    }
  }

  private static decodeBase64(data: string): string {
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(window.atob(base64)));
    } catch {
      return '[Contenu non décodable]';
    }
  }
}

/**
 * Service de persistence des annonces extraites
 */
class AnnoncePersistenceService {
  static saveAnnonces(annonces: ExtractedAnnonce[]): void {
    localStorage.setItem(STORAGE_KEYS.ANNONCES, JSON.stringify(annonces));
  }

  static loadAnnonces(): ExtractedAnnonce[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ANNONCES);
    return stored ? JSON.parse(stored) : [];
  }

  static saveForAnalysis(annonce: ExtractedAnnonce): void {
    const data_analysis = {
      id: annonce.id,
      url: annonce.url,
      emailSource: annonce.emailSource,
      emailDate: annonce.emailDate,
      propertyData: annonce.propertyData,
      extractedAt: annonce.extractedAt.toISOString(),
      status: 'pending_analysis'
    };
    console.log('📊 Data prepared for analysis:', data_analysis);
  }
}

// ============================================================================
// COMPONENT PRINCIPAL
// ============================================================================

const EmailAlertsModule: React.FC<EmailAlertsModuleProps> = ({ onTransferToSourcing }) => {
  // État OAuth & Connexion
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.TOKEN)
  );
  const [tokenClient, setTokenClient] = useState<any>(null);

  // État Configuration
  const [clientId, setClientId] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || DEFAULT_CLIENT_ID
  );
  const [showConfig, setShowConfig] = useState(false);

  // État Données
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [extractedAnnonces, setExtractedAnnonces] = useState<ExtractedAnnonce[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // État UI
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Refs pour éviter les stale closures
  const clientIdRef = useRef(clientId);
  useEffect(() => {
    clientIdRef.current = clientId;
  }, [clientId]);

  // ========================================================================
  // LIFECYCLE - Initialisation Google GSI
  // ========================================================================

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGsiLoaded(true);
    };
    script.onerror = () => {
      setErrorMsg('Impossible de charger Google Sign-In');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // ========================================================================
  // LIFECYCLE - Auto-reconnexion si token existant
  // ========================================================================

  useEffect(() => {
    if (accessToken && !isConnected) {
      setIsConnected(true);
      refreshEmails(accessToken);
    }
  }, []);

  // ========================================================================
  // OAUTH - Authentification Google
  // ========================================================================

  const handleLogin = async () => {
    setErrorMsg('');

    if (!clientId?.trim() || clientId.includes('YOUR_CLIENT_ID')) {
      setShowConfig(true);
      setErrorMsg('⚠️ Veuillez d\'abord configurer votre Google Client ID');
      return;
    }

    if (!gsiLoaded) {
      setErrorMsg('⏳ Service Google en chargement...');
      return;
    }

    try {
      let client = tokenClient;
      if (!client) {
        client = GoogleOAuthService.initTokenClient(clientId, handleTokenResponse);
        setTokenClient(client);
      }
      client.requestAccessToken();
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(`❌ Erreur connexion: ${error.message}`);
    }
  };

  const handleTokenResponse = (token: string) => {
    setAccessToken(token);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    setIsConnected(true);
    refreshEmails(token);
    setSuccessMsg('✅ Connexion réussie!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogout = () => {
    setAccessToken(null);
    setIsConnected(false);
    setEmails(MOCK_EMAILS);
    setExtractedAnnonces([]);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setSuccessMsg('Déconnecté');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // ========================================================================
  // GMAIL - Récupération des emails
  // ========================================================================

  const refreshEmails = async (token: string) => {
    setIsRefreshing(true);
    setErrorMsg('');
    try {
      const fetchedEmails = await GmailService.fetchMessages(token);
      setEmails(fetchedEmails);
      setSuccessMsg(`📧 ${fetchedEmails.length} email(s) chargé(s)`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      console.error('Refresh error:', error);
      setErrorMsg(`❌ Erreur récupération: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ========================================================================
  // EXTRACTION - Récupération des annonces depuis les emails
  // ========================================================================

  const handleExtractAnnonces = () => {
    setErrorMsg('');
    const allAnnonces: ExtractedAnnonce[] = [];
    const processedUrls = new Set<string>();

    emails.forEach(email => {
      email.extractedLinks.forEach(url => {
        if (!processedUrls.has(url)) {
          processedUrls.add(url);

          const propertyData = email.properties.get(url) || {
            url,
            propertyType: 'autre' as const
          };

          const annonce: ExtractedAnnonce = {
            id: `annonce-${Date.now()}-${Math.random()}`,
            url,
            emailSource: email.from,
            emailDate: email.date,
            propertyData,
            extractedAt: new Date(),
            analyzed: false
          };

          allAnnonces.push(annonce);
        }
      });
    });

    setExtractedAnnonces(allAnnonces);
    setSuccessMsg(`🎯 ${allAnnonces.length} annonce(s) extraite(s)`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ========================================================================
  // TRANSFER - Envoi vers sourcing module
  // ========================================================================

  const handleTransferToSourcing = () => {
    if (extractedAnnonces.length === 0) {
      setErrorMsg('Aucune annonce à transférer');
      return;
    }

    const urls = extractedAnnonces.map(a => a.url);
    onTransferToSourcing(urls);
    setSuccessMsg('✅ Annonces transférées vers Sourcing');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // ========================================================================
  // ANALYSIS - Préparation pour analyse
  // ========================================================================

  const handlePrepareForAnalysis = (annonce: ExtractedAnnonce) => {
    AnnoncePersistenceService.saveForAnalysis(annonce);
    setSuccessMsg('📊 Données préparées pour analyse');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getPropertyTypeEmoji = (type?: string) => {
    const emojis: Record<string, string> = {
      maison: '🏠',
      immeuble: '🏢',
      villa: '🏡',
      terrain: '🌳',
      local: '🏪',
      autre: '📍'
    };
    return emojis[type || 'autre'] || '📍';
  };

  const formatPrice = (price?: number) => {
    if (!price) return '—';
    return `${price.toLocaleString('fr-FR')}€`;
  };

  const formatSurface = (surface?: number) => {
    if (!surface) return '—';
    return `${surface}m²`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="text-indigo-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Alertes Emails</h1>
              <p className="text-sm text-slate-600">
                {isConnected ? '✅ Connecté à Gmail' : '⏸️ Hors ligne (Mode démo)'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {isConnected ? (
              <>
                <button
                  onClick={() => refreshEmails(accessToken!)}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  Rafraîchir
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors font-medium text-sm"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <LogIn size={18} />
                Connecter Gmail
              </button>
            )}
          </div>
        </div>

        {/* Messages d'erreur/succès */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
            <Check className="text-green-600 flex-shrink-0" size={18} />
            <p className="text-green-700 text-sm">{successMsg}</p>
          </div>
        )}

        {/* Configuration Client ID */}
        {showConfig && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Lock size={18} />
              Configuration OAuth
            </h3>
            <input
              type="password"
              placeholder="Google Client ID"
              value={clientId}
              onChange={(e) => {
                const newId = e.target.value;
                setClientId(newId);
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId);
                setShowConfig(false);
                setSuccessMsg('✅ Client ID sauvegardé');
                setTimeout(() => setSuccessMsg(''), 2000);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Valider
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* LEFT: EMAILS LIST */}
        <div className="w-80 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Mail size={18} />
              Emails ({emails.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {emails.map(email => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-3 border-b border-slate-100 cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id
                    ? 'bg-indigo-50 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {email.subject.substring(0, 30)}...
                </p>
                <p className="text-xs text-slate-600 mt-1">{email.from}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {email.extractedLinks.length} annonce(s) • {email.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: EMAIL DETAIL & ANNONCES */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {selectedEmail ? (
            <>
              {/* Email Detail */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{selectedEmail.subject}</h3>
                <p className="text-sm text-slate-600 mb-3">
                  De: <span className="font-medium">{selectedEmail.from}</span>
                </p>
                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 max-h-32 overflow-y-auto">
                  {selectedEmail.body}
                </div>
              </div>

              {/* Annonces Grid */}
              <div className="flex-1 overflow-y-auto">
                <h3 className="font-bold text-slate-900 mb-3 px-2">
                  Annonces extraites ({selectedEmail.extractedLinks.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedEmail.extractedLinks.map(url => {
                    const prop = selectedEmail.properties.get(url) || {};
                    return (
                      <div key={url} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">
                            {getPropertyTypeEmoji(prop.propertyType)}
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mb-2">
                          {prop.city || 'Localisation inconnue'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-slate-50 p-2 rounded">
                            <p className="text-slate-600">💰 Prix</p>
                            <p className="font-semibold text-slate-900">
                              {formatPrice(prop.price)}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded">
                            <p className="text-slate-600">📐 Surface</p>
                            <p className="font-semibold text-slate-900">
                              {formatSurface(prop.surface)}
                            </p>
                          </div>
                          {prop.landSurface && (
                            <div className="col-span-2 bg-slate-50 p-2 rounded">
                              <p className="text-slate-600">🌳 Terrain</p>
                              <p className="font-semibold text-slate-900">
                                {formatSurface(prop.landSurface)}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const annonce = extractedAnnonces.find(a => a.url === url);
                            if (annonce) handlePrepareForAnalysis(annonce);
                          }}
                          className="w-full px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs font-medium transition-colors"
                        >
                          Analyser
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-300">
              <div className="text-center">
                <Mail className="text-slate-400 mx-auto mb-3" size={48} />
                <p className="text-slate-600 font-medium">Sélectionnez un email</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: EXTRACTED ANNONCES */}
        <div className="w-96 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Filter size={18} />
              Annonces Extraites
            </h2>
            <button
              onClick={handleExtractAnnonces}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors"
            >
              Extraire les annonces
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {extractedAnnonces.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500 text-sm">Aucune annonce extraite</p>
              </div>
            ) : (
              <div className="divide-y">
                {extractedAnnonces.map(annonce => (
                  <div key={annonce.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">
                        {getPropertyTypeEmoji(annonce.propertyData.propertyType)}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {annonce.propertyData.city || 'Localisation inconnue'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      {formatPrice(annonce.propertyData.price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {extractedAnnonces.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleTransferToSourcing}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowRight size={16} />
                Vers Sourcing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailAlertsModule;
