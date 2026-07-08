// Cloudflare Workers 바인딩 타입 선언
// wrangler types 명령으로 자동 생성 가능하지만, 수동으로 관리하는 버전

interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENCRYPTION_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

declare module "cloudflare:workers" {
  interface Env extends CloudflareEnv {}
}
