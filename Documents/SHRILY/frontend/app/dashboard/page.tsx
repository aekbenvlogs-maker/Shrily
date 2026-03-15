


import Notifications from "../../components/Notifications";
import OrderHistory from "../../components/OrderHistory";
import OrdersList from "../../components/OrdersList";
import QRValidation from "../../components/QRValidation";

export default function DashboardPage() {
    // TODO: remplacer par l'ID du commerçant connecté
    const merchantId = "demo-merchant-id";
    // TODO: remplacer par l'ID de l'utilisateur connecté pour l'historique
    const userId = "demo-merchant-id";
    return (
        <main className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard commerçant</h1>
            <Notifications merchantId={merchantId} />
            <QRValidation />
            <OrdersList merchantId={merchantId} />
            <OrderHistory userId={userId} />
        </main>
    );
}
