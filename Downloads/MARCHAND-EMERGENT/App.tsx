import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalysisModule from './components/AnalysisModule';
import FinancialModule from './components/FinancialModule';
import EmailAlertsModule from './components/EmailAlertsModule';
import FichesAnnoncesModule from './components/FichesAnnoncesModule';
import { ViewState } from './types';
import { Info } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [analysisAddress, setAnalysisAddress] = useState<string>('');
  
  // État pour gérer les URLs importées depuis le module Emails
  const [importedSourcingUrls, setImportedSourcingUrls] = useState<string[]>([]);

  const handleAnalyzeRequest = (address: string) => {
    setAnalysisAddress(address);
    setCurrentView(ViewState.ANALYSIS);
  };

  const handleEmailTransfer = (urls: string[]) => {
    setImportedSourcingUrls(urls);
    setCurrentView(ViewState.SOURCING);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.SOURCING:
        return <EmailAlertsModule onTransferToSourcing={handleEmailTransfer} />;
      case ViewState.EMAIL_ALERTS:
        return <EmailAlertsModule onTransferToSourcing={handleEmailTransfer} />;
      case ViewState.FICHES_ANNONCES:
        return <FichesAnnoncesModule />;
      case ViewState.ANALYSIS:
        return <AnalysisModule initialAddress={analysisAddress} />;
      case ViewState.FINANCE:
        return <FinancialModule />;
      case ViewState.MARKETING:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <Info size={48} />
            <h3 className="text-xl font-medium">Module Commercialisation</h3>
            <p>Génération d'annonces et suivi des leads (En développement)</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        {/* Top Bar / Breadcrumb Mock */}
        <div className="mb-8 flex justify-between items-center">
          <div className="text-sm text-slate-400 font-medium">
            MARCHAND GPT <span className="mx-2">/</span> {currentView}
          </div>
          <div className="flex gap-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 animate-pulse"></span>
            <span className="text-xs text-slate-500 font-medium">Système Opérationnel</span>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;