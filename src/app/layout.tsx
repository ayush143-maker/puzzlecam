import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Puzzle Cam — Gesture Capture",
  description:
    "Fotomatón gestual: enmarca con las manos, arma el rompecabezas con pinch, guarda con puño.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={mono.variable}>
      <body className="bg-ink font-mono text-paper antialiased">{children}</body>
    </html>
  );
}
