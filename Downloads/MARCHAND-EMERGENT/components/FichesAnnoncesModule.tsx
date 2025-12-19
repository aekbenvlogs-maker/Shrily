// components/FichesAnnoncesModule.tsx
// Section principale pour la gestion et visualisation des fiches annonces

import React, { useState, useEffect } from 'react';
import { Plus, Download, Share2, TrendingUp, Trash2, FileText, Save, X, Search } from 'lucide-react';
import WebViewFrame from './WebViewFrame';
import { extractPropertyLocation, identifyPlatform } from '../services/propertyExtractorService';
import { saveFiche, getAllFiches, deleteFiche, getFiche, AnnonceFiche } from '../services/annoncePersistenceService';

interface FichesAnnoncesModuleProps {
  initialUrl?: string;
}

export const FichesAnnoncesModule: React.FC<FichesAnnoncesModuleProps> = ({ initialUrl }) => {
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl || '');
  const [fiches, setFiches] = useState<AnnonceFiche[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<AnnonceFiche | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les fiches au mount
  useEffect(() => {
    loadFiches();
    if (initialUrl) {
      setCurrentUrl(initialUrl);
    }
  }, []);

  const loadFiches = async () => {
    try {
      const allFiches = await getAllFiches();
      setFiches(allFiches);
    } catch (err) {
      console.error('Erreur lors du chargement des fiches:', err);
    }
  };

  /**
   * Gère le chargement du contenu du WebView
   */
  const handleContentLoaded = async (htmlContent: string) => {
    setLoading(true);
    try {
      // Créer un parser DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extraire les données
      const locationData = await extractPropertyLocation(doc, currentUrl);
      setExtractedData(locationData);

      // Pré-remplir le formulaire
      setEditForm({
        url: currentUrl,
        ville: locationData?.ville || '',
        secteur: locationData?.secteur || '',
        source: identifyPlatform(currentUrl),
        notes: ''
      });
    } catch (err) {
      console.error('Erreur lors de l\'extraction:', err);
      // Fallback: afficher des champs vides
      setEditForm({
        url: currentUrl,
        ville: '',
        secteur: '',
        source: identifyPlatform(currentUrl),
        notes: ''
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sauvegarde une fiche
   */
  const handleSaveFiche = async () => {
    try {
      const fiche: AnnonceFiche = {
        id: selectedFiche?.id || crypto.randomUUID(),
        url: editForm.url,
        ville: editForm.ville,
        secteur: editForm.secteur,
        source: editForm.source,
        dateModification: new Date().toISOString(),
        notes: editForm.notes || ''
      };

      await saveFiche(fiche);
      setEditMode(false);
      setSelectedFiche(fiche);
      await loadFiches();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde de la fiche');
    }
  };

  /**
   * Supprime une fiche
   */
  const handleDeleteFiche = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) return;
    
    try {
      await deleteFiche(id);
      if (selectedFiche?.id === id) {
        setSelectedFiche(null);
        setCurrentUrl('');
      }
      await loadFiches();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  /**
   * Filtre les fiches par recherche
   */
  const filteredFiches = fiches.filter(fiche =>
    fiche.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fiche.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fiche.url?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Fiches Annonces</h1>
              <p className="text-sm text-slate-600">{fiches.length} annonce{fiches.length !== 1 ? 's' : ''} sauvegardée{fiches.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="url"
            placeholder="https://www.leboncoin.fr/vi/..."
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => {
              if (currentUrl) {
                setSelectedFiche(null);
                setExtractedData(null);
              }
            }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
          >
            Charger
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left Panel: WebView */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentUrl ? (
            <>
              <WebViewFrame
                url={currentUrl}
                onContentLoaded={handleContentLoaded}
                title={extractedData?.ville ? `${extractedData.ville} - Annonce` : 'Annonce'}
              />
              
              {/* Extracted Data Display */}
              {extractedData && !editMode && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3">Données extraites</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 font-medium">Ville</p>
                      <p className="text-slate-900 font-semibold">{extractedData.ville || 'Non détecté'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium">Secteur</p>
                      <p className="text-slate-900 font-semibold">{extractedData.secteur || 'Non détecté'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Form */}
              {editMode && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                  <h3 className="font-bold text-slate-900 mb-3">Éditer la fiche</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Ville"
                      value={editForm.ville}
                      onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Secteur"
                      value={editForm.secteur}
                      onChange={(e) => setEditForm({ ...editForm, secteur: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      placeholder="Notes"
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveFiche}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> Enregistrer
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors font-medium text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!editMode && currentUrl && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors font-medium text-sm"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={handleSaveFiche}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Sauvegarder
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2">
                    <TrendingUp size={16} /> Analyser
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-slate-300">
              <div className="text-center">
                <FileText className="text-slate-400 mx-auto mb-3" size={48} />
                <p className="text-slate-600 font-medium">Entrez une URL pour commencer</p>
                <p className="text-slate-500 text-sm mt-1">Exemple: https://www.leboncoin.fr/vi/...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Fiches List */}
        <div className="w-80 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900 mb-3">Mes Fiches</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Fiches List */}
          <div className="flex-1 overflow-y-auto">
            {filteredFiches.length === 0 ? (
              <div className="p-4 text-center text-slate-600">
                <FileText size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune fiche sauvegardée</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredFiches.map((fiche) => (
                  <div
                    key={fiche.id}
                    onClick={() => {
                      setSelectedFiche(fiche);
                      setCurrentUrl(fiche.url);
                      setEditMode(false);
                    }}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedFiche?.id === fiche.id
                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{fiche.ville || 'Ville inconnue'}</p>
                        <p className="text-xs text-slate-600">{fiche.secteur || 'Secteur non spécifié'}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{fiche.source}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFiche(fiche.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors ml-2"
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FichesAnnoncesModule;
