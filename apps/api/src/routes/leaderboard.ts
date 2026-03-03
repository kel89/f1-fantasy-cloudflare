import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../middleware/auth";

const leaderboard = new Hono<{ Bindings: Env }>();

leaderboard.use("*", requireAuth);

// GET /api/leaderboard
leaderboard.get("/", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT id, nickname, given_name, family_name, total_points
     FROM users
     ORDER BY total_points DESC, nickname ASC`
  ).all();
  return c.json(rows.results);
});

export default leaderboard;
