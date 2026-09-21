import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TrainerProvider } from "@/contexts/TrainerContext";
import OfflineIndicator from "@/components/OfflineIndicator";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Personal Trainer Pro | Gestão de Alunos, Avaliações & Treinos",
  description: "Plataforma completa para Personal Trainers gerenciarem alunos, agenda, composição corporal e planos de treino.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trainer Pro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark theme-emerald">
      <body className={`${inter.variable} font-sans min-h-screen bg-zinc-950 text-zinc-100 flex flex-col`}>
        <OfflineIndicator />
        <ThemeProvider>
          <TrainerProvider>{children}</TrainerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
