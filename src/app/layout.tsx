import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://garagestudios.es"),
  title: "Estudio de Grabación y Producción Musical en Las Palmas | Garage Studios",
  description:
    "Garage Studios: tu estudio musical en Las Palmas de Gran Canaria. Grabación profesional, producción musical, mezcla, masterización y videoclips de alta calidad.",
  keywords: [
    "estudio grabacion las palmas",
    "estudio de grabacion las palmas",
    "estudio musical las palmas",
    "produccion musical las palmas",
    "mezcla y masterizacion las palmas",
    "videoclips las palmas",
    "estudio de grabacion gran canaria",
  ],
  openGraph: {
    title: "Estudio de Grabación y Producción Musical en Las Palmas | Garage Studios",
    description:
      "Garage Studios: tu estudio musical en Las Palmas de Gran Canaria. Grabación profesional, producción musical, mezcla, masterización y videoclips de alta calidad.",
    url: "https://garagestudios.es",
    siteName: "Garage Studios",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-garage-studios.png",
        width: 1200,
        height: 630,
        alt: "Garage Studios - Estudio de Grabación en Las Palmas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Estudio de Grabación y Producción Musical en Las Palmas | Garage Studios",
    description:
      "Garage Studios: tu estudio musical en Las Palmas de Gran Canaria. Grabación profesional, producción musical, mezcla, masterización y videoclips de alta calidad.",
    images: ["/og-garage-studios.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecordingStudio",
    name: "Garage Studios",
    logo: "https://garagestudios.es/icon-512.png",
    image: "https://garagestudios.es/og-garage-studios.png",
    description: "Estudio de grabación, producción musical, mezcla, masterización y videoclips profesionales en Las Palmas de Gran Canaria.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "C. Drago",
      postalCode: "35010",
      addressLocality: "Las Palmas de Gran Canaria",
      addressRegion: "Las Palmas",
      addressCountry: "ES",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 28.1097266,
      longitude: -15.4543178
    },
    hasMap: "https://maps.app.goo.gl/heSYXrycMkAFsBoCA",
    telephone: "+34 693 48 93 79",
    email: "garagestudioslp@gmail.com",
    url: "https://garagestudios.es",
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        opens: "16:00",
        closes: "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "00:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "15:00",
        closes: "22:00"
      }
    ],
    sameAs: [
      "https://www.instagram.com/gstudios_lp/",
      "https://www.tiktok.com/@garage_studios"
    ]
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
        <Toaster position="top-right" richColors theme="dark" />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
