import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../middleware/auth";

const announcement = new Hono<{ Bindings: Env }>();

announcement.use("*", requireAuth);

// GET /api/announcement
announcement.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, message, version, updated_at FROM announcements LIMIT 1"
  ).first<{ id: string; message: string; version: number; updated_at: string }>();

  return c.json({ announcement: row ?? null });
});

export default announcement;
