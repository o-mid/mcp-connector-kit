import type { IncomingMessage } from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { authenticateMcpRequest, oauthProtectedResourceMetadata } from "./oauth.js";

declare global {
  // eslint-disable-next-line no-var
  var __MCK_MOCK_AGENT__: import("undici").MockAgent | undefined;
}

describe("authenticateMcpRequest", () => {
  it("rejects when API keys required and bearer missing", async () => {
    const req = { headers: {} } as IncomingMessage;
    const result = await authenticateMcpRequest(req, { apiKeys: ["secret"] });
    expect(result).toEqual({ ok: false });
  });

  it("accepts API key bearer", async () => {
    const req = { headers: { authorization: "Bearer secret" } } as IncomingMessage;
    const result = await authenticateMcpRequest(req, { apiKeys: ["secret"] });
    expect(result).toEqual({ ok: true, method: "api_key" });
  });

  it("allows open access when no keys or oauth configured", async () => {
    const req = { headers: {} } as IncomingMessage;
    const result = await authenticateMcpRequest(req, {});
    expect(result).toEqual({ ok: true, method: "open" });
  });
});

describe("oauth JWT with mocked JWKS", () => {
  const jwksUrl = "https://idp.test/.well-known/jwks.json";
  let token: string;

  beforeAll(async () => {
    const agent = globalThis.__MCK_MOCK_AGENT__;
    if (!agent) throw new Error("vitest network guard should provide MockAgent");

    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    jwk.kid = "test";
    jwk.alg = "RS256";

    agent
      .get("https://idp.test")
      .intercept({ path: "/.well-known/jwks.json", method: "GET" })
      .reply(200, JSON.stringify({ keys: [jwk] }), {
        headers: { "content-type": "application/json" },
      })
      .persist();

    token = await new SignJWT({ sub: "tenant-acme", aud: "mcp-gateway" })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .setIssuer("https://idp.example.com")
      .setExpirationTime("2h")
      .sign(privateKey);
  });

  it("extracts tenant from JWT sub claim", async () => {
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as IncomingMessage;
    const result = await authenticateMcpRequest(req, {
      oauth: {
        jwksUrl,
        audience: "mcp-gateway",
        issuer: "https://idp.example.com",
        tenantClaim: "sub",
      },
    });
    expect(result).toEqual({ ok: true, method: "jwt", tenantId: "tenant-acme" });
  });

  it("advertises issuer in protected resource metadata", () => {
    const meta = oauthProtectedResourceMetadata("https://gw.example.com", {
      jwksUrl,
      issuer: "https://idp.example.com",
    });
    expect(meta.authorization_servers).toEqual(["https://idp.example.com"]);
  });
});
