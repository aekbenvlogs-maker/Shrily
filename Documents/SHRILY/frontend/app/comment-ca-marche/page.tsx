export default function CommentCaMarche() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold font-serif mb-4">Comment ça marche ?</h2>
                <p className="text-gray-500 text-lg">En quelques étapes simples, offrez des cadeaux à vos proches en Algérie depuis n&apos;importe où dans le monde.</p>
            </div>
            <div className="space-y-24">
                {[
                    {
                        num: 1,
                        title: "Choisissez un cadeau",
                        desc: "Parcourez notre marketplace et sélectionnez des produits ou services chez nos commerçants partenaires en Algérie.",
                        reverse: false,
                        img: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" // cadeaux
                    },
                    {
                        num: 2,
                        title: "Payez en EUR ou USD",
                        desc: "Réglez votre commande depuis l'étranger avec votre carte bancaire. Paiement sécurisé par Stripe.",
                        reverse: true,
                        img: "https://images.unsplash.com/photo-1518544801346-a01b640b1a57?auto=format&fit=crop&w=400&q=80" // carte bancaire
                    },
                    {
                        num: 3,
                        title: "Partagez le QR code",
                        desc: "Une fois le paiement confirmé, vous recevez un QR code unique. Envoyez-le à votre proche en Algérie.",
                        reverse: false,
                        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" // smartphone partage
                    },
                    {
                        num: 4,
                        title: "Retrait en boutique",
                        desc: "Votre proche se rend chez le commerçant, scanne le QR code et repart avec son cadeau.",
                        reverse: true,
                        img: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=400&q=80" // boutique
                    },
                ].map((step) => (
                    <div key={step.num} className={`flex flex-col md:flex-row ${step.reverse ? 'md:flex-row-reverse' : ''} items-center gap-12`}>
                        <div className="flex-1">
                            <div className="w-10 h-10 bg-[#e8f5ee] rounded-full flex items-center justify-center mb-4">
                                <span className="text-[#1a7a4a] font-bold">{step.num}</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                            <p className="text-gray-500 text-lg">{step.desc}</p>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-2xl h-64 flex items-center justify-center overflow-hidden">
                            <img src={step.img} alt={step.title} className="object-cover w-full h-full" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-24">
                <h3 className="text-3xl font-bold text-center mb-12">Pourquoi DiasporaGift ?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "100% Sécurisé", desc: "Vos paiements sont protégés par Stripe, leader mondial du paiement en ligne." },
                        { title: "Commerçants vérifiés", desc: "Tous nos partenaires sont vérifiés et sélectionnés pour leur qualité de service." },
                        { title: "Offrez sans frontières", desc: "Faites plaisir à vos proches en Algérie depuis n'importe où dans le monde." },
                    ].map((card) => (
                        <div key={card.title} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                            <h4 className="font-bold text-lg mb-3">{card.title}</h4>
                            <p className="text-gray-500">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-24 bg-[#1a7a4a] rounded-2xl p-16 text-center text-white">
                <h3 className="text-3xl font-bold mb-4">Prêt à commencer ?</h3>
                <p className="text-white/80 mb-8">Faites plaisir à vos proches dès maintenant.</p>
                <div className="flex gap-4 justify-center">
                    <a href="/marketplace" className="bg-white text-[#1a7a4a] px-6 py-3 rounded-full font-semibold hover:bg-gray-100">Découvrir les offres</a>
                    <a href="/inscription" className="border border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10">Je vais m&apos;identifier</a>
                </div>
            </div>
        </div>
    )
}
