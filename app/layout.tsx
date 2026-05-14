import type { Metadata } from "next";
import Script from "next/script";
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
        {/*
          Material Symbols Outlined uses a variable-axis URL (wght,FILL) that
          next/font/google doesn't expose cleanly. Keep the <link> here and
          silence the page-custom-font rule; this is the documented escape
          hatch for icon fonts loaded once at the root layout.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container bg-surface text-on-surface">
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '4257235341192934');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* 1x1 Meta Pixel — intentionally an <img>, not next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=4257235341192934&ev=PageView&noscript=1" alt="" />
        </noscript>
        {/* End Meta Pixel Code */}
        {children}
      </body>
    </html>
  );
}
