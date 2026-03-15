
"use client";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useCart } from "../../../components/CartContext";
import StickyCart from "../../../components/StickyCart";

interface Merchant {
    id: string;
    name: string;
    category: string;
    address: string;
    wilaya: string;
    logo_url?: string | null;
    phone?: string | null;
    is_active: boolean;
}

interface Product {
    id: string;
    merchant_id: string;
    name: string;
    description?: string | null;
    price_eur_cents: number;
    image_url?: string | null;
    is_active: boolean;
}

interface MerchantPageProps {
    params: { id: string };
}

async function fetchMerchant(id: string): Promise<Merchant | null> {
    const res = await fetch(`http://localhost:8000/merchants/`);
    if (!res.ok) return null;
    const merchants: Merchant[] = await res.json();
    return merchants.find((m) => m.id === id) ?? null;
}

async function fetchProducts(merchantId: string): Promise<Product[]> {
    const res = await fetch(`http://localhost:8000/products/merchant/${merchantId}`);
    if (!res.ok) return [];
    return res.json();
}


import { useEffect, useState } from "react";

export default function MerchantPage({ params }: MerchantPageProps) {
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { add } = useCart();

    useEffect(() => {
        fetchMerchant(params.id).then(setMerchant);
        fetchProducts(params.id).then(setProducts).finally(() => setLoading(false));
    }, [params.id]);

    if (!merchant && !loading) return notFound();

    return (
        <main className="container mx-auto py-8">
            <StickyCart />
            {merchant && (
                <div className="flex items-center gap-6 mb-8">
                    {merchant.logo_url && (
                        <Image src={merchant.logo_url} alt={merchant.name} width={64} height={64} className="rounded-full" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{merchant.name}</h1>
                        <div className="text-gray-500 text-sm">{merchant.category} – {merchant.wilaya}</div>
                        <div className="text-xs text-gray-400">{merchant.address}</div>
                    </div>
                </div>
            )}
            <section>
                <h2 className="text-xl font-semibold mb-4">Catalogue</h2>
                {loading && <div>Chargement…</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!loading && products.length === 0 && <div>Aucun produit disponible.</div>}
                    {products.map((p) => (
                        <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col">
                            {p.image_url && (
                                <Image src={p.image_url} alt={p.name} width={200} height={200} className="rounded mb-2 object-cover" />
                            )}
                            <div className="font-semibold mb-1">{p.name}</div>
                            <div className="text-gray-500 text-sm mb-2">{p.description}</div>
                            <div className="font-bold text-blue-700 mb-2">{(p.price_eur_cents / 100).toFixed(2)} €</div>
                            <button
                                className="mt-auto bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition"
                                onClick={() => add({
                                    id: p.id,
                                    name: p.name,
                                    price_eur_cents: p.price_eur_cents,
                                    image_url: p.image_url,
                                    quantity: 1,
                                })}
                            >
                                Ajouter au panier
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
