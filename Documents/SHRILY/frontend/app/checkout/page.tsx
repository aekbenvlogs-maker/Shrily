
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useCart } from "../../components/CartContext";

export default function CheckoutPage() {
    const { items, remove, clear } = useCart();
    const [step, setStep] = useState(1);
    const [beneficiary, setBeneficiary] = useState({ name: "", phone: "" });
    const total = items.reduce((sum, i) => sum + i.price_eur_cents * i.quantity, 0);

    function handleBeneficiaryChange(e: React.ChangeEvent<HTMLInputElement>) {
        setBeneficiary({ ...beneficiary, [e.target.name]: e.target.value });
    }


    async function handleStripeCheckout() {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        // Construire les line_items Stripe à partir du panier
        const line_items = items.map((item) => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item.name,
                    images: item.image_url ? [item.image_url] : [],
                },
                unit_amount: item.price_eur_cents,
            },
            quantity: item.quantity,
        }));
        const res = await fetch("http://localhost:8000/payments/create-checkout-session/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                line_items,
                success_url: window.location.origin + "/checkout?success=1",
                cancel_url: window.location.origin + "/checkout?canceled=1",
            }),
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        }
    }

    function handleNext() {
        if (step === 1) setStep(2);
    }

    if (items.length === 0) {
        return (
            <main className="container mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Panier vide</h1>
            </main>
        );
    }

    return (
        <main className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Finaliser la commande</h1>
            <div className="bg-white rounded shadow p-4 mb-6">
                <h2 className="font-semibold mb-2">Votre panier</h2>
                <ul className="divide-y mb-2">
                    {items.map((item) => (
                        <li key={item.id} className="py-2 flex items-center gap-4">
                            {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover" />
                            )}
                            <span className="flex-1">{item.name}</span>
                            <span>x{item.quantity}</span>
                            <span>{((item.price_eur_cents * item.quantity) / 100).toFixed(2)} €</span>
                            <button className="ml-2 text-red-600" onClick={() => remove(item.id)}>Supprimer</button>
                        </li>
                    ))}
                </ul>
                <div className="font-bold text-right">Total : {(total / 100).toFixed(2)} €</div>
            </div>
            {step === 1 && (
                <form className="bg-white rounded shadow p-4 mb-6" onSubmit={e => { e.preventDefault(); handleNext(); }}>
                    <h2 className="font-semibold mb-2">Bénéficiaire (retrait en boutique)</h2>
                    <div className="mb-2">
                        <label className="block text-sm mb-1">Nom complet</label>
                        <input name="name" value={beneficiary.name} onChange={handleBeneficiaryChange} required className="border rounded px-2 py-1 w-full" />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm mb-1">Téléphone</label>
                        <input name="phone" value={beneficiary.phone} onChange={handleBeneficiaryChange} required className="border rounded px-2 py-1 w-full" />
                    </div>
                    <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded mt-2">Payer</button>
                </form>
            )}
            {step === 2 && (
                <div className="bg-white rounded shadow p-4 mb-6">
                    <h2 className="font-semibold mb-2">Paiement</h2>
                    <button
                        className="bg-blue-700 text-white px-4 py-2 rounded mt-2"
                        onClick={handleStripeCheckout}
                    >
                        Payer avec Stripe
                    </button>
                </div>
            )}
            {step === 3 && (
                <div className="bg-white rounded shadow p-4 mb-6">
                    <h2 className="font-semibold mb-2">Confirmation</h2>
                    <div>Merci pour votre commande ! Voici votre QR code pour le retrait en boutique :</div>
                    {/* TODO: remplacer 'demo-token' par le vrai token de commande */}
                    <div className="flex justify-center my-6">
                        <img src="http://localhost:8000/qr/generate/demo-token" alt="QR Code retrait" className="w-40 h-40" />
                    </div>
                    <button className="mt-4 bg-blue-700 text-white px-4 py-2 rounded" onClick={clear}>Nouvelle commande</button>
                </div>
            )}
        </main>
    );
}
