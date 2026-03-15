"use client"
import { Lock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function Connexion() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
                <Link href="/" className="text-xs text-gray-400 mb-2 hover:underline w-fit">← Retour à l'accueil</Link>
                <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="w-12 h-12 bg-[#e8f5ee] rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6 text-[#1a7a4a]" />
                    </div>
                    <h2 className="text-xl font-bold text-center">Connexion</h2>
                    <span className="text-gray-500 text-xs text-center">Connectez-vous pour accéder à votre compte</span>
                </div>
                <form className="flex flex-col gap-4">
                    <div className="relative">
                        <input type="email" placeholder="Email" className="input pl-10" />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="relative">
                        <input type="password" placeholder="Mot de passe" className="input pl-10" />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <button type="submit" className="bg-[#1a7a4a] text-white rounded-full px-6 py-3 font-semibold mt-2 hover:bg-[#155f3a] transition w-full">
                        Se connecter
                    </button>
                </form>
                <div className="text-center text-xs text-gray-500 mt-2">
                    Pas encore de compte ?{' '}
                    <Link href="/inscription" className="text-[#1a7a4a] font-semibold hover:underline">S'inscrire</Link>
                </div>
            </div>
        </div>
    )
}
