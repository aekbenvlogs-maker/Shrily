"use client";
import { useEffect, useState } from "react";

interface Notification {
    id: string;
    message: string;
    created_at: string;
    read: boolean;
}

export default function Notifications({ merchantId }: { merchantId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`http://localhost:8000/notifications/merchant/${merchantId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erreur API");
                return res.json();
            })
            .then(setNotifications)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [merchantId]);

    return (
        <div className="bg-blue-50 rounded shadow p-4 mb-6">
            <h2 className="font-semibold mb-2">Notifications</h2>
            {loading && <p>Chargement…</p>}
            {error && <p className="text-red-600">Erreur : {error}</p>}
            {!loading && !error && (
                <ul className="divide-y">
                    {notifications.map((n) => (
                        <li key={n.id} className={`py-2 ${n.read ? "text-gray-400" : "font-bold"}`}>
                            <span>{n.message}</span>
                            <span className="text-xs text-gray-400 ml-2">{new Date(n.created_at).toLocaleString()}</span>
                        </li>
                    ))}
                    {notifications.length === 0 && <li>Aucune notification.</li>}
                </ul>
            )}
        </div>
    );
}
