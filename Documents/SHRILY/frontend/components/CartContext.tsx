"use client";
import { createContext, ReactNode, useContext, useState } from "react";

export interface CartItem {
    id: string;
    name: string;
    price_eur_cents: number;
    image_url?: string | null;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    add: (item: CartItem) => void;
    remove: (id: string) => void;
    clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    function add(item: CartItem) {
        setItems((prev) => {
            const found = prev.find((i) => i.id === item.id);
            if (found) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
                );
            }
            return [...prev, item];
        });
    }
    function remove(id: string) {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }
    function clear() {
        setItems([]);
    }

    return (
        <CartContext.Provider value={{ items, add, remove, clear }}>
            {children}
        </CartContext.Provider>
    );
}
