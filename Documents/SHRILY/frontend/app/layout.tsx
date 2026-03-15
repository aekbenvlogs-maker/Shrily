import type { ReactNode } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import './globals.css'

export const metadata = {
  title: 'DiasporaGift',
  description: "Offrez des cadeaux à vos proches en Algérie depuis l'étranger.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-white">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
