import { getCloudflareContext } from "@opennextjs/cloudflare";

// THE PHOTOGRAPHY 패턴: getCloudflareContext()는 동기 함수
// better-auth 1.6+에서는 env.DB를 직접 D1Database로 쓰면 됨
// (Kysely, kysely-d1 불필요 — package.json에서도 제거됨)

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<void>;
  get(key: string): Promise<{
    arrayBuffer(): Promise<ArrayBuffer>;
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(key: string): Promise<void>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return env.DB as unknown as D1Database;
}

export function getMediaBucket(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.MEDIA as unknown as R2Bucket;
}

export function getCacheKV(): KVNamespace {
  const { env } = getCloudflareContext();
  return env.CACHE_KV as unknown as KVNamespace;
}

export function getEnv() {
  const { env } = getCloudflareContext();
  return env as {
    ENCRYPTION_KEY: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    DB: unknown;
    MEDIA: unknown;
    CACHE_KV: unknown;
  };
}
