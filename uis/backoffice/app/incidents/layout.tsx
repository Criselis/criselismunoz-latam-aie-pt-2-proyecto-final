import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestor de Incidencias - Nexova",
  description: "Panel centralizado para registrar, consultar y seguir incidencias de Nexova.",
};

export default function IncidentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}