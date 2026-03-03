-- F1 Fantasy DB Schema

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  abbreviation TEXT UNIQUE NOT NULL,
  number TEXT NOT NULL,
  team TEXT NOT NULL
);

CREATE TABLE races (
  id TEXT PRIMARY KEY,
  round INTEGER NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  race_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming'
);

CREATE TABLE rosters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  race_id TEXT NOT NULL REFERENCES races(id),
  driver_order TEXT NOT NULL DEFAULT '[]',
  total_points INTEGER,
  breakdown TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, race_id)
);
CREATE INDEX idx_rosters_race ON rosters(race_id);
CREATE INDEX idx_rosters_user ON rosters(user_id);

CREATE TABLE results (
  id TEXT PRIMARY KEY,
  race_id TEXT NOT NULL REFERENCES races(id),
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  position INTEGER NOT NULL,
  points INTEGER NOT NULL,
  UNIQUE(race_id, driver_id)
);
CREATE INDEX idx_results_race ON results(race_id);
