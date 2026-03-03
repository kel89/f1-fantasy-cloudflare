// ─── Domain Types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  nickname: string;
  total_points: number;
  admin: number; // 0 or 1
  created_at: string;
}

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  abbreviation: string;
  number: string;
  team: string;
}

export type RaceStatus = "upcoming" | "locked" | "scored";

export interface Race {
  id: string;
  round: number;
  name: string;
  city: string;
  country: string;
  race_date: string; // ISO 8601 UTC
  status: RaceStatus;
}

export interface Roster {
  id: string;
  user_id: string;
  race_id: string;
  driver_order: string[]; // abbreviations
  total_points: number | null;
  breakdown: number[] | null; // per-driver points
  updated_at: string;
}

export interface Result {
  id: string;
  race_id: string;
  driver_id: string;
  position: number;
  points: number;
}

// ─── API Request / Response Shapes ───────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}

// Auth
export interface SignupRequest {
  email: string;
  password: string;
  given_name: string;
  family_name: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "password_hash">;
}

// Races
export interface RaceWithDetails extends Race {
  results: Array<Result & { driver: Driver }>;
  rosters: Array<Roster & { user: Pick<User, "id" | "nickname"> }>;
}

// Roster mutations
export interface SetRosterRequest {
  driver_order: string[]; // array of abbreviations, 10 items
}

export interface AdminScoreRequest {
  results: Array<{
    driver_abbreviation: string;
    position: number;
  }>;
}

export interface AdminRosterOverrideRequest {
  driver_order?: string[];
  total_points?: number;
  breakdown?: number[];
}

// Leaderboard
export interface LeaderboardEntry {
  id: string;
  nickname: string;
  total_points: number;
  given_name: string;
  family_name: string;
}
