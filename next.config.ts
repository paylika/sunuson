import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// Donne accès aux bindings Cloudflare (R2) pendant `next dev`.
//
// Le garde sur NODE_ENV n'est pas décoratif : cet appel démarre un runtime
// local, et le laisser s'exécuter pendant `next build` fait rester le build
// bloqué indéfiniment. Un build est toujours en production.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
