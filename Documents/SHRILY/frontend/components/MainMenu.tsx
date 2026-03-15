import Link from "next/link";

const navItems = [
    { href: "/", label: "Accueil" },
    { href: "/merchants", label: "Commerçants" },
    { href: "/checkout", label: "Commander" },
    { href: "/dashboard", label: "Dashboard" },
];

export default function MainMenu() {
    return (
        <nav className="bg-white shadow mb-6">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-xl tracking-tight">Diaspora Delivery</span>
                <ul className="flex space-x-6">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className="hover:text-blue-600 font-medium transition-colors">
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
