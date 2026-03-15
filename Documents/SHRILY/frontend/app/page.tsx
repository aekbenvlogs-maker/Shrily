import { CheckCircle, CreditCard, Gift, QrCode, Shield, Store } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
    return (
        <main>
            {/* HERO */}
            <section className="bg-[#f0faf4] min-h-[85vh] flex items-center">
                <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 bg-[#e8f5ee] text-[#1a7a4a] text-sm px-4 py-2 rounded-full mb-6">
                            🎁 La joie d&apos;offrir, sans frontières
                        </span>
                        <h1 className="text-5xl font-bold font-serif leading-tight mb-6">
                            Offrez des cadeaux à vos proches{' '}
                            <span className="text-[#1a7a4a]">en Algérie</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-lg mb-8">
                            Payez depuis l&apos;étranger en euros ou dollars, vos proches récupèrent leurs cadeaux chez nos commerçants partenaires grâce à un simple QR code.
                        </p>
                        <div className="flex gap-4 mb-10">
                            <Link href="/marketplace" className="bg-[#1a7a4a] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#155f3a]">
                                Découvrir les offres →
                            </Link>
                            <Link href="/comment-ca-marche" className="border border-gray-300 bg-white px-6 py-3 rounded-full font-semibold hover:bg-gray-50">
                                Comment ça marche
                            </Link>
                        </div>
                        <div className="flex gap-8">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Shield className="w-4 h-4 text-[#1a7a4a]" />
                                Paiement sécurisé
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Store className="w-4 h-4 text-[#1a7a4a]" />
                                Commerçants vérifiés
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Gift className="w-4 h-4 text-[#1a7a4a]" />
                                Large choix
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-gray-200 rounded-2xl h-96 w-full" />
                        <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                            <div className="bg-[#e8f5ee] p-2 rounded-lg">
                                <QrCode className="w-6 h-6 text-[#1a7a4a]" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Retrait facile</p>
                                <p className="text-gray-500 text-xs">Scannez &amp; récupérez</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* COMMENT CA FONCTIONNE */}
            <section className="bg-[#fafafa] py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-2">Comment ça fonctionne</h2>
                    <p className="text-gray-500 text-center mb-10">En 4 étapes simples, offrez un cadeau à vos proches en Algérie</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
                            <Gift className="w-8 h-8 text-[#1a7a4a] mb-2" />
                            <div className="w-7 h-7 bg-[#e8f5ee] rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-[#1a7a4a] font-bold">1</span></div>
                            <div className="font-semibold mb-2">Choisissez un cadeau</div>
                            <div className="text-xs text-gray-500">Parcourez notre sélection de produits et services proposés par des commerçants vérifiés en Algérie.</div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
                            <CreditCard className="w-8 h-8 text-[#1a7a4a] mb-2" />
                            <div className="w-7 h-7 bg-[#e8f5ee] rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-[#1a7a4a] font-bold">2</span></div>
                            <div className="font-semibold mb-2">Payez en EUR ou USD</div>
                            <div className="text-xs text-gray-500">Réglez votre commande en toute sécurité avec votre carte bancaire, depuis la France, le Canada ou ailleurs.</div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
                            <QrCode className="w-8 h-8 text-[#1a7a4a] mb-2" />
                            <div className="w-7 h-7 bg-[#e8f5ee] rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-[#1a7a4a] font-bold">3</span></div>
                            <div className="font-semibold mb-2">Partagez le QR code</div>
                            <div className="text-xs text-gray-500">Votre proche reçoit un QR code unique qu'il peut scanner en magasin pour récupérer son cadeau.</div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
                            <CheckCircle className="w-8 h-8 text-[#1a7a4a] mb-2" />
                            <div className="w-7 h-7 bg-[#e8f5ee] rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-[#1a7a4a] font-bold">4</span></div>
                            <div className="font-semibold mb-2">Retrait en boutique</div>
                            <div className="text-xs text-gray-500">Le bénéficiaire présente son code au commerçant et repart avec son cadeau. Simple et rapide !</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BANNER CTA */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-[#1a7a4a] rounded-2xl p-10 md:p-16 text-center text-white flex flex-col items-center justify-center">
                        <h3 className="text-2xl md:text-3xl font-serif font-bold mb-2">Prêt à faire plaisir&nbsp;?</h3>
                        <p className="text-white/80 mb-6">Rejoignez des milliers de personnes qui font déjà confiance à DiasporaGift pour gâter leurs proches.</p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <Link href="/inscription" className="bg-white text-[#1a7a4a] font-semibold rounded-full px-6 py-3 hover:bg-gray-100 transition">Créer un compte</Link>
                            <Link href="/inscription" className="border border-white text-white font-semibold rounded-full px-6 py-3 hover:bg-white hover:text-[#1a7a4a] transition">Devenir commerçant</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* AVANTAGES */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <Shield className="w-8 h-8 text-[#1a7a4a] mb-2" />
                        <div className="font-semibold mb-1">Paiement sécurisé</div>
                        <div className="text-xs text-gray-500">Transactions protégées par Stripe</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <Store className="w-8 h-8 text-[#1a7a4a] mb-2" />
                        <div className="font-semibold mb-1">Commerçants vérifiés</div>
                        <div className="text-xs text-gray-500">Partenaires de confiance en Algérie</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <Gift className="w-8 h-8 text-[#1a7a4a] mb-2" />
                        <div className="font-semibold mb-1">Large choix</div>
                        <div className="text-xs text-gray-500">Restaurants, boutiques, services...</div>
                    </div>
                </div>
            </section>
        </main>
    )
}
