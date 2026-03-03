import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/auth";
import { safeJsonParse } from "../lib/safeJson";

const races = new Hono<{ Bindings: Env }>();

// All race routes require auth
races.use("*", requireAuth);

// GET /api/races
races.get("/", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT * FROM races ORDER BY round ASC"
  ).all();
  return c.json(rows.results);
});

// GET /api/races/:id
races.get("/:id", async (c) => {
  const raceId = c.req.param("id");

  const race = await c.env.DB.prepare("SELECT * FROM races WHERE id = ?")
    .bind(raceId)
    .first();

  if (!race) {
    return c.json({ error: "Race not found", code: "NOT_FOUND" }, 404);
  }

  // Results with driver info
  const results = await c.env.DB.prepare(
    `SELECT r.*, d.id as driver_id, d.first_name, d.last_name, d.abbreviation, d.number, d.team
     FROM results r
     JOIN drivers d ON d.id = r.driver_id
     WHERE r.race_id = ?
     ORDER BY r.position ASC`
  )
    .bind(raceId)
    .all();

  const formattedResults = results.results.map((r: Record<string, unknown>) => ({
    id: r.id,
    race_id: r.race_id,
    position: r.position,
    points: r.points,
    driver: {
      id: r.driver_id,
      first_name: r.first_name,
      last_name: r.last_name,
      abbreviation: r.abbreviation,
      number: r.number,
      team: r.team,
    },
  }));

  // Rosters with user info
  const rosters = await c.env.DB.prepare(
    `SELECT ro.*, u.nickname, u.given_name, u.family_name
     FROM rosters ro
     JOIN users u ON u.id = ro.user_id
     WHERE ro.race_id = ?
     ORDER BY ro.total_points DESC`
  )
    .bind(raceId)
    .all();

  const formattedRosters = rosters.results.map((r: Record<string, unknown>) => ({
    id: r.id,
    user_id: r.user_id,
    race_id: r.race_id,
    driver_order: safeJsonParse<string[]>(r.driver_order as string, []),
    total_points: r.total_points,
    breakdown: safeJsonParse<number[] | null>(r.breakdown as string, null),
    updated_at: r.updated_at,
    user: {
      id: r.user_id,
      nickname: r.nickname,
      given_name: r.given_name,
      family_name: r.family_name,
    },
  }));

  return c.json({ ...race, results: formattedResults, rosters: formattedRosters });
});

// PATCH /api/races/:id — admin only
const patchRaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  race_date: z.string().datetime().optional(),
  status: z.enum(["upcoming", "locked", "scored"]).optional(),
});

races.patch("/:id", requireAdmin, zValidator("json", patchRaceSchema), async (c) => {
  const raceId = c.req.param("id");
  const body = c.req.valid("json");

  const existing = await c.env.DB.prepare("SELECT id FROM races WHERE id = ?")
    .bind(raceId)
    .first();

  if (!existing) {
    return c.json({ error: "Race not found", code: "NOT_FOUND" }, 404);
  }

  const fields = Object.entries(body).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    return c.json({ error: "No fields to update", code: "VALIDATION_ERROR" }, 400);
  }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(", ");
  const values = fields.map(([, v]) => v);

  await c.env.DB.prepare(`UPDATE races SET ${setClauses} WHERE id = ?`)
    .bind(...values, raceId)
    .run();

  const updated = await c.env.DB.prepare("SELECT * FROM races WHERE id = ?")
    .bind(raceId)
    .first();

  return c.json(updated);
});

export default races;
