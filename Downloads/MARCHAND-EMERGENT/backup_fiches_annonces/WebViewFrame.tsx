// components/WebViewFrame.tsx
// Gestion sécurisée d'une iframe pour charger les pages annonces

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, ExternalLink, X } from 'lucide-react';

interface WebViewFrameProps {
  url: string;
  onContentLoaded?: (htmlContent: string) => void;
  onError?: (error: string) => void;
  title?: string;
  onClose?: () => void;
}

const WebViewFrame: React.FC<WebViewFrameProps> = ({
  url,
  onContentLoaded,
  onError,
  title,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadContent();
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      // Valider l'URL
      if (!isValidUrl(url)) {
        throw new Error('URL invalide');
      }

      // Vérifier si l'URL est accessible
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => {
        // no-cors peut échouer en dev, ce n'est pas un vrai problème
        return null;
      });

      // Charger dans l'iframe
      if (iframeRef.current) {
        // Utiliser un proxy si nécessaire pour contourner les CSP
        const iframeUrl = url; // Ou ajouter proxy si besoin
        iframeRef.current.src = iframeUrl;

        // Timeout si le contenu ne se charge pas
        timeoutRef.current = setTimeout(() => {
          if (loading) {
            setError('Chargement de la page trop long');
            setLoading(false);
          }
        }, 10000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  const handleIframeLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    try {
      // Essayer d'accéder au contenu HTML (si same-origin)
      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) {
        const htmlContent = iframeDoc.documentElement.outerHTML;
        onContentLoaded?.(htmlContent);
      }
    } catch (err) {
      // Cross-origin: on ne peut pas lire le DOM
      console.warn('Cannot access iframe content (cross-origin):', err);
    }
    
    setLoading(false);
  };

  const handleIframeError = () => {
    setError('Impossible de charger la page');
    onError?.('Impossible de charger la page');
    setLoading(false);
  };

  const openExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate text-sm">
            {title || url}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-1">{url}</p>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={openExternal}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            title="Ouvrir dans navigateur externe"
          >
            <ExternalLink size={18} className="text-slate-600" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Fermer"
            >
              <X size={18} className="text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
            <p className="text-sm text-slate-600">Chargement de l'annonce...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center bg-red-50">
          <div className="text-center px-6">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={32} />
            <p className="text-sm font-medium text-red-900 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={loadContent}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={openExternal}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 text-sm rounded-lg transition-colors"
              >
                Ouvrir dans navigateur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IFrame */}
      {!error && (
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className={`flex-1 border-0 ${loading ? 'hidden' : 'block'}`}
          title="Annonce immobilière"
          sandbox="allow-same-origin allow-scripts"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

/**
 * Valide une URL
 */
function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default WebViewFrame;
