import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Análisis de tickets de soporte - Nexova",
  description: "Carga el CSV del helpdesk, valida los tickets y consulta las métricas del equipo de soporte.",
};

export default function IncidentsAnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
