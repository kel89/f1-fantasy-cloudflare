import { create } from "zustand";
import type { User } from "@f1/shared";
import { api, setToken } from "../api/client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    given_name: string;
    family_name: string;
    nickname: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Try to refresh the token from the HttpOnly cookie
      const { token } = await api.auth.refresh();
      setToken(token);
      const user = await api.auth.me();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.auth.login({ email, password });
      setToken(token);
      set({ user, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.auth.signup(data);
      setToken(token);
      set({ user, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    setToken(null);
    set({ user: null });
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),
}));
