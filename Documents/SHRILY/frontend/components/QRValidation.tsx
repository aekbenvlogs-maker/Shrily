"use client";
import { useState } from "react";

export default function QRValidation() {
    const [token, setToken] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleValidate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        const res = await fetch("http://localhost:8000/qr/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setResult(data.status === "ok" ? "QR valide, commande trouvée." : "QR invalide ou déjà utilisé.");
        setLoading(false);
    }

    return (
        <div className="bg-white rounded shadow p-4 mb-6">
            <h2 className="font-semibold mb-2">Valider un QR code</h2>
            <form onSubmit={handleValidate} className="flex gap-2 items-center">
                <input
                    type="text"
                    placeholder="Token QR code"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="border rounded px-2 py-1 flex-1"
                    required
                />
                <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded" disabled={loading}>
                    {loading ? "Validation…" : "Valider"}
                </button>
            </form>
            {result && <div className="mt-2 font-bold">{result}</div>}
        </div>
    );
}
