import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, ExternalLink, MapPin, Ruler, Euro, X, Leaf, Home, 
  Loader2, RefreshCw, AlertCircle, Link as LinkIcon, Save, Trash2, 
  Play, History, Plus, RotateCcw, CheckCircle2, ChevronRight, 
  Layers, List, FileText, Zap 
} from 'lucide-react';

// URL par défaut fournie
const DEFAULT_URL = "";

interface SavedSearch {
  id: number;
  name: string;
  url: string;
  date: string;
}

interface ScannerConfig {
  id: string;
  url: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  foundCount: number;
}

const DATABASE_MOCK = [
  { 
    id: 1, 
    title: 'Maison de ville avec jardin intimiste', 
    city: 'Nancy (54000)', 
    price: 189000, 
    surface: 95, 
    source: 'Leboncoin', 
    imageUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=400',
    link: 'https://www.leboncoin.fr/ad/ventes_immobilieres/2874593210',
    tags: ['Jardin', 'Travaux légers'],
    date: new Date('2025-12-12T10:00:00'),
    hasGarden: true,
    type: 'house'
  },
  { 
    id: 2, 
    title: 'Pavillon 1970 à rafraîchir', 
    city: 'Vandoeuvre-lès-Nancy (54500)', 
    price: 165000, 
    surface: 110, 
    source: 'Leboncoin', 
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=400',
    link: 'https://www.leboncoin.fr/ad/ventes_immobilieres/23490234',
    tags: ['Garage', 'Jardin 400m2'],
    date: new Date('2025-12-11T14:30:00'),
    hasGarden: true,
    type: 'house'
  },
  { 
    id: 3, 
    title: 'Appartement Hypercentre (Hors Critères)', 
    city: 'Nancy (54000)', 
    price: 140000, 
    surface: 60, 
    source: 'Leboncoin', 
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400',
    link: '#',
    tags: ['Centre'],
    date: new Date('2025-12-12T09:00:00'),
    hasGarden: false, 
    type: 'apartment'
  },
  { 
    id: 4, 
    title: 'Petite maison individuelle', 
    city: 'Essey-lès-Nancy (54270)', 
    price: 178000, 
    surface: 85, 
    source: 'Leboncoin', 
    imageUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=400',
    link: 'https://www.leboncoin.fr/ad/ventes_immobilieres/8832921',
    tags: ['Jardin', 'Calme'],
    date: new Date('2025-12-10T18:15:00'),
    hasGarden: true,
    type: 'house'
  },
  { 
    id: 5, 
    title: 'Maison de village avec cour/jardin', 
    city: 'Saint-Max (54130)', 
    price: 160000, 
    surface: 105, 
    source: 'Leboncoin', 
    imageUrl: 'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&q=80&w=400',
    link: 'https://www.leboncoin.fr/ad/ventes_immobilieres/1120394',
    tags: ['Rénové', 'Jardin'],
    date: new Date('2025-12-12T11:45:00'),
    hasGarden: true,
    type: 'house'
  },
  { 
    id: 6, 
    title: 'Maison hors budget', 
    city: 'Nancy', 
    price: 250000, 
    surface: 200, 
    source: 'Leboncoin', 
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-e32870110044',
    link: '#',
    tags: ['Luxe'],
    date: new Date('2025-12-12T08:00:00'),
    hasGarden: true,
    type: 'house'
  }
];

interface PropertyCardProps {
  property: any;
  onAnalyze: (address: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onAnalyze }) => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500/50 transition-all group flex flex-col h-full animate-in fade-in zoom-in duration-500">
    <div className="h-48 bg-slate-900 relative overflow-hidden">
       <img 
         src={property.imageUrl} 
         alt="Property" 
         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
       />
       <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white uppercase border border-white/10">
         {property.source}
       </div>
       {property.tags && (
         <div className="absolute bottom-2 left-2 flex gap-1">
           {property.tags.map((tag: string, i: number) => (
             <span key={i} className="px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-white font-medium border border-white/10">
               {tag}
             </span>
           ))}
         </div>
       )}
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-white font-bold text-lg truncate leading-tight flex-1">{property.title}</h3>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 ml-2 whitespace-nowrap">
          {property.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>
      
      <div className="flex items-center text-slate-400 text-sm mb-4">
        <MapPin size={14} className="mr-1 flex-shrink-0" /> {property.city}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="bg-slate-900/50 p-2 rounded flex items-center gap-2 text-sm text-slate-300 border border-slate-800">
           <Euro size={14} className="text-indigo-400" /> 
           <span className="font-semibold">{property.price.toLocaleString()}€</span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded flex items-center gap-2 text-sm text-slate-300 border border-slate-800">
           <Ruler size={14} className="text-emerald-400" /> 
           <span>{property.surface} m²</span>
        </div>
      </div>
      
      <div className="mt-auto flex gap-2">
        <button 
          onClick={() => onAnalyze(property.city)}
          className="flex-1 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20 hover:border-indigo-500"
        >
          Analyser
        </button>
        <a 
          href={property.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          title="Voir l'annonce originale"
        >
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  </div>
);

interface SourcingModuleProps {
  onAnalyze: (address: string) => void;
  externalImports?: string[];
}

const SourcingModule: React.FC<SourcingModuleProps> = ({ onAnalyze, externalImports }) => {
  const [scanners, setScanners] = useState<ScannerConfig[]>([]);
  const [activeProperties, setActiveProperties] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'batch'>('list');
  const [bulkText, setBulkText] = useState('');
  
  // Ref pour éviter le double import en strict mode si nécessaire, 
  // bien que la logique useEffect avec dépendance suffise généralement.
  const hasImportedRef = useRef(false);
  const processedImportsRef = useRef<Set<string>>(new Set());

  // Gérer l'import externe (depuis Email Alert par exemple)
  useEffect(() => {
    if (externalImports && externalImports.length > 0) {
      // Filtrer uniquement les .fr/vi/ 
      const validUrls = externalImports.filter(url => url.includes('.fr/vi/'));
      
      // Filtrer les URLs déjà traitées ou déjà présentes dans scanners
      const existingUrls = new Set(scanners.map(s => s.url));
      const uniqueNewUrls = validUrls.filter(url => 
        !existingUrls.has(url) && !processedImportsRef.current.has(url)
      );
      
      if (uniqueNewUrls.length === 0) return;
      
      // Marquer comme traités
      uniqueNewUrls.forEach(url => processedImportsRef.current.add(url));
      
      // Convertir en scanners
      const newScanners = uniqueNewUrls.map(url => ({
        id: Date.now() + Math.random().toString(),
        url: url,
        status: 'idle' as const,
        message: 'Importé via Email',
        foundCount: 0
      }));
      
      setScanners(prev => [...prev, ...newScanners]);
      setViewMode('list');
      
      // Ne lance PAS automatiquement les scans - attente du clic utilisateur
    }
  }, [externalImports]);

  // Chargement des sauvegardes
  useEffect(() => {
    const saved = localStorage.getItem('marchand_saved_searches');
    if (saved) setSavedSearches(JSON.parse(saved));
  }, []);

  // Persistance
  useEffect(() => {
    localStorage.setItem('marchand_saved_searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Actions Scanner
  const updateScanner = (id: string, updates: Partial<ScannerConfig>) => {
    setScanners(current => current.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addScannerRow = (initialUrl: string = '') => {
    setScanners([...scanners, { 
      id: Date.now().toString(), 
      url: initialUrl, 
      status: 'idle', 
      message: '', 
      foundCount: 0 
    }]);
  };

  const removeScannerRow = (id: string) => {
    if (scanners.length === 1) {
      updateScanner(id, { url: '', status: 'idle', message: '', foundCount: 0 });
    } else {
      setScanners(scanners.filter(s => s.id !== id));
    }
  };

  const saveSearch = (url: string) => {
    if (!url) return alert("URL vide !");
    const name = window.prompt("Nommez cette recherche :");
    if (name) {
      setSavedSearches([...savedSearches, { id: Date.now(), name, url, date: new Date().toLocaleDateString() }]);
    }
  };

  const deleteSavedSearch = (id: number) => {
    if (window.confirm("Supprimer cette sauvegarde ?")) {
      setSavedSearches(savedSearches.filter(s => s.id !== id));
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    // Détection si c'est un lot (plusieurs lignes)
    if (search.url.includes('\n')) {
       const urls = search.url.split('\n').map(u => u.trim()).filter(u => u);
       if(confirm(`Charger ce lot de ${urls.length} scanners ?`)) {
          const newScanners = urls.map(url => ({
            id: Date.now() + Math.random().toString(),
            url: url,
            status: 'idle' as const,
            message: 'En attente',
            foundCount: 0
          }));
          setScanners(prev => [...prev, ...newScanners]);
          setViewMode('list'); // On bascule en vue liste pour voir les scanners ajoutés
       }
    } else {
       // C'est une URL unique
       addScannerRow(search.url);
    }
  };

  const runScan = async (id: string, overrideUrl?: string) => {
    const scanner = scanners.find(s => s.id === id);
    // If overrideUrl is provided (batch mode), we use it, otherwise we take from state
    const urlToUse = overrideUrl || scanner?.url;
    
    if (!urlToUse) return;

    updateScanner(id, { status: 'loading', message: 'Analyse...', foundCount: 0 });

    try {
      // Simulation d'un délai réseau et analyse simple
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      
      // Simulation filtrage basé sur l'URL
      const results = DATABASE_MOCK.filter(() => Math.random() > 0.3); // Random results pour la démo

      updateScanner(id, { 
        status: 'success', 
        message: 'Terminé', 
        foundCount: results.length 
      });

      // Merge results avoiding duplicates
      setActiveProperties(prev => {
        const ids = new Set(prev.map(p => p.id));
        const newProps = results.filter(r => !ids.has(r.id));
        return [...newProps, ...prev];
      });

    } catch (e) {
      updateScanner(id, { status: 'error', message: 'URL Invalide' });
    }
  };

  const runAllScanners = () => {
    scanners.forEach((scanner, idx) => {
      if (scanner.url && scanner.status !== 'loading') {
        setTimeout(() => runScan(scanner.id), idx * 500);
      }
    });
  };

  const handleBulkImport = () => {
    const urls = bulkText.split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && u.includes('http'));
      
    if (urls.length === 0) {
      alert("Aucune URL valide trouvée.");
      return;
    }

    const newScanners = urls.map(url => ({
      id: Date.now() + Math.random().toString(),
      url: url,
      status: 'idle' as const,
      message: 'En attente',
      foundCount: 0
    }));

    setScanners(prev => [...prev, ...newScanners]);
    setBulkText('');
    setViewMode('list');

    // Auto run imported scanners
    newScanners.forEach((scanner, idx) => {
      setTimeout(() => runScan(scanner.id, scanner.url), idx * 800);
    });
  };

  const handleBulkSave = () => {
    if (!bulkText.trim()) {
      alert("Aucune URL à sauvegarder.");
      return;
    }

    const name = window.prompt("Nom de cette liste d'URLs (ex: Immeubles 54) :");
    if (name) {
      setSavedSearches(prev => [...prev, {
        id: Date.now(),
        name: name,
        url: bulkText.trim(), // On sauvegarde tout le bloc de texte
        date: new Date().toLocaleDateString()
      }]);
      alert("Liste sauvegardée avec succès !");
    }
  };

  return (
    <div className="space-y-6 bg-slate-900 p-8 rounded-2xl min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Sourcing Multi-Canal</h2>
          <p className="text-slate-400">Gérez vos scanners et centralisez les opportunités.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveProperties([])} className="text-xs text-slate-400 hover:text-white underline">Vider les résultats</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Colonne de Gauche : Bibliothèque */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <History size={16} className="text-indigo-400"/> Recherches Sauvegardées
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {savedSearches.length === 0 && (
                <p className="text-xs text-slate-500 italic">Aucune recherche sauvegardée.</p>
              )}
              {savedSearches.map(search => {
                const isBatch = search.url.includes('\n');
                const urlCount = isBatch ? search.url.split('\n').filter(x => x.trim()).length : 1;
                
                return (
                <div key={search.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-700 transition-all cursor-pointer" onClick={() => loadSavedSearch(search)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 font-medium truncate flex items-center gap-2">
                       {isBatch && <Layers size={12} className="text-indigo-400"/>}
                       {search.name}
                    </p>
                    {isBatch ? (
                       <p className="text-[10px] text-indigo-400 font-mono">Lot de {urlCount} liens</p>
                    ) : (
                       <p className="text-[10px] text-slate-500 truncate">{search.url}</p>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSavedSearch(search.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity ml-2"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* Colonne Centrale : Scanners */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
             
             {/* Header avec Onglets */}
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <List size={16} /> Mode Liste
                  </button>
                  <button 
                    onClick={() => setViewMode('batch')}
                    className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors ${viewMode === 'batch' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Layers size={16} /> Import Massif
                  </button>
                </div>
                <div className="text-xs text-slate-500">{scanners.length} scanners</div>
             </div>
             
             {/* VUE LISTE */}
             {viewMode === 'list' && (
               <>
                 {scanners.map((scanner, index) => (
                   <div key={scanner.id} className="flex flex-col md:flex-row gap-2 items-center bg-slate-800 p-2 rounded-lg border border-slate-700 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-xs text-slate-400 font-mono">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 w-full relative">
                        <input 
                          type="text" 
                          value={scanner.url}
                          onChange={(e) => updateScanner(scanner.id, { url: e.target.value })}
                          placeholder="Collez l'URL Leboncoin ici..."
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        {/* Status Badge */}
                        {scanner.status !== 'idle' && (
                           <div className={`px-2 py-1 rounded text-xs font-bold min-w-[80px] text-center ${
                             scanner.status === 'loading' ? 'bg-blue-500/20 text-blue-400' :
                             scanner.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                             'bg-red-500/20 text-red-400'
                           }`}>
                             {scanner.status === 'loading' ? <Loader2 className="animate-spin inline mr-1 h-3 w-3" /> : null}
                             {scanner.status === 'success' ? `+${scanner.foundCount} ` : scanner.message}
                           </div>
                        )}

                        <button 
                          onClick={() => runScan(scanner.id)}
                          disabled={scanner.status === 'loading'}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-50"
                          title="Lancer ce scan"
                        >
                          <Play size={16} />
                        </button>
                        
                        <button 
                          onClick={() => saveSearch(scanner.url)}
                          className="p-2 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-600 transition-colors"
                          title="Sauvegarder"
                        >
                          <Save size={16} />
                        </button>

                        <button 
                          onClick={() => removeScannerRow(scanner.id)}
                          className="p-2 bg-slate-900 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded border border-slate-600 transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                 ))}

                 <div className="flex gap-3 mt-4">
                   <button 
                     onClick={() => addScannerRow()}
                     className="flex-1 py-2 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-slate-800/50"
                   >
                     <Plus size={18} /> Ajouter une ligne
                   </button>
                   <button 
                     onClick={runAllScanners}
                     className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                   >
                     <Zap size={18} fill="currentColor" /> Tout Lancer
                   </button>
                 </div>
               </>
             )}

             {/* VUE BATCH */}
             {viewMode === 'batch' && (
               <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    <textarea 
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`https://www.leboncoin.fr/recherche?...\nhttps://www.leboncoin.fr/recherche?...\nhttps://www.leboncoin.fr/recherche?...`}
                      className="w-full h-64 bg-slate-800 border border-slate-600 rounded-xl p-4 text-sm text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-600"
                    />
                    <div className="absolute top-4 right-4 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">
                      1 URL par ligne
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                     <button 
                       onClick={() => setBulkText('')}
                       className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                     >
                       Effacer
                     </button>
                     <button 
                       onClick={handleBulkSave}
                       disabled={!bulkText.trim()}
                       className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 border border-slate-600"
                     >
                        <Save size={18} /> Sauvegarder
                     </button>
                     <button 
                       onClick={handleBulkImport}
                       disabled={!bulkText.trim()}
                       className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <FileText size={18} /> Importer et Lancer ({bulkText.split('\n').filter(l => l.includes('http')).length})
                     </button>
                  </div>
               </div>
             )}

          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="pt-4 border-t border-slate-800">
         <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-600/20 p-2 rounded text-indigo-400">
               <Home size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Résultats consolidés ({activeProperties.length})</h3>
         </div>

         {activeProperties.length === 0 ? (
           <div className="text-center py-20 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
             <Search className="mx-auto h-12 w-12 text-slate-600 mb-3" />
             <p className="text-slate-500">Lancez un ou plusieurs scanners pour voir apparaître les annonces ici.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {activeProperties.map((property, idx) => (
               <PropertyCard key={`${property.id}-${idx}`} property={property} onAnalyze={onAnalyze} />
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

export default SourcingModule;