import type { Metadata } from "next";
import { Inter, Newsreader, Playfair_Display, Noto_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ['normal', 'italic'],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  style: ['normal', 'italic'],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: "Rui Machalele – Programa de Expansión Mental",
  description: "El Oráculo Moderno",
  openGraph: {
    images: [
      {
        url: '/redes.jpg',
        width: 1200,
        height: 630,
        alt: 'Rui Machalele – Programa de Expansión Mental',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/redes.jpg'],
  },
  icons: {
    icon: '/black.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${newsreader.variable} ${playfairDisplay.variable} ${notoSerif.variable} h-full antialiased light scroll-smooth`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
