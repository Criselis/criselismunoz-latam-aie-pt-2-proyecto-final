import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracker de Talento - Nexova",
  description: "Panel de gestión de candidatos - Nexova Talento",
};

export default function TrackerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
