import React from 'react';
import { 
  TrendingUp, 
  Euro, 
  Briefcase, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, margin: 2400 },
  { name: 'Fév', revenue: 3000, margin: 1398 },
  { name: 'Mar', revenue: 9800, margin: 5200 },
  { name: 'Avr', revenue: 3908, margin: 2800 },
  { name: 'Mai', revenue: 4800, margin: 1890 },
  { name: 'Juin', revenue: 3800, margin: 2390 },
  { name: 'Juil', revenue: 12800, margin: 7490 },
];

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  change: string; 
  icon: React.ElementType; 
  color: string 
}> = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="text-emerald-600 font-medium flex items-center gap-1">
        <ArrowUpRight size={16} />
        {change}
      </span>
      <span className="text-slate-400 ml-2">vs mois dernier</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de Bord</h2>
        <p className="text-slate-500">Vue d'ensemble de votre activité de Marchand de Biens</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Marge Nette Potentielle" 
          value="142,500 €" 
          change="+12%" 
          icon={Euro} 
          color="bg-emerald-500 text-emerald-600" 
        />
        <StatCard 
          title="Opérations en cours" 
          value="3" 
          change="+1" 
          icon={Briefcase} 
          color="bg-indigo-500 text-indigo-600" 
        />
        <StatCard 
          title="Opportunités détectées" 
          value="28" 
          change="+5" 
          icon={TrendingUp} 
          color="bg-blue-500 text-blue-600" 
        />
        <StatCard 
          title="Délai moyen revente" 
          value="4.5 mois" 
          change="-2 sem" 
          icon={Clock} 
          color="bg-amber-500 text-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Projection Trésorerie & Marge</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" name="CA Projeté" />
                <Area type="monotone" dataKey="margin" stroke="#10b981" fill="transparent" strokeWidth={2} name="Marge Nette" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Dernières Activités</h3>
          <div className="space-y-4">
            {[
              { text: "Nouveau bien détecté à Malzéville", time: "2h", type: "sourcing" },
              { text: "Analyse PLU terminée : Rue de la Paix", time: "4h", type: "analysis" },
              { text: "Offre envoyée pour le Lot B", time: "1j", type: "offer" },
              { text: "Dossier bancaire généré", time: "1j", type: "doc" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  item.type === 'sourcing' ? 'bg-blue-500' : 
                  item.type === 'analysis' ? 'bg-purple-500' : 
                  item.type === 'offer' ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.text}</p>
                  <p className="text-xs text-slate-400">Il y a {item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            Voir tout l'historique
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;