// `wrangler types` génère `Env` dans worker-configuration.d.ts à partir de
// wrangler.jsonc. OpenNext, lui, type getCloudflareContext() avec
// `CloudflareEnv`. Ce pont relie les deux — sans lui, env.DB n'est pas typé.
//
// À régénérer après toute modification de wrangler.jsonc : npm run cf:typegen
interface CloudflareEnv extends Env {}
