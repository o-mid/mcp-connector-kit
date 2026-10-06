import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { StatusBoard } from "@/components/status-board";
import { GATEWAY_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status",
  description: "Live health, SKU, source readiness, and Prometheus counters for the hosted MCP gateway.",
};

export default function StatusPage() {
  return (
    <>
      <PageIntro
        kicker="Status"
        title="What the gateway is doing right now."
        lede={`Health, readiness, and metrics from ${GATEWAY_ORIGIN}. This page polls every 20 seconds.`}
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <StatusBoard />
        </div>
      </section>
    </>
  );
}
