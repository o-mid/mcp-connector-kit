import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmbientBackground } from "@/components/ambient-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OG_IMAGE, SITE_ORIGIN } from "@/lib/site";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "MCP Connector Kit — contract-tested MCP gateways",
    template: "%s — MCP Connector Kit",
  },
  description:
    "Ship MCP tools like microservices: schema, contract, gateway, metrics. One Streamable HTTP URL for a trust-tier catalog.",
  openGraph: {
    title: "MCP Connector Kit",
    description: "Schema, contract, gateway, metrics.",
    url: SITE_ORIGIN,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "MCP Connector Kit" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
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
