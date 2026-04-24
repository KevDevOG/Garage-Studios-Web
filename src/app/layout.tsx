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
  metadataBase: new URL("https://project-w9jbu.vercel.app"),
  title: "Garage Studios | Producción Musical y Audiovisual en Las Palmas",
  description:
    "Estudio de grabación, producción musical, mezcla, masterización y videoclips en Las Palmas de Gran Canaria.",
  keywords: [
    "estudio grabación",
    "producción musical",
    "estudio Las Palmas",
    "grabación música",
    "videoclips",
    "mezcla y mastering",
  ],
  openGraph: {
    title: "Garage Studios | Producción Musical y Audiovisual en Las Palmas",
    description:
      "Estudio de grabación, producción musical, mezcla, masterización y videoclips en Las Palmas de Gran Canaria.",
    url: "https://project-w9jbu.vercel.app",
    siteName: "Garage Studios",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "https://project-w9jbu.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Garage Studios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Garage Studios | Producción Musical y Audiovisual en Las Palmas",
    description:
      "Estudio de grabación, producción musical, mezcla, masterización y videoclips en Las Palmas de Gran Canaria.",
    images: ["https://project-w9jbu.vercel.app/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicStudio",
    name: "Garage Studios",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Las Palmas de Gran Canaria",
      addressCountry: "ES",
    },
    url: "https://garage-studios-web.vercel.app",
  };

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-[var(--font-inter)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
