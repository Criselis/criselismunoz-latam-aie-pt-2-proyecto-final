import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexova Solutions — Consultora de Talento",
  description: "Headhunting, outsourcing y formación corporativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}