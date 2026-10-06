import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MCP Connector Kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#fafafa",
              color: "#09090b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            M
          </div>
          <span style={{ fontSize: 28, fontWeight: 600 }}>mcp-connector-kit</span>
        </div>
        <p style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.1, maxWidth: 900, letterSpacing: "-0.03em" }}>
          Contract-tested MCP gateways
        </p>
        <p style={{ fontSize: 26, color: "#a1a1aa", marginTop: 24, maxWidth: 800 }}>
          One gateway · trust-tier sources · offline fixture replay
        </p>
      </div>
    ),
    { ...size },
  );
}
