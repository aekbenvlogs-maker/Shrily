import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Euro, Hammer, FileText, Wallet, Ruler } from 'lucide-react';
import { jsPDF } from 'jspdf';

const FinancialModule: React.FC = () => {
  // Detailed state for simulator
  const [purchasePrice, setPurchasePrice] = useState(200000); // Net Vendeur
  const [works, setWorks] = useState(50000);
  
  // Fees
  const [notaryFees, setNotaryFees] = useState(16000); // approx 8%
  const [agencyFees, setAgencyFees] = useState(10000); // approx 5%
  const [warrantyFees, setWarrantyFees] = useState(2500); // Bank guarantee / dossier
  
  // New specific fees
  const [surveyorFees, setSurveyorFees] = useState(1800); // Géomètre
  const [divisionFees, setDivisionFees] = useState(1200); // Frais de division / Taxes / Raccordement

  const [resalePrice, setResalePrice] = useState(350000);

  // Computed values
  const faiPrice = purchasePrice + agencyFees;
  const totalCost = purchasePrice + works + notaryFees + agencyFees + warrantyFees + surveyorFees + divisionFees;
  const margin = resalePrice - totalCost;
  const marginPercent = totalCost > 0 ? (margin / totalCost) * 100 : 0;

  const data = [
    { name: 'Achat Net', value: purchasePrice },
    { name: 'Travaux', value: works },
    { name: 'Frais Notaire', value: notaryFees },
    { name: 'Frais Agence', value: agencyFees },
    { name: 'Géomètre/Division', value: surveyorFees + divisionFees },
    { name: 'Frais Bancaires', value: warrantyFees },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BILAN FINANCIER OPÉRATIONNEL", 20, 20);
    doc.setFontSize(12);
    doc.text("Généré par MARCHAND GPT", 20, 30);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, pageWidth - 50, 30);

    let y = 50;
    const lineHeight = 8;
    const indent = 20;
    const col2 = 140;

    doc.setTextColor(0, 0, 0);

    // Section 1: Acquisition
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("1. ACQUISITION", 20, y);
    doc.line(20, y + 2, 80, y + 2);
    y += 15;
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text("Prix Net Vendeur", indent, y); doc.text(`${purchasePrice.toLocaleString()} €`, col2, y); y += lineHeight;
    doc.text("Frais d'Agence", indent, y); doc.text(`${agencyFees.toLocaleString()} €`, col2, y); y += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL FAI", indent, y); doc.text(`${faiPrice.toLocaleString()} €`, col2, y); y += lineHeight + 2;
    doc.setFont("helvetica", "normal");
    doc.text("Frais de Notaire (est.)", indent, y); doc.text(`${notaryFees.toLocaleString()} €`, col2, y); y += lineHeight;

    y += 10;

    // Section 2: Travaux & Technique
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("2. TRAVAUX & TECHNIQUE", 20, y);
    doc.line(20, y + 2, 100, y + 2);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text("Enveloppe Travaux", indent, y); doc.text(`${works.toLocaleString()} €`, col2, y); y += lineHeight;
    doc.text("Frais Géomètre", indent, y); doc.text(`${surveyorFees.toLocaleString()} €`, col2, y); y += lineHeight;
    doc.text("Frais Division / Taxes", indent, y); doc.text(`${divisionFees.toLocaleString()} €`, col2, y); y += lineHeight;

    y += 10;

    // Section 3: Financement
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("3. FRAIS FINANCIERS", 20, y);
    doc.line(20, y + 2, 80, y + 2);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text("Garantie / Frais Dossier", indent, y); doc.text(`${warrantyFees.toLocaleString()} €`, col2, y); y += lineHeight;

    y += 15;

    // TOTAUX
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(indent, y, pageWidth - indent, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("COÛT DE REVIENT TOTAL", indent, y); 
    doc.text(`${totalCost.toLocaleString()} €`, col2, y);
    y += 15;
    
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text("PRIX DE REVENTE ESTIMÉ", indent, y); 
    doc.text(`${resalePrice.toLocaleString()} €`, col2, y);
    y += 20;

    // Result Box
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(indent, y - 10, pageWidth - (indent * 2), 40, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("MARGE NETTE AVANT IMPÔT", indent + 10, y + 5);
    doc.setTextColor(resalePrice > totalCost ? 16 : 220, resalePrice > totalCost ? 185 : 38, resalePrice > totalCost ? 129 : 38);
    doc.text(`${margin.toLocaleString()} €`, col2, y + 5);

    doc.setTextColor(0, 0, 0);
    doc.text("RENTABILITÉ SUR COÛT", indent + 10, y + 20);
    doc.setTextColor(marginPercent > 10 ? 16 : 217, marginPercent > 10 ? 185 : 119, marginPercent > 10 ? 129 : 6);
    doc.text(`${marginPercent.toFixed(1)} %`, col2, y + 20);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Ce document est une simulation à titre indicatif et ne constitue pas une offre de prêt.", 20, 280);

    doc.save("Bilan_Financier_Marchand_GPT.pdf");
  };

  return (
    <div className="space-y-6">
       <header>
          <h2 className="text-2xl font-bold text-slate-900">Simulateur Financier</h2>
          <p className="text-slate-500">Calcul de marge détaillé avec frais annexes</p>
        </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column: Inputs grouped by category */}
        <div className="space-y-6">
          
          {/* Section 1: Acquisition */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
               <Euro size={18} className="text-indigo-600"/> 
               Acquisition
             </h3>
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix Net Vendeur (€)</label>
                    <input 
                      type="number" 
                      value={purchasePrice} 
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frais d'Agence (€)</label>
                    <input 
                      type="number" 
                      value={agencyFees} 
                      onChange={(e) => setAgencyFees(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                {/* Visual indicator for FAI */}
                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-100">
                  <span className="text-sm font-medium text-slate-500">Prix FAI (Frais Agence Inclus)</span>
                  <span className="font-bold text-slate-700">{faiPrice.toLocaleString()} €</span>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Frais de Notaire (Estimés) (€)</label>
                   <input 
                    type="number" 
                    value={notaryFees} 
                    onChange={(e) => setNotaryFees(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
             </div>
          </div>

          {/* Section 2: Opérationnel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Hammer size={18} className="text-indigo-600"/> 
                Travaux & Technique
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Enveloppe Travaux (€)</label>
                   <input 
                      type="number" 
                      value={works} 
                      onChange={(e) => setWorks(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Frais Géomètre (€)</label>
                   <input 
                      type="number" 
                      value={surveyorFees} 
                      onChange={(e) => setSurveyorFees(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Frais Division / Taxes (€)</label>
                   <input 
                      type="number" 
                      value={divisionFees} 
                      onChange={(e) => setDivisionFees(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>
             </div>
          </div>

          {/* Section 3: Financement & Sortie */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Wallet size={18} className="text-indigo-600"/>
                Financement & Sortie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frais Garantie/Banque (€)</label>
                    <input 
                      type="number" 
                      value={warrantyFees} 
                      onChange={(e) => setWarrantyFees(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">Prix Revente Estimé (€)</label>
                    <input 
                      type="number" 
                      value={resalePrice} 
                      onChange={(e) => setResalePrice(Number(e.target.value))}
                      className="w-full p-2 border border-emerald-300 rounded-lg bg-emerald-50 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-emerald-800"
                    />
                  </div>
              </div>
          </div>

        </div>

        {/* Right Column: Results & Charts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-lg mb-6 text-center text-slate-800">Répartition du Coût de Revient</h3>
            <div className="h-64 w-full mb-6">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} €`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100 mb-6">
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Coût total opération :</span>
                 <span className="font-bold text-slate-900">{totalCost.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Chiffre d'affaires :</span>
                 <span className="font-bold text-emerald-700">{resalePrice.toLocaleString()} €</span>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg transform transition-transform hover:scale-[1.02]">
              <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-700">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Marge Nette</p>
                  <p className={`text-2xl font-bold ${margin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {margin.toLocaleString()} €
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rentabilité</p>
                  <p className={`text-2xl font-bold ${marginPercent > 15 ? 'text-emerald-400' : marginPercent > 8 ? 'text-amber-400' : 'text-red-400'}`}>
                    {marginPercent.toFixed(1)} %
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <button 
                  onClick={handleGeneratePDF}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Générer Bilan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialModule;