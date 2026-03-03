import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../types";
import { hashPassword, verifyPassword } from "../lib/password";
import { signAccessToken, signRefreshToken, verifyToken } from "../lib/jwt";
import { generateId } from "../lib/ids";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

const auth = new Hono<{ Bindings: Env }>();

// Rate-limit login and signup: 10 attempts per minute per IP
auth.use("/login", rateLimit(10, 60));
auth.use("/signup", rateLimit(5, 60));

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  given_name: z.string().min(1).max(100).trim(),
  family_name: z.string().min(1).max(100).trim(),
  nickname: z.string().min(1).max(50).trim(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/signup
auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const { email, password, given_name, family_name, nickname } =
    c.req.valid("json");

  // Check if email already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first();

  if (existing) {
    return c.json({ error: "Email already registered", code: "EMAIL_EXISTS" }, 409);
  }

  const id = generateId();
  const password_hash = await hashPassword(password);

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, given_name, family_name, nickname, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, email.toLowerCase(), given_name, family_name, nickname, password_hash)
    .run();

  const user = await c.env.DB.prepare(
    "SELECT id, email, given_name, family_name, nickname, total_points, admin, created_at FROM users WHERE id = ?"
  )
    .bind(id)
    .first();

  const jti = generateId();
  const token = await signAccessToken(
    { sub: id, email: email.toLowerCase(), admin: 0, jti },
    c.env.JWT_SECRET
  );
  const refreshToken = await signRefreshToken({ sub: id, jti: generateId() }, c.env.REFRESH_SECRET);

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60,
    path: "/api/auth",
  });

  return c.json({ token, user }, 201);
});

// POST /api/auth/login
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await c.env.DB.prepare(
    "SELECT id, email, given_name, family_name, nickname, total_points, admin, password_hash, created_at FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first<{
      id: string;
      email: string;
      given_name: string;
      family_name: string;
      nickname: string;
      total_points: number;
      admin: number;
      password_hash: string;
      created_at: string;
    }>();

  if (!user) {
    return c.json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }, 401);
  }

  const jti = generateId();
  const token = await signAccessToken(
    { sub: user.id, email: user.email, admin: user.admin, jti },
    c.env.JWT_SECRET
  );
  const refreshToken = await signRefreshToken(
    { sub: user.id, jti: generateId() },
    c.env.REFRESH_SECRET
  );

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60,
    path: "/api/auth",
  });

  const { password_hash: _, ...safeUser } = user;
  return c.json({ token, user: safeUser });
});

// POST /api/auth/logout
// No requireAuth — logout must always succeed regardless of token state
// to prevent the 401→refresh→auth:logout→logout→401 infinite loop.
auth.post("/logout", async (c) => {
  // Optionally blacklist the JWT if one was provided (best-effort)
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { jti } = await verifyToken(token, c.env.JWT_SECRET);
      if (jti) {
        await c.env.JWT_BLACKLIST.put(jti, "1", { expirationTtl: 960 });
      }
    } catch {
      // Token invalid/expired — nothing to blacklist
    }
  }
  deleteCookie(c, "refresh_token", { path: "/api/auth", sameSite: "None", secure: true });
  return c.json({ ok: true });
});

// POST /api/auth/refresh
auth.post("/refresh", async (c) => {
  const refreshToken = getCookie(c, "refresh_token");
  if (!refreshToken) {
    return c.json({ error: "No refresh token", code: "UNAUTHORIZED" }, 401);
  }

  try {
    const payload = await verifyToken(refreshToken, c.env.REFRESH_SECRET);
    const user = await c.env.DB.prepare(
      "SELECT id, email, given_name, family_name, nickname, total_points, admin FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email: string; admin: number }>();

    if (!user) {
      return c.json({ error: "User not found", code: "NOT_FOUND" }, 404);
    }

    const jti = generateId();
    const token = await signAccessToken(
      { sub: user.id, email: user.email, admin: user.admin, jti },
      c.env.JWT_SECRET
    );

    return c.json({ token });
  } catch {
    return c.json({ error: "Invalid refresh token", code: "INVALID_TOKEN" }, 401);
  }
});

// GET /api/auth/me
auth.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare(
    "SELECT id, email, given_name, family_name, nickname, total_points, admin, created_at FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  if (!user) {
    return c.json({ error: "User not found", code: "NOT_FOUND" }, 404);
  }
  return c.json(user);
});

// PATCH /api/auth/me — self-update nickname only
const updateMeSchema = z.object({
  nickname: z.string().min(1).max(50).trim(),
});

auth.patch("/me", requireAuth, zValidator("json", updateMeSchema), async (c) => {
  const userId = c.get("userId");
  const { nickname } = c.req.valid("json");

  await c.env.DB.prepare("UPDATE users SET nickname = ? WHERE id = ?")
    .bind(nickname, userId)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT id, email, given_name, family_name, nickname, total_points, admin, created_at FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  return c.json(updated);
});

export default auth;
