import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/auth";
import { generateId } from "../lib/ids";
import { safeJsonParse } from "../lib/safeJson";

const rosters = new Hono<{ Bindings: Env }>();

rosters.use("*", requireAuth);

// GET /api/races/:id/roster — current user's roster
rosters.get("/:id/roster", async (c) => {
  const raceId = c.req.param("id");
  const userId = c.get("userId");

  const roster = await c.env.DB.prepare(
    "SELECT * FROM rosters WHERE race_id = ? AND user_id = ?"
  )
    .bind(raceId, userId)
    .first<{ driver_order: string; breakdown: string | null; [key: string]: unknown }>();

  if (!roster) {
    return c.json(null);
  }

  return c.json({
    ...roster,
    driver_order: safeJsonParse<string[]>(roster.driver_order, []),
    breakdown: safeJsonParse<number[] | null>(roster.breakdown, null),
  });
});

const setRosterSchema = z.object({
  driver_order: z
    .array(z.string().min(2).max(5))
    .min(1)
    .max(22),
});

// PUT /api/races/:id/roster — create or update roster
rosters.put("/:id/roster", zValidator("json", setRosterSchema), async (c) => {
  const raceId = c.req.param("id");
  const userId = c.get("userId");
  const { driver_order } = c.req.valid("json");

  // Check race exists and is not locked/scored
  const race = await c.env.DB.prepare("SELECT status FROM races WHERE id = ?")
    .bind(raceId)
    .first<{ status: string }>();

  if (!race) {
    return c.json({ error: "Race not found", code: "NOT_FOUND" }, 404);
  }

  if (race.status !== "upcoming") {
    return c.json(
      {
        error: "Race is locked — roster changes are not allowed",
        code: "RACE_LOCKED",
      },
      403
    );
  }

  // Validate all abbreviations exist
  const placeholders = driver_order.map(() => "?").join(",");
  const driversFound = await c.env.DB.prepare(
    `SELECT abbreviation FROM drivers WHERE abbreviation IN (${placeholders})`
  )
    .bind(...driver_order)
    .all();

  if (driversFound.results.length !== driver_order.length) {
    return c.json(
      { error: "One or more driver abbreviations not found", code: "INVALID_DRIVERS" },
      400
    );
  }

  // Check for existing roster
  const existing = await c.env.DB.prepare(
    "SELECT id FROM rosters WHERE race_id = ? AND user_id = ?"
  )
    .bind(raceId, userId)
    .first<{ id: string }>();

  const orderJson = JSON.stringify(driver_order);
  const now = new Date().toISOString();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE rosters SET driver_order = ?, updated_at = ? WHERE id = ?"
    )
      .bind(orderJson, now, existing.id)
      .run();

    const updated = await c.env.DB.prepare("SELECT * FROM rosters WHERE id = ?")
      .bind(existing.id)
      .first<{ driver_order: string; breakdown: string | null; [key: string]: unknown }>();

    return c.json({
      ...updated,
      driver_order,
      breakdown: safeJsonParse<number[] | null>(updated?.breakdown, null),
    });
  } else {
    const id = generateId();
    await c.env.DB.prepare(
      "INSERT INTO rosters (id, user_id, race_id, driver_order, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(id, userId, raceId, orderJson, now)
      .run();

    return c.json(
      {
        id,
        user_id: userId,
        race_id: raceId,
        driver_order,
        total_points: null,
        breakdown: null,
        updated_at: now,
      },
      201
    );
  }
});

// PATCH /api/races/:id/rosters/:rosterId — admin override any roster
const adminRosterSchema = z.object({
  driver_order: z.array(z.string()).min(1).max(22).optional(),
  total_points: z.number().int().optional(),
  breakdown: z.array(z.number()).optional(),
});

rosters.patch(
  "/:id/rosters/:rosterId",
  requireAdmin,
  zValidator("json", adminRosterSchema),
  async (c) => {
    const rosterId = c.req.param("rosterId");
    const body = c.req.valid("json");

    const existing = await c.env.DB.prepare("SELECT * FROM rosters WHERE id = ?")
      .bind(rosterId)
      .first();

    if (!existing) {
      return c.json({ error: "Roster not found", code: "NOT_FOUND" }, 404);
    }

    const updates: Record<string, unknown> = {};
    if (body.driver_order !== undefined)
      updates.driver_order = JSON.stringify(body.driver_order);
    if (body.total_points !== undefined) updates.total_points = body.total_points;
    if (body.breakdown !== undefined)
      updates.breakdown = JSON.stringify(body.breakdown);
    updates.updated_at = new Date().toISOString();

    const fields = Object.entries(updates);
    const setClauses = fields.map(([k]) => `${k} = ?`).join(", ");
    const values = fields.map(([, v]) => v);

    await c.env.DB.prepare(`UPDATE rosters SET ${setClauses} WHERE id = ?`)
      .bind(...values, rosterId)
      .run();

    const updated = await c.env.DB.prepare("SELECT * FROM rosters WHERE id = ?")
      .bind(rosterId)
      .first<{ driver_order: string; breakdown: string | null; [key: string]: unknown }>();

    return c.json({
      ...updated,
      driver_order: safeJsonParse<string[]>(updated?.driver_order, []),
      breakdown: safeJsonParse<number[] | null>(updated?.breakdown, null),
    });
  }
);

export default rosters;
