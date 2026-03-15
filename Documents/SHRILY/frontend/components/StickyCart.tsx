"use client";
import Link from "next/link";
import { useCart } from "./CartContext";

export default function StickyCart() {
    const { items } = useCart();
    const total = items.reduce((sum, i) => sum + i.price_eur_cents * i.quantity, 0);
    if (items.length === 0) return null;
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-blue-700 text-white rounded shadow-lg px-6 py-4 flex items-center gap-4">
                <span className="font-semibold">Panier : {items.length} article(s)</span>
                <span className="font-bold">{(total / 100).toFixed(2)} €</span>
                <Link href="/checkout" className="ml-4 bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50 transition">Commander</Link>
            </div>
        </div>
    );
}
