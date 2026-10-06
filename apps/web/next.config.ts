import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: path.join(root, "../.."),
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
