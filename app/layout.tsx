import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PILA — No-Code PinionOS Skill Builder",
  description: "Build & sell AI skills in 2 minutes. No code. No servers. Just describe it — we deploy it.",
  openGraph: {
    title: "PILA — No-Code PinionOS Skill Builder",
    description: "Deploy earning x402 skills in 2 minutes. No code required.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen" style={{ background: "#0F0F11", color: "#F9FAFB" }}>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
