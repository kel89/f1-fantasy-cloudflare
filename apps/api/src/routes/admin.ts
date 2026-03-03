import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/auth";
import { generateId } from "../lib/ids";
import { calculateRosterPoints } from "@f1/shared";

const admin = new Hono<{ Bindings: Env }>();

admin.use("*", requireAuth, requireAdmin);

// ── Score a race ──────────────────────────────────────────────────────────────
const scoreRaceSchema = z.object({
  results: z
    .array(
      z.object({
        driver_abbreviation: z.string().min(2).max(5),
        position: z.number().int().min(1).max(30),
      })
    )
    .min(1),
});

// POST /api/admin/races/:id/score
admin.post("/races/:id/score", zValidator("json", scoreRaceSchema), async (c) => {
  const raceId = c.req.param("id");
  const { results } = c.req.valid("json");

  const race = await c.env.DB.prepare("SELECT * FROM races WHERE id = ?")
    .bind(raceId)
    .first<{ id: string; status: string }>();

  if (!race) {
    return c.json({ error: "Race not found", code: "NOT_FOUND" }, 404);
  }
  if (race.status === "scored") {
    return c.json(
      { error: "Race already scored. Delete results first to re-score.", code: "ALREADY_SCORED" },
      409
    );
  }

  // Validate driver abbreviations
  const abbrevs = results.map((r) => r.driver_abbreviation);
  const placeholders = abbrevs.map(() => "?").join(",");
  const driversFound = await c.env.DB.prepare(
    `SELECT id, abbreviation FROM drivers WHERE abbreviation IN (${placeholders})`
  )
    .bind(...abbrevs)
    .all<{ id: string; abbreviation: string }>();

  const driverMap: Record<string, string> = {};
  for (const d of driversFound.results) {
    driverMap[d.abbreviation] = d.id;
  }

  const missing = abbrevs.filter((a) => !driverMap[a]);
  if (missing.length > 0) {
    return c.json(
      { error: `Unknown driver abbreviations: ${missing.join(", ")}`, code: "INVALID_DRIVERS" },
      400
    );
  }

  // Build position map for scoring: abbreviation → position
  const positionMap: Record<string, number> = {};
  for (const r of results) {
    positionMap[r.driver_abbreviation] = r.position;
  }

  // Insert results (upsert)
  const insertStmts = results.map((r) => {
    const driverId = driverMap[r.driver_abbreviation];
    const pts = POSITION_POINTS[r.position] ?? 0;
    return c.env.DB.prepare(
      `INSERT INTO results (id, race_id, driver_id, position, points)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(race_id, driver_id) DO UPDATE SET position=excluded.position, points=excluded.points`
    ).bind(generateId(), raceId, driverId, r.position, pts);
  });

  // Get all rosters for this race
  const rostersResult = await c.env.DB.prepare(
    "SELECT id, user_id, driver_order FROM rosters WHERE race_id = ?"
  )
    .bind(raceId)
    .all<{ id: string; user_id: string; driver_order: string }>();

  // Calculate points for each roster
  const rosterUpdates = rostersResult.results.map((roster) => {
    const driverOrder: string[] = JSON.parse(roster.driver_order || "[]");
    const { total, breakdown } = calculateRosterPoints(driverOrder, positionMap);
    return { rosterId: roster.id, userId: roster.user_id, total, breakdown };
  });

  // Execute all DB changes in batch
  const batch = [
    ...insertStmts,
    // Update race status
    c.env.DB.prepare("UPDATE races SET status = 'scored' WHERE id = ?").bind(raceId),
    // Update each roster
    ...rosterUpdates.map((r) =>
      c.env.DB.prepare(
        "UPDATE rosters SET total_points = ?, breakdown = ? WHERE id = ?"
      ).bind(r.total, JSON.stringify(r.breakdown), r.rosterId)
    ),
    // Update user total_points
    ...rosterUpdates.map((r) =>
      c.env.DB.prepare(
        "UPDATE users SET total_points = total_points + ? WHERE id = ?"
      ).bind(r.total, r.userId)
    ),
  ];

  await c.env.DB.batch(batch);

  return c.json({
    ok: true,
    raceId,
    rostersScored: rosterUpdates.length,
    rosterResults: rosterUpdates.map((r) => ({
      rosterId: r.rosterId,
      userId: r.userId,
      points: r.total,
    })),
  });
});

// ── Delete results (to re-score) ──────────────────────────────────────────────
// DELETE /api/admin/races/:id/results
admin.delete("/races/:id/results", async (c) => {
  const raceId = c.req.param("id");

  const race = await c.env.DB.prepare("SELECT * FROM races WHERE id = ?")
    .bind(raceId)
    .first<{ id: string; status: string }>();

  if (!race) {
    return c.json({ error: "Race not found", code: "NOT_FOUND" }, 404);
  }
  if (race.status !== "scored") {
    return c.json({ error: "Race has not been scored yet", code: "NOT_SCORED" }, 409);
  }

  // Get roster scores to subtract from user totals
  const rosters = await c.env.DB.prepare(
    "SELECT id, user_id, total_points FROM rosters WHERE race_id = ? AND total_points IS NOT NULL"
  )
    .bind(raceId)
    .all<{ id: string; user_id: string; total_points: number }>();

  const batch = [
    // Delete results
    c.env.DB.prepare("DELETE FROM results WHERE race_id = ?").bind(raceId),
    // Reset race status
    c.env.DB.prepare("UPDATE races SET status = 'upcoming' WHERE id = ?").bind(raceId),
    // Reset roster scores
    c.env.DB.prepare(
      "UPDATE rosters SET total_points = NULL, breakdown = NULL WHERE race_id = ?"
    ).bind(raceId),
    // Subtract old roster points from user totals
    ...rosters.results.map((r) =>
      c.env.DB.prepare(
        "UPDATE users SET total_points = MAX(0, total_points - ?) WHERE id = ?"
      ).bind(r.total_points, r.user_id)
    ),
  ];

  await c.env.DB.batch(batch);

  return c.json({ ok: true, raceId, rostersReset: rosters.results.length });
});

// ── Admin user management ─────────────────────────────────────────────────────
// GET /api/admin/users
admin.get("/users", async (c) => {
  const users = await c.env.DB.prepare(
    "SELECT id, email, given_name, family_name, nickname, total_points, admin, created_at FROM users ORDER BY total_points DESC"
  ).all();
  return c.json(users.results);
});

// PATCH /api/admin/users/:id
const patchUserSchema = z.object({
  nickname: z.string().min(1).max(50).trim().optional(),
  total_points: z.number().int().min(0).optional(),
  admin: z.number().int().min(0).max(1).optional(),
});

admin.patch("/users/:id", zValidator("json", patchUserSchema), async (c) => {
  const userId = c.req.param("id");
  const body = c.req.valid("json");

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE id = ?")
    .bind(userId)
    .first();

  if (!existing) {
    return c.json({ error: "User not found", code: "NOT_FOUND" }, 404);
  }

  const fields = Object.entries(body).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    return c.json({ error: "No fields to update", code: "VALIDATION_ERROR" }, 400);
  }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(", ");
  const values = fields.map(([, v]) => v);

  await c.env.DB.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`)
    .bind(...values, userId)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT id, email, given_name, family_name, nickname, total_points, admin, created_at FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  return c.json(updated);
});

// Scoring table constant
const POSITION_POINTS: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};

export default admin;
