import type { MiddlewareHandler } from "hono";
import type { Env } from "../types";

/**
 * Simple KV-backed rate limiter for auth endpoints.
 * Limits to `max` requests per `windowSeconds` per IP.
 */
export function rateLimit(
  max: number,
  windowSeconds: number
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For") ??
      "unknown";
    const key = `rl:${c.req.path}:${ip}`;

    const current = await c.env.JWT_BLACKLIST.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= max) {
      return c.json(
        { error: "Too many requests, please try again later", code: "RATE_LIMITED" },
        429
      );
    }

    await c.env.JWT_BLACKLIST.put(key, String(count + 1), {
      expirationTtl: windowSeconds,
    });

    await next();
  };
}
