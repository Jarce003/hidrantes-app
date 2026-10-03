import type { Metadata } from "next";
import { AccesoIngreso } from "@/components/ingreso/acceso-ingreso";

export const metadata: Metadata = {
  title: "Ingreso de hidrantes",
  robots: { index: false, follow: false },
};

export default function PaginaIngreso() {
  return <AccesoIngreso />;
}
