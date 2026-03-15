import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-[#1a1a1a] text-white pt-16 pb-8 border-t border-gray-800 mt-16">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-white bg-opacity-10 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                        <span className="font-semibold text-white">Diaspora<span className="text-[#1a7a4a]">Gift</span></span>
                    </div>
                    <p className="text-gray-400 text-sm max-w-xs">Offrez des cadeaux à vos proches en Algérie, payez depuis l'étranger en toute sécurité.</p>
                </div>
                <div>
                    <h3 className="font-semibold mb-3 text-white">Liens utiles</h3>
                    <ul className="space-y-2">
                        <li><Link href="/marketplace" className="hover:text-[#1a7a4a] transition-colors">Marketplace</Link></li>
                        <li><Link href="/comment-ca-marche" className="hover:text-[#1a7a4a] transition-colors">Comment ça marche</Link></li>
                        <li><Link href="/qr" className="hover:text-[#1a7a4a] transition-colors">Scanner un QR code</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold mb-3 text-white">Contact</h3>
                    <ul className="space-y-2 text-sm">
                        <li>support@diasporagift.com</li>
                        <li>+33 1 23 45 67 89</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-400 text-sm">
                © 2026 DiasporaGift. Tous droits réservés.
            </div>
        </footer>
    )
}
