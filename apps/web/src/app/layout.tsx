import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmbientBackground } from "@/components/ambient-background";
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
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-950 font-sans antialiased text-zinc-50">
        <AmbientBackground />
        <div className="grid-bg fixed inset-0 -z-10 pointer-events-none" />
        <SiteHeader />
        <main className="relative z-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
