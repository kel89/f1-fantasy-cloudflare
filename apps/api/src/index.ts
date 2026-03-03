import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Env } from "./types";
import authRoutes from "./routes/auth";
import raceRoutes from "./routes/races";
import driverRoutes from "./routes/drivers";
import rosterRoutes from "./routes/rosters";
import leaderboardRoutes from "./routes/leaderboard";
import adminRoutes from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use("*", secureHeaders());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      // Allow localhost for dev, and Pages domain for prod
      if (!origin) return "*";
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes(".pages.dev") ||
        origin.includes("f1fantasy") // customize to your domain
      ) {
        return origin;
      }
      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route("/api/auth", authRoutes);
app.route("/api/races", raceRoutes);
// Roster routes are mounted under races
app.route("/api/races", rosterRoutes);
app.route("/api/drivers", driverRoutes);
app.route("/api/leaderboard", leaderboardRoutes);
app.route("/api/admin", adminRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now() }));

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ error: "Not found", code: "NOT_FOUND" }, 404)
);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, 500);
});

async function handleScheduled(event: ScheduledEvent, env: Env) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE races SET status = 'locked'
     WHERE status = 'upcoming' AND race_date <= ?
       AND (lock_override_until IS NULL OR lock_override_until <= ?)`
  )
    .bind(now, now)
    .run();
}

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
