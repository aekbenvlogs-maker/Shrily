
"use client";
import { useEffect, useState } from "react";

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

export default function MerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("http://localhost:8000/merchants/")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur API");
                return res.json();
            })
            .then(setMerchants)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Commerçants partenaires</h1>
            <div className="bg-white rounded shadow p-4">
                {loading && <p>Chargement…</p>}
                {error && <p className="text-red-600">Erreur : {error}</p>}
                {!loading && !error && (
                    <ul className="divide-y">
                        {merchants.map((m) => (
                            <li key={m.id} className="py-3 flex items-center gap-4">
                                {m.logo_url && (
                                    <img src={m.logo_url} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
                                )}
                                <div>
                                    <div className="font-semibold">{m.name}</div>
                                    <div className="text-sm text-gray-500">{m.category} – {m.wilaya}</div>
                                    <div className="text-xs text-gray-400">{m.address}</div>
                                </div>
                            </li>
                        ))}
                        {merchants.length === 0 && <li>Aucun commerçant trouvé.</li>}
                    </ul>
                )}
            </div>
        </main>
    );
}
