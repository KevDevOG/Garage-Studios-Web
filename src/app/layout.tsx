import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Garage Studios | Producción Musical y Audiovisual en Las Palmas",
  description:
    "Estudio de grabación profesional en Las Palmas de Gran Canaria. Ofrecemos grabación, mezcla, masterización, producción musical y creación de contenido audiovisual.",
  keywords: [
    "estudio de grabación",
    "producción musical",
    "Las Palmas de Gran Canaria",
    "videoclips",
    "Garage Studios",
    "mezcla",
    "masterización",
    "contenido audiovisual"
  ],
  openGraph: {
    title: "Garage Studios | Producción Musical y Audiovisual",
    description:
      "Estudio de grabación profesional en Las Palmas de Gran Canaria. Grabación, mezcla, masterización y contenido audiovisual para llevar tu talento al siguiente nivel.",
    url: "https://garage-studios-web.vercel.app",
    siteName: "Garage Studios",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Garage Studios | Producción Musical y Audiovisual",
    description:
      "Estudio de grabación profesional en Las Palmas de Gran Canaria. Únete a la familia Garage Studios.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-[var(--font-inter)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
