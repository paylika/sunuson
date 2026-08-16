import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// Donne accès aux bindings Cloudflare (D1, R2) pendant `next dev`, en tapant
// sur le SQLite local de .wrangler/ — jamais sur le compte Cloudflare.
initOpenNextCloudflareForDev();
