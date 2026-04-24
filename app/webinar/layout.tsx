import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webinar gratuito — Método de los 4 Ángeles | Rui Machalele",
  description:
    "Por qué personas exitosas se sienten vacías y cómo reconectar con tu propósito en 60 minutos. Sistema estructurado, no motivación superficial.",
  openGraph: {
    title: "Webinar — Rui Machalele · Método de los 4 Ángeles",
    description:
      "De la desconexión a la alineación con propósito. Reserva tu lugar gratuito.",
    images: [
      {
        url: "/webinar.webp",
        width: 1200,
        height: 630,
        alt: "Webinar del Método de los 4 Ángeles con Rui Machalele",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/webinar.webp"],
  },
};

export default function WebinarLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
