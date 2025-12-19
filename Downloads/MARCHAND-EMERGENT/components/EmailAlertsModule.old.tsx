import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, Link as LinkIcon, ArrowRight, ExternalLink, CheckCircle2, AlertCircle, LogIn, Lock, Settings, Loader2, Copy, MonitorX, ShieldAlert } from 'lucide-react';

// Déclaration pour TypeScript
declare global {
  interface Window {
    google: any;
  }
}

// ID par défaut (fourni par l'utilisateur)
const DEFAULT_CLIENT_ID = "986942911932-rvvbu4qfdqg6a67ilhmpe71sasvlec20.apps.googleusercontent.com"; 

interface EmailAlertsModuleProps {
  onTransferToSourcing: (urls: string[]) => void;
}

interface PropertyData {
  price?: number;
  surface?: number;
  landSurface?: number;
  city?: string;
  propertyType?: string;
  url?: string;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  read: boolean;
  extractedLinks: string[];
  properties?: PropertyData[];
}

const MOCK_EMAILS: Email[] = [
  {
    id: 'mock-1',
    from: 'simulation@leboncoin.fr',
    subject: '[SIMULATION] 3 nouvelles annonces : Immeuble Nancy',
    date: '10:42',
    read: false,
    body: `Ceci est un email de simulation en attendant la connexion Gmail.\n\n1. Immeuble de rapport 4 lots - 180 000€\nhttps://www.leboncoin.fr/ad/ventes_immobilieres/2874593210\n\n2. Maison divisible secteur Gare\nhttps://www.leboncoin.fr/ad/ventes_immobilieres/23490234`,
    extractedLinks: [
      'https://www.leboncoin.fr/ad/ventes_immobilieres/2874593210',
      'https://www.leboncoin.fr/ad/ventes_immobilieres/23490234'
    ]
  }
];

const EmailAlertsModule: React.FC<EmailAlertsModuleProps> = ({ onTransferToSourcing }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('marchand_gpt_gmail_token');
  });
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalLinks, setGlobalLinks] = useState<string[]>([]);
  const [extractedProperties, setExtractedProperties] = useState<PropertyData[]>([]);
  
  // Gestion du Client ID avec persistance locale
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('marchand_gpt_google_client_id') || DEFAULT_CLIENT_ID;
  });
  
  const [showConfig, setShowConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [originUrl, setOriginUrl] = useState('');
  const [isIframe, setIsIframe] = useState(false);
  const [isSandboxBlocked, setIsSandboxBlocked] = useState(false);

  // Utilisation d'une ref pour éviter les problèmes de stale closure dans le setInterval
  const clientIdRef = useRef(clientId);
  useEffect(() => { clientIdRef.current = clientId; }, [clientId]);

  // Auto-reconnect if token exists in localStorage
  useEffect(() => {
    if (accessToken && !isConnected && !isSandboxBlocked) {
      setIsConnected(true);
      fetchGmailMessages(accessToken);
    }
  }, []);

  // 1. Détection Environnement & Sécurité (PROACTIVE)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      setOriginUrl(currentOrigin);
      
      // Detection Iframe Basique
      try {
        if (window.self !== window.top) {
          setIsIframe(true);
        }
      } catch (e) {
        setIsIframe(true);
      }

      // Detection Restriction Blob/Worker (Critique pour Google GSI)
      try {
        const blob = new Blob(["test"], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("⛔ Proactive Security Check: Blob creation failed. Sandbox detected.");
        setIsSandboxBlocked(true);
        setIsIframe(true);
        setErrorMsg("Sécurité Navigateur : L'authentification est bloquée dans cet environnement. Veuillez ouvrir dans un nouvel onglet.");
        setShowConfig(false);
      }
    }
  }, []);

  // 2. Global Error Listener (Fallback)
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      // Ces erreurs sont typiques de l'API Google dans une iframe restrictive
      if (event.message && (
          event.message.includes("Access to 'blob:") || 
          event.message.includes("storagerelay") ||
          event.message.includes("denied")
         )) {
        event.preventDefault(); // Tenter de supprimer l'erreur console
        
        if (!isSandboxBlocked) {
            console.warn("⛔ Reactive Security Check: Caught blob error.");
            setIsSandboxBlocked(true);
            setIsIframe(true);
            setErrorMsg("Blocage Iframe détecté. Fonctionnalité désactivée ici.");
            setShowConfig(false);
        }
      }
    };

    window.addEventListener('error', handleWindowError);
    return () => window.removeEventListener('error', handleWindowError);
  }, [isSandboxBlocked]);

  // 3. Correction automatique ID
  useEffect(() => {
    if (clientId && clientId.includes("YOUR_CLIENT_ID") && !DEFAULT_CLIENT_ID.includes("YOUR_CLIENT_ID")) {
      console.log("Auto-updating Client ID from placeholder to configured default.");
      setClientId(DEFAULT_CLIENT_ID);
      localStorage.setItem('marchand_gpt_google_client_id', DEFAULT_CLIENT_ID);
    }
  }, []);

  // 4. Vérifier si le script Google est chargé
  useEffect(() => {
    if (isSandboxBlocked) return; // Ne pas charger si bloqué

    const checkGoogleScript = setInterval(() => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        setGsiLoaded(true);
        clearInterval(checkGoogleScript);
        console.log("GSI Script detected.");
      }
    }, 500);
    return () => clearInterval(checkGoogleScript);
  }, [isSandboxBlocked]);

  // 5. Initialiser le client OAuth
  useEffect(() => {
    if (isSandboxBlocked) return; // Stop total

    if (gsiLoaded && clientId && !clientId.includes("YOUR_CLIENT_ID")) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/gmail.readonly',
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              console.log("Access Token received");
              const token = tokenResponse.access_token;
              setAccessToken(token);
              localStorage.setItem('marchand_gpt_gmail_token', token);
              setIsConnected(true);
              setShowConfig(false); 
              fetchGmailMessages(token);
            }
          },
          error_callback: (error: any) => {
             console.error("GSI Error:", error);
             if (error.type === 'popup_closed') {
               // Ce n'est pas une erreur critique, c'est l'utilisateur ou le sandbox
               setErrorMsg("Fenêtre fermée. Si elle ne s'est pas ouverte, votre navigateur bloque les popups.");
             } else if (String(error.type || error.message).includes('origin_mismatch')) {
               setErrorMsg("Erreur d'origine (Origin Mismatch). Vérifiez la console Google Cloud.");
               setShowConfig(true);
             } else {
               // Erreur inconnue, souvent liée au sandbox
               setErrorMsg("Erreur Google (" + (error.type || 'Unknown') + ").");
             }
          }
        });
        setTokenClient(client);
      } catch (e: any) {
        console.error("Erreur init Google Client", e);
        if (e.message?.includes("blob")) {
           setIsSandboxBlocked(true);
        } else {
           setErrorMsg("Erreur Init: " + e.message);
        }
      }
    }
  }, [gsiLoaded, clientId, originUrl, isSandboxBlocked]);

  const handleSaveClientId = (newId: string) => {
    setClientId(newId);
    localStorage.setItem('marchand_gpt_google_client_id', newId);
  };

  const handleLogin = () => {
    setErrorMsg('');

    if (isSandboxBlocked) {
       openInNewTab();
       return;
    }
    
    if (!clientId || clientId.includes("YOUR_CLIENT_ID") || !clientId.trim()) {
      setShowConfig(true);
      setErrorMsg("Veuillez d'abord configurer votre Google Client ID ci-dessous.");
      return;
    }

    if (!gsiLoaded) {
      setErrorMsg("Service Google non chargé.");
      return;
    }

    try {
      if (tokenClient) {
        tokenClient.requestAccessToken();
      } else {
        // Fallback lazy loading
        if (window.google && window.google.accounts) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            callback: (tokenResponse: any) => {
              if (tokenResponse.access_token) {
                const token = tokenResponse.access_token;
                setAccessToken(token);
                localStorage.setItem('marchand_gpt_gmail_token', token);
                setIsConnected(true);
                fetchGmailMessages(token);
              }
            },
            error_callback: (err: any) => {
               console.error("Lazy Init Error", err);
               if(err.type === 'popup_closed') {
                   setErrorMsg("Connexion annulée (Popup fermé).");
               } else {
                   setErrorMsg("Erreur connexion: " + err.type);
               }
            }
          });
          setTokenClient(client);
          client.requestAccessToken();
        } else {
          setErrorMsg("Client OAuth non prêt.");
        }
      }
    } catch (e: any) {
      console.error("Login exception:", e);
      if (e.message?.includes("blob") || e.name === 'SecurityError') {
        setIsSandboxBlocked(true);
        setErrorMsg("Blocage de sécurité détecté. Veuillez ouvrir dans un nouvel onglet.");
      } else {
        setErrorMsg("Exception: " + e.message);
      }
    }
  };

  const decodeBase64 = (data: string) => {
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(window.atob(base64)));
    } catch (e) {
      return "Contenu illisible";
    }
  };

  const extractLinks = (text: string): string[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const found: string[] = text.match(urlRegex) || [];
    return found
      .filter(url => 
        url.includes('.fr/vi/')
        && !url.includes('unsubscribe')
        && !url.includes('facebook')
      )
      .map(url => {
        // Nettoyer les slashes et paramètres parasites
        // Garder seulement le domaine + /vi/ + ID
        const match = url.match(/(https?:\/\/[^\/]+\/vi\/[0-9]+\.[^\/\?#]+)/);
        return match ? match[1] : url;
      });
  };

  const extractPropertyData = (body: string, url?: string): PropertyData => {
    const data: PropertyData = { url };
    
    // Prix (€)
    const priceMatch = body.match(/([0-9]{2,3}[\s\.]?[0-9]{3})[\s]?(?:€|euros?)/i);
    if (priceMatch) {
      data.price = parseInt(priceMatch[1].replace(/[\s\.]/g, ''));
    }
    
    // Surface habitable (m²)
    const surfaceMatch = body.match(/([0-9]{2,4})[\s]?m²?[\s]?(?:habitable)?/i);
    if (surfaceMatch) {
      data.surface = parseInt(surfaceMatch[1]);
    }
    
    // Surface terrain
    const landMatch = body.match(/terrain[\s:]+([0-9]{2,5})[\s]?m²?/i) || 
                      body.match(/([0-9]{3,5})[\s]?m²[\s]?(?:de\s)?terrain/i);
    if (landMatch) {
      data.landSurface = parseInt(landMatch[1]);
    }
    
    // Ville (codes postaux 5 chiffres + nom)
    const cityMatch = body.match(/([0-9]{5})[\s-]+([A-Za-zÀ-ÿ\s-]+)/i) ||
                      body.match(/(?:à|À)\s([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]+(?:[0-9]{5})?)/i);
    if (cityMatch) {
      data.city = cityMatch[0].trim();
    }
    
    // Type de bien
    const typeKeywords = [
      'maison', 'villa', 'pavillon', 'immeuble', 'appartement', 
      'terrain', 'local', 'garage', 'parking', 'loft'
    ];
    const bodyLower = body.toLowerCase();
    for (const type of typeKeywords) {
      if (bodyLower.includes(type)) {
        data.propertyType = type.charAt(0).toUpperCase() + type.slice(1);
        break;
      }
    }
    
    return data;
  };

  const fetchGmailMessages = async (accessToken: string) => {
    setIsRefreshing(true);
    setErrorMsg('');
    try {
      const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=subject:(alerte OR annonce OR immo OR maison OR appartement)', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!listResponse.ok) {
        const err = await listResponse.json();
        throw new Error(err.error?.message || "Erreur accès Gmail API");
      }
      
      const listData = await listResponse.json();
      
      if (!listData.messages || listData.messages.length === 0) {
        setIsRefreshing(false);
        setEmails([]); 
        setErrorMsg("Aucun email correspondant trouvé.");
        return;
      }

      const newEmails: Email[] = [];
      const promises = listData.messages.map(async (msg: any) => {
         const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          return detailResponse.json();
      });

      const details = await Promise.all(promises);

      for (const detailData of details) {
        const headers = detailData.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Sans objet)';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
        const dateRaw = headers.find((h: any) => h.name === 'Date')?.value;
        const date = dateRaw ? new Date(dateRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

        let body = detailData.snippet || "";
        if (detailData.payload.body && detailData.payload.body.data) {
           body = decodeBase64(detailData.payload.body.data);
        } else if (detailData.payload.parts) {
           const textPart = detailData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
           if (textPart && textPart.body.data) {
             body = decodeBase64(textPart.body.data);
           }
        }

        const links = extractLinks(body);
        
        // Extraire les propriétés pour chaque lien trouvé
        const properties: PropertyData[] = links.map(url => extractPropertyData(body, url));

        newEmails.push({
          id: detailData.id,
          from: from.replace(/<.*>/, '').trim(),
          subject,
          date,
          body,
          read: !detailData.labelIds.includes('UNREAD'),
          extractedLinks: links,
          properties
        });
      }
      setEmails(newEmails);

      // Auto-ajout des propriétés extraites
      const allProperties = newEmails.flatMap(email => email.properties || []);
      setExtractedProperties(allProperties);
      
      // Auto-ajout des liens .fr/vi à la liste d'import
      const allLinks = newEmails.flatMap(email => email.extractedLinks);
      const uniqueLinks = allLinks.filter((link, index, self) => self.indexOf(link) === index);
      setGlobalLinks(prev => {
        const combined = [...prev, ...uniqueLinks];
        return combined.filter((link, index, self) => self.indexOf(link) === index);
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur de récupération : " + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
  };

  const extractAndAddLinks = (email: Email) => {
    const newLinks = email.extractedLinks.filter(link => !globalLinks.includes(link));
    if (newLinks.length > 0) {
      setGlobalLinks(prev => [...prev, ...newLinks]);
    }
  };

  const handleTransfer = () => {
    if (globalLinks.length === 0) return;
    
    // Filtre strict: uniquement les liens .fr/vi/ et dédupliqués
    const validLinks = globalLinks
      .filter(link => link.includes('.fr/vi/'))
      .filter((link, index, self) => self.indexOf(link) === index);
    
    if (validLinks.length === 0) {
      alert("Aucun lien .fr/vi/ valide à transférer.");
      return;
    }
    
    onTransferToSourcing(validLinks);
    setGlobalLinks([]);
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="text-indigo-600" />
            Boîte de réception Alertes
          </h2>
          <div className="text-slate-500 flex items-center gap-2 mt-1">
            <span className="text-sm">Source :</span> 
            {isConnected ? (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 size={10} /> Gmail API Connectée
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                <Lock size={10} /> Mode Simulation
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
           {(isIframe || isSandboxBlocked) && (
             <button 
               onClick={openInNewTab}
               className={`p-2 rounded-lg border font-bold text-xs flex items-center gap-2 animate-pulse shadow-sm ${
                  isSandboxBlocked 
                  ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-md transform scale-105' 
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300'
               }`}
               title="Ouvrir dans un nouvel onglet pour corriger les erreurs Google Auth"
             >
               <MonitorX size={16} /> 
               {isSandboxBlocked ? "OUVRIR HORS SANDBOX (Requis)" : "Ouvrir hors Iframe"}
             </button>
           )}
           <button 
             onClick={() => setShowConfig(!showConfig)}
             className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
             title="Configuration API"
           >
             <Settings size={20} />
           </button>
           
           {!isSandboxBlocked ? (
             <button 
               onClick={() => {
                 if (isConnected && accessToken) {
                   fetchGmailMessages(accessToken);
                 } else {
                   handleLogin();
                 }
               }}
               disabled={!gsiLoaded && !isConnected}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                 isConnected 
                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                   : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
               }`}
             >
               {!gsiLoaded ? <Loader2 className="animate-spin" size={16} /> : (isConnected ? <RefreshCw size={16} /> : <LogIn size={16} />)}
               {isConnected ? 'Rafraîchir' : 'Connexion Gmail'} 
             </button>
           ) : (
             <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1 border border-red-200 cursor-not-allowed">
                <ShieldAlert size={14} /> Connexion Bloquée
             </div>
           )}
        </div>
      </header>

      {/* Zone de configuration ou d'erreur */}
      {isSandboxBlocked && (
         <div className="p-4 rounded-xl mb-2 animate-in fade-in slide-in-from-top-2 bg-red-50 border-2 border-red-200 text-red-900 shadow-md">
            <div className="flex items-start gap-3">
               <ShieldAlert size={32} className="text-red-600 flex-shrink-0 mt-1" />
               <div>
                 <h4 className="font-bold text-lg text-red-700 mb-1">Authentification Google Bloquée par le Navigateur</h4>
                 <p className="text-sm font-medium mb-2">
                   Cet éditeur de code s'exécute dans un environnement sécurisé ("Sandbox") qui interdit la création des ressources nécessaires à Google Sign-In (Blob/Workers).
                 </p>
                 <p className="text-xs bg-white p-2 rounded border border-red-100 text-red-800 mb-4">
                   Erreur technique : <code>Access to 'blob:...' from script denied</code>
                 </p>
                 <div>
                   <button 
                     onClick={openInNewTab}
                     className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow flex items-center gap-2 transition-transform hover:scale-105"
                   >
                     <ExternalLink size={18} />
                     OUVRIR L'APP DANS UN NOUVEL ONGLET
                   </button>
                 </div>
               </div>
            </div>
         </div>
      )}

      {/* Config Standard (Masquée si bloqué) */}
      {!isSandboxBlocked && (showConfig || errorMsg) && (
        <div className={`p-4 rounded-xl text-sm mb-2 animate-in fade-in slide-in-from-top-2 border ${errorMsg && !errorMsg.includes('Aucun email') ? 'bg-red-50 border-red-200 text-red-900' : 'bg-indigo-50 border-indigo-200 text-indigo-900'}`}>
           {errorMsg && (
             <div className="flex items-center gap-2 font-bold mb-3 text-red-600">
               <AlertCircle size={18} /> {errorMsg}
             </div>
           )}
           
           {(showConfig || !clientId || clientId.includes("YOUR_CLIENT_ID")) && (
             <div>
                <h4 className="font-bold mb-4 flex items-center gap-2 text-indigo-900 border-b border-indigo-200 pb-2">
                  <Settings size={18} /> Configuration OAuth 2.0
                </h4>
                
                {/* BLOC URL IMPORTANT */}
                <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={12} /> Origine détectée
                    </p>
                    {isIframe && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 rounded font-bold">MODE INTEGRÉ</span>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-amber-50 text-amber-900 p-2.5 rounded border border-amber-200 font-mono text-sm font-bold select-all break-all">
                      {originUrl}
                    </code>
                    <button 
                       className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300"
                       title="Copier"
                       onClick={() => { navigator.clipboard.writeText(originUrl); }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 italic">
                    Copiez cette URL exacte dans Google Cloud Console &gt; Identifiants &gt; Client OAuth &gt; <strong>Origines JavaScript autorisées</strong>.
                  </p>
                  {isIframe && (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      Conseil : Si la connexion échoue, utilisez le bouton "Ouvrir hors Iframe" en haut à droite.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-slate-700">Client ID Google :</label>
                  <input 
                    type="text" 
                    value={clientId} 
                    onChange={(e) => handleSaveClientId(e.target.value)} 
                    placeholder="ex: 123456789-abcde.apps.googleusercontent.com"
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    À récupérer dans <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline text-indigo-600 font-medium">Google Cloud Console</a> &gt; Identifiants.
                  </p>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Email List */}
        <div className="col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Réception</span>
            <div className="flex gap-2 items-center">
              {isRefreshing && <Loader2 size={12} className="animate-spin text-indigo-500" />}
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">
                {emails.length} emails
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {emails.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <div className="bg-slate-50 p-3 rounded-full"><Mail size={24} className="text-slate-300"/></div>
                <p className="text-slate-400 text-sm">Aucun email trouvé ou boîte vide.</p>
                {!isConnected && !isSandboxBlocked && <p className="text-xs text-indigo-400 cursor-pointer hover:underline" onClick={handleLogin}>Connectez-vous pour voir vos emails</p>}
              </div>
            ) : (
              emails.map(email => (
                <div 
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : !email.read ? 'bg-white border-l-4 border-l-indigo-200' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm truncate pr-2 ${!email.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                      {email.from}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{email.date}</span>
                  </div>
                  <h4 className={`text-sm mb-1 truncate ${!email.read ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                    {email.subject}
                  </h4>
                  {email.extractedLinks.length > 0 && (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                       <LinkIcon size={10} /> {email.extractedLinks.length} liens
                     </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Content */}
        <div className="col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {selectedEmail ? (
            <div className="flex flex-col h-full">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{selectedEmail.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded truncate max-w-[200px] text-xs">{selectedEmail.from}</span>
                    <span className="text-xs">Reçu à {selectedEmail.date}</span>
                  </div>
               </div>
               <div className="p-6 flex-1 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans custom-scrollbar">
                 {selectedEmail.body}
               </div>
               {selectedEmail.extractedLinks.length > 0 && (
                 <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                       <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                         <LinkIcon size={14} className="text-indigo-500"/>
                         Liens détectés ({selectedEmail.extractedLinks.length})
                       </h4>
                       <button 
                         onClick={() => extractAndAddLinks(selectedEmail)}
                         className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors font-medium shadow-sm"
                       >
                         Ajouter à la liste d'import
                       </button>
                    </div>
                    <ul className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {selectedEmail.extractedLinks.map((link, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-200 hover:border-indigo-300 transition-colors">
                           <ExternalLink size={12} className="flex-shrink-0 text-slate-400"/>
                           <a href={link} target="_blank" rel="noreferrer" className="truncate flex-1 hover:text-indigo-600 hover:underline">{link}</a>
                        </li>
                      ))}
                    </ul>
                 </div>
               )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                 <Mail size={32} className="text-slate-300" />
              </div>
              <p className="font-medium">Sélectionnez un email pour le lire</p>
              <p className="text-xs mt-2 opacity-70">Le contenu et les liens apparaîtront ici.</p>
            </div>
          )}
        </div>

        {/* Staging Area / Property Cards */}
        <div className="col-span-3 bg-slate-900 text-white rounded-xl shadow-lg flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-700 bg-slate-800/50">
             <h3 className="font-bold flex items-center gap-2 text-sm">
               <CheckCircle2 size={16} className="text-emerald-400"/>
               Biens extraits ({extractedProperties.length})
             </h3>
             <p className="text-[10px] text-slate-400 mt-1">
               Données analysées depuis les emails
             </p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
             {extractedProperties.length === 0 ? (
               <div className="text-center py-10 opacity-50 text-xs">
                 <p>Aucune propriété extraite.</p>
                 <p className="mt-2">Connectez-vous et actualisez pour extraire les données.</p>
               </div>
             ) : (
               extractedProperties.map((prop, idx) => (
                 <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-emerald-400">#{idx + 1}</span>
                     {prop.propertyType && (
                       <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                         {prop.propertyType}
                       </span>
                     )}
                   </div>
                   
                   <div className="space-y-1.5 text-xs mb-3">
                     {prop.price && (
                       <div className="flex justify-between">
                         <span className="text-slate-400">Prix:</span>
                         <span className="font-bold text-white">{prop.price.toLocaleString()} €</span>
                       </div>
                     )}
                     {prop.surface && (
                       <div className="flex justify-between">
                         <span className="text-slate-400">Surface:</span>
                         <span className="text-slate-300">{prop.surface} m²</span>
                       </div>
                     )}
                     {prop.landSurface && (
                       <div className="flex justify-between">
                         <span className="text-slate-400">Terrain:</span>
                         <span className="text-slate-300">{prop.landSurface} m²</span>
                       </div>
                     )}
                     {prop.city && (
                       <div className="flex justify-between">
                         <span className="text-slate-400">Ville:</span>
                         <span className="text-slate-300 text-[10px]">{prop.city}</span>
                       </div>
                     )}
                   </div>
                   
                   <div className="flex gap-2">
                     <button 
                       onClick={() => {
                         // Sauvegarder dans localStorage pour analyse croisée
                         const existing = JSON.parse(localStorage.getItem('marchand_analysis_data') || '[]');
                         existing.push({
                           ...prop,
                           extractedAt: new Date().toISOString(),
                           source: 'email'
                         });
                         localStorage.setItem('marchand_analysis_data', JSON.stringify(existing));
                         alert('Bien ajouté aux données d\'analyse !');
                       }}
                       className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-[10px] font-bold transition-colors"
                     >
                       Analyser
                     </button>
                     {prop.url && (
                       <a 
                         href={prop.url} 
                         target="_blank" 
                         rel="noreferrer"
                         className="w-9 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                       >
                         <ExternalLink size={12} />
                       </a>
                     )}
                   </div>
                 </div>
               ))
             )}
           </div>

           <div className="p-4 bg-slate-800/50 border-t border-slate-700">
              <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
                <span>Total annonces : {extractedProperties.length}</span>
              </div>
           </div>
        </div>

      </div>

      {/* Section Vignettes Annonces */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          📋 Annonces détectées ({extractedProperties.length})
        </h3>
        {extractedProperties.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">Aucune annonce à afficher. Connectez-vous et rafraîchissez les emails.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {extractedProperties.map((prop, idx) => {
              // Sélectionner l'image selon le type de bien
              const getImageUrl = (type?: string) => {
                if (!type) return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=400';
                
                const typeMap: { [key: string]: string } = {
                  'Maison': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
                  'Villa': 'https://images.unsplash.com/photo-1600596542815-e32870110044?auto=format&fit=crop&q=80&w=400',
                  'Immeuble': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=400',
                  'Appartement': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400',
                  'Terrain': 'https://images.unsplash.com/photo-1500382017468-f049863256f0?auto=format&fit=crop&q=80&w=400',
                  'Pavillon': 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=400',
                  'Loft': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400',
                };
                
                return typeMap[type] || typeMap['Maison'];
              };

              return (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="h-48 bg-slate-200 overflow-hidden relative group">
                    <img 
                      src={getImageUrl(prop.propertyType)} 
                      alt={prop.propertyType || 'Bien immobilier'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {prop.propertyType && (
                      <div className="absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-bold shadow-lg">
                        {prop.propertyType}
                      </div>
                    )}
                  </div>

                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900">Annonce #{idx + 1}</h4>
                  </div>

                {/* Body */}
                <div className="p-4 flex-1 space-y-3">
                  {prop.price && (
                    <div className="pb-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Prix</p>
                      <p className="text-xl font-bold text-emerald-600">{prop.price.toLocaleString()} €</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {prop.surface && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Surface</p>
                        <p className="font-semibold text-slate-800">{prop.surface} m²</p>
                      </div>
                    )}
                    {prop.landSurface && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Terrain</p>
                        <p className="font-semibold text-slate-800">{prop.landSurface} m²</p>
                      </div>
                    )}
                  </div>

                  {prop.city && (
                    <div className="pb-2 border-t border-slate-100 pt-2">
                      <p className="text-xs text-slate-500 mb-1">Localisation</p>
                      <p className="text-sm font-medium text-slate-700">{prop.city}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => {
                      const existing = JSON.parse(localStorage.getItem('marchand_analysis_data') || '[]');
                      existing.push({
                        ...prop,
                        extractedAt: new Date().toISOString(),
                        source: 'email'
                      });
                      localStorage.setItem('marchand_analysis_data', JSON.stringify(existing));
                      alert('Bien ajouté aux données d\'analyse !');
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-bold transition-colors"
                  >
                    Analyser
                  </button>
                  {prop.url && (
                    <a 
                      href={prop.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                      title="Voir l'annonce"
                    >
                      <ExternalLink size={16} className="text-slate-700" />
                    </a>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailAlertsModule;