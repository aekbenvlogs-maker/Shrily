"use client"
import { Store, MapPin, Search } from 'lucide-react'
import { useState } from 'react'

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Couscous traditionnel',
    category: 'Restaurants',
    merchant: 'Test Restaurant Alger',
    wilaya: 'Alger',
    price: 15.5,
  },
]

export default function Marketplace() {
  const [type, setType] = useState<'produits' | 'commercants'>('produits')
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif font-bold mb-2">Marketplace</h1>
      <p className="text-gray-500 mb-8">Découvrez les produits et services de nos commerçants partenaires</p>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-10">
        <div className="flex-1 w-full">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit ou commerçant..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-[#1a7a4a] bg-[#fafafa]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        <select className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-700">
          <option>Toutes catégories</option>
        </select>
        <select className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-700">
          <option>EUR (€)</option>
        </select>
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${type === 'produits' ? 'bg-[#1a7a4a] text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setType('produits')}
          >
            Produits
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${type === 'commercants' ? 'bg-[#1a7a4a] text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setType('commercants')}
          >
            Commerçants
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {MOCK_PRODUCTS.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="relative bg-[#f5f5f5] h-80 flex items-center justify-center">
              <Store className="w-16 h-16 text-gray-300" />
              <span className="absolute top-3 left-3 bg-[#e8f5ee] text-[#1a7a4a] text-xs px-3 py-1 rounded-full font-medium">{p.category}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-lg mb-1">{p.name}</div>
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  {p.merchant} • {p.wilaya}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[#1a7a4a] font-bold text-lg">{p.price.toFixed(2)} €</span>
                <button className="bg-[#1a7a4a] text-white rounded-full px-5 py-2 text-sm font-semibold flex items-center gap-1 hover:bg-[#155f3a] transition">
                  + Ajouter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
