import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Search, 
  MapPin, 
  Calculator, 
  Megaphone, 
  Settings,
  Building2,
  Mail,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: ViewState.SOURCING, label: 'Sourcing & Veille', icon: Search },
    { id: ViewState.EMAIL_ALERTS, label: 'Alertes Emails', icon: Mail },
    { id: ViewState.FICHES_ANNONCES, label: 'Fiches Annonces', icon: FileText },
    { id: ViewState.ANALYSIS, label: 'Analyse Urbanisme', icon: MapPin },
    { id: ViewState.FINANCE, label: 'Montage Financier', icon: Calculator },
    { id: ViewState.MARKETING, label: 'Commercialisation', icon: Megaphone },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-10">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Building2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">MARCHAND GPT</h1>
          <p className="text-xs text-slate-400">v1.0.0 MVP</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors">
          <Settings size={20} />
          <span className="font-medium text-sm">Paramètres</span>
        </button>
        <div className="mt-4 px-4">
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-500">
            <p>Connecté en tant que :</p>
            <p className="text-slate-300 font-medium truncate">investisseur@immo.fr</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;