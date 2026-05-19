import type { Metadata } from "next";
import { AccesoGate } from "./AccesoGate";

export const metadata: Metadata = {
  title: "Acceso al webinar | Rui Machalele",
  description:
    "Antesala emocional para entrar al webinar del Método de los 4 Ángeles.",
  robots: { index: false, follow: false },
};

export default function WebinarAccessPage() {
  return <AccesoGate />;
}
