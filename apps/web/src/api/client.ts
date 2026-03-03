import type {
  AuthResponse,
  Driver,
  LeaderboardEntry,
  Race,
  RaceWithDetails,
  Roster,
  SignupRequest,
  LoginRequest,
  SetRosterRequest,
  AdminScoreRequest,
  AdminRosterOverrideRequest,
  User,
} from "@f1/shared";

// In dev, Vite proxies /api/* to localhost:8787, so base is empty.
// In production, VITE_API_URL points to the deployed Worker URL
// (e.g. https://f1-fantasy-api.your-account.workers.dev).
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// Tokens stored in memory (not localStorage) for security
let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

export function getToken(): string | null {
  return accessToken;
}

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers, credentials: "include" });

  // 401 → try refresh once
  if (res.status === 401 && retry) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { token: string };
        setToken(data.token);
        return request<T>(path, options, false);
      }
    } catch {
      // refresh failed
    }
    setToken(null);
    // Trigger logout by dispatching custom event
    window.dispatchEvent(new Event("auth:logout"));
    throw new ApiError("UNAUTHORIZED", "Session expired", 401);
  }

  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error: string; code: string };
      code = body.code ?? code;
      message = body.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(code, message, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    signup: (data: SignupRequest) =>
      request<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: LoginRequest) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<{ ok: boolean }>("/auth/logout", { method: "POST" }, false),

    me: () => request<User>("/auth/me"),

    refresh: () =>
      request<{ token: string }>("/auth/refresh", { method: "POST" }, false),

    updateMe: (data: { nickname: string }) =>
      request<User>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ─── Races ──────────────────────────────────────────────────────────────────
  races: {
    list: () => request<Race[]>("/races"),

    get: (id: string) => request<RaceWithDetails>(`/races/${id}`),

    update: (
      id: string,
      data: Partial<Pick<Race, "name" | "city" | "country" | "race_date" | "status">>
    ) =>
      request<Race>(`/races/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ─── Rosters ────────────────────────────────────────────────────────────────
  rosters: {
    get: (raceId: string) =>
      request<Roster | null>(`/races/${raceId}/roster`),

    set: (raceId: string, data: SetRosterRequest) =>
      request<Roster>(`/races/${raceId}/roster`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    adminOverride: (raceId: string, rosterId: string, data: AdminRosterOverrideRequest) =>
      request<Roster>(`/races/${raceId}/rosters/${rosterId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ─── Drivers ────────────────────────────────────────────────────────────────
  drivers: {
    list: () => request<Driver[]>("/drivers"),
  },

  // ─── Leaderboard ────────────────────────────────────────────────────────────
  leaderboard: {
    get: () => request<LeaderboardEntry[]>("/leaderboard"),
  },

  // ─── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    scoreRace: (raceId: string, data: AdminScoreRequest) =>
      request<{ ok: boolean; rostersScored: number }>(`/admin/races/${raceId}/score`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    deleteResults: (raceId: string) =>
      request<{ ok: boolean }>(`/admin/races/${raceId}/results`, {
        method: "DELETE",
      }),

    getUsers: () =>
      request<User[]>("/admin/users"),

    updateUser: (userId: string, data: Partial<Pick<User, "nickname" | "total_points" | "admin">>) =>
      request<User>(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
};

export { ApiError };
