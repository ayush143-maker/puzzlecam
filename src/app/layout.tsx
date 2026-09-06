import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Puzzle Cam — Gesture Capture",
  description:
    "Gesture photobooth: frame the shot with your hands, solve the puzzle with a pinch, save with a fist.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="bg-ink font-mono text-paper antialiased">{children}</body>
    </html>
  );
}
