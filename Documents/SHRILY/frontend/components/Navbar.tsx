"use client"
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/comment-ca-marche', label: 'Comment ça marche' },
]

export default function Navbar() {
    const pathname = usePathname()
    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-[#1a7a4a] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">D</span>
                    </div>
                    <span className="font-semibold text-gray-900">Diaspora<span className="text-[#1a7a4a]">Gift</span></span>
                </Link>
                <div className="flex items-center gap-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={
                                (pathname === link.href
                                    ? 'text-[#1a7a4a] font-semibold'
                                    : 'text-gray-600 hover:text-gray-900') +
                                ' transition-colors'
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/panier" aria-label="Panier">
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                    </Link>
                    <Link href="/connexion" className="text-gray-600 hover:text-gray-900 transition-colors">Connexion</Link>
                    <Link
                        href="/inscription"
                        className="bg-[#1a7a4a] text-white px-4 py-2 rounded-full text-sm hover:bg-[#155f3a] transition-colors"
                    >
                        Inscription
                    </Link>
                </div>
            </div>
        </nav>
    )
}
