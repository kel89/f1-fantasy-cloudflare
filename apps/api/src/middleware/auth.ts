import type { MiddlewareHandler } from "hono";
import type { Env } from "../types";
import { verifyToken } from "../lib/jwt";

export const requireAuth: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next
) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization token", code: "UNAUTHORIZED" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);

    // Check KV blacklist
    const blacklisted = await c.env.JWT_BLACKLIST.get(payload.jti ?? token.slice(-16));
    if (blacklisted) {
      return c.json({ error: "Token has been revoked", code: "TOKEN_REVOKED" }, 401);
    }

    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    c.set("userAdmin", payload.admin);
    c.set("jti", payload.jti ?? token.slice(-16));
  } catch {
    return c.json({ error: "Invalid or expired token", code: "INVALID_TOKEN" }, 401);
  }

  await next();
};

export const requireAdmin: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next
) => {
  if (c.get("userAdmin") !== 1) {
    return c.json({ error: "Admin access required", code: "FORBIDDEN" }, 403);
  }
  await next();
};
