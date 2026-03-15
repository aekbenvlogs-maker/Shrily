"use client";
import { useEffect, useState } from "react";

interface Order {
    id: string;
    status: string;
    beneficiary_name: string;
    beneficiary_phone: string;
    total_eur: number;
    created_at: string;
}

export default function OrderHistory({ userId }: { userId: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`http://localhost:8000/orders/user/${userId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erreur API");
                return res.json();
            })
            .then(setOrders)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [userId]);

    return (
        <div className="bg-white rounded shadow p-4 mb-6">
            <h2 className="font-semibold mb-2">Historique de commandes</h2>
            {loading && <p>Chargement…</p>}
            {error && <p className="text-red-600">Erreur : {error}</p>}
            {!loading && !error && (
                <ul className="divide-y">
                    {orders.map((o) => (
                        <li key={o.id} className="py-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                            <span className="font-semibold">{o.beneficiary_name}</span>
                            <span className="text-gray-500 text-sm">{o.beneficiary_phone}</span>
                            <span className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</span>
                            <span className="font-bold">{(o.total_eur / 100).toFixed(2)} €</span>
                            <span className="px-2 py-1 rounded text-xs bg-gray-100">{o.status}</span>
                        </li>
                    ))}
                    {orders.length === 0 && <li>Aucune commande.</li>}
                </ul>
            )}
        </div>
    );
}
