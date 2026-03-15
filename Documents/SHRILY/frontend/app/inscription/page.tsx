"use client"
import { Lock, Mail, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function Inscription() {
    const [userType, setUserType] = useState<'client' | 'commercant'>('client')
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-bold text-center">Créer un compte</h2>
                    <span className="text-gray-500 text-sm text-center">Rejoignez DiasporaGift aujourd'hui</span>
                </div>
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1 mx-auto w-fit">
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${userType === 'client' ? 'bg-[#1a7a4a] text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setUserType('client')}
                    >
                        Client
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${userType === 'commercant' ? 'bg-[#1a7a4a] text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setUserType('commercant')}
                    >
                        Commerçant
                    </button>
                </div>
                <div className="text-xs text-gray-500 text-center mb-2">
                    {userType === 'client'
                        ? "Offrez des cadeaux à vos proches en Algérie"
                        : "Recevez des commandes de la diaspora dans votre boutique"}
                </div>
                <form className="flex flex-col gap-4">
                    <div className="relative">
                        <input type="text" placeholder="Nom complet" className="input pl-10" />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="relative">
                        <input type="email" placeholder="Email" className="input pl-10" />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="relative">
                        <input type="tel" placeholder="Téléphone (optionnel)" className="input pl-10" />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="relative">
                        <input type="password" placeholder="Mot de passe" className="input pl-10" />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <button type="submit" className="bg-[#1a7a4a] text-white rounded-full px-6 py-3 font-semibold mt-2 hover:bg-[#155f3a] transition w-full">
                        S'inscrire en tant que {userType === 'client' ? 'client' : 'commerçant'}
                    </button>
                </form>
                <div className="text-center text-xs text-gray-500 mt-2">
                    Déjà un compte ?{' '}
                    <Link href="/connexion" className="text-[#1a7a4a] font-semibold hover:underline">Se connecter</Link>
                </div>
            </div>
        </div>
    )
}
