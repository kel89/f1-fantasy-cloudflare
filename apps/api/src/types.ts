import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  JWT_BLACKLIST: KVNamespace;
  JWT_SECRET: string;
  REFRESH_SECRET: string;
  ENVIRONMENT?: string;
}

// Augment Hono context
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
    userAdmin: number;
    jti: string;
  }
}
