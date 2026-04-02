import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Adapter — Optimisez votre CV pour chaque offre",
  description:
    "Importez votre CV et une offre d'emploi. Notre IA (Claude Opus) réécrit votre CV pour maximiser vos chances de décrocher le poste.",
  keywords: ["CV", "offre emploi", "IA", "optimisation", "Claude", "recrutement"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
