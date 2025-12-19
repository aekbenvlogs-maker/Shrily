import React, { useState, useEffect } from 'react';
import { analyzeUrbanism } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { 
  MapPin, 
  Search, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  ExternalLink,
  Scale
} from 'lucide-react';

interface AnalysisModuleProps {
  initialAddress?: string;
}

const AnalysisModule: React.FC<AnalysisModuleProps> = ({ initialAddress }) => {
  const [address, setAddress] = useState('5 Chemin des Baillouteux 54220 Malzéville');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    setResult(null);

    // Call Gemini Service
    const data = await analyzeUrbanism(address);
    setResult(data);
    setIsLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="text-indigo-600" />
            Analyse Urbanisme & PLUi-HD
          </h2>
          <p className="text-slate-500 mt-1">
            Étude de faisabilité conditionnée par le zonage exact et règles d'urbanisme locales.
          </p>
        </div>
      </header>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleAnalyze} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adresse du bien à analyser
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Ex: 5 Chemin des Baillouteux 54220 Malzéville"
              />
              <MapPin className="absolute left-3 top-3.5 text-slate-400" size={20} />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Étude PLU en cours...
              </>
            ) : (
              <>
                <Search size={20} />
                Lancer l'audit
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Main Report */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Rapport d'analyse réglementaire
              </h3>
              <div className="flex gap-2">
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <Scale size={12}/> PLUi-HD Vérifié
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
                  IA Gemini
                </span>
              </div>
            </div>
            <div className="p-6 prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {result.markdown}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`p-6 rounded-xl border ${
              result.markdown.includes("✅") ? 'bg-emerald-50 border-emerald-200' :
              result.markdown.includes("❌") ? 'bg-red-50 border-red-200' :
              'bg-amber-50 border-amber-200'
            }`}>
              <h4 className={`font-bold text-lg mb-2 flex items-center gap-2 ${
                 result.markdown.includes("✅") ? 'text-emerald-800' :
                 result.markdown.includes("❌") ? 'text-red-800' :
                 'text-amber-800'
              }`}>
                {result.markdown.includes("✅") ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                Faisabilité
              </h4>
              <p className="text-sm text-slate-700">
                {result.markdown.includes("✅") 
                  ? "Zonage favorable au projet. Vérifiez les conditions spécifiques dans le rapport." 
                  : "Points de vigilance réglementaires identifiés sur le PLUi-HD."}
              </p>
            </div>

            {/* Sources */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Documents consultés</h4>
              {result.sources && result.sources.length > 0 ? (
                <ul className="space-y-3">
                  {result.sources.map((source, idx) => (
                    <li key={idx}>
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-start gap-2 text-sm text-indigo-600 hover:underline hover:text-indigo-800 transition-colors"
                      >
                        <ExternalLink size={14} className="mt-1 flex-shrink-0" />
                        <span className="line-clamp-2">{source.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">Aucune source web directe listée.</p>
              )}
            </div>

            {/* Next Steps Actions */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
              <h4 className="font-bold mb-4">Actions Administratives</h4>
              <div className="space-y-3">
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
                  Télécharger règlement de zone
                </button>
                <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                  Générer CERFA CUb
                </button>
                <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                  Contacter instructeur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisModule;