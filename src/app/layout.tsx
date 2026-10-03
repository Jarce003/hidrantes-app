import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./mapa.css";
import "./ingreso/ingreso.css";

export const metadata: Metadata = {
  title: "Mapa de hidrantes",
  description: "Consulta de ubicación y caudal de hidrantes primarios y secundarios.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1526",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CR">
      <body>{children}</body>
    </html>
  );
}
