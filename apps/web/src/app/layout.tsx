import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "MCP Connector Kit — contract-tested MCP gateways",
  description:
    "Compose read-only MCP tools from trust-tier sources. Shared HTTP policy, offline fixtures, hosted gateway SKU.",
  openGraph: {
    title: "MCP Connector Kit",
    description: "Production-grade MCP connector framework",
    images: [{ url: "/images/hero.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="grid-bg fixed inset-0 -z-10 pointer-events-none" />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
