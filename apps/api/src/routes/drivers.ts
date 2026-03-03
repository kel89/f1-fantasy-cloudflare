import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../middleware/auth";

const drivers = new Hono<{ Bindings: Env }>();

drivers.use("*", requireAuth);

// GET /api/drivers
drivers.get("/", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT * FROM drivers ORDER BY team, last_name"
  ).all();
  return c.json(rows.results);
});

export default drivers;
