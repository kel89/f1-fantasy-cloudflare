import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-declare schemas used in routes to validate them in isolation
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  given_name: z.string().min(1).max(100).trim(),
  family_name: z.string().min(1).max(100).trim(),
  nickname: z.string().min(1).max(50).trim(),
});

const setRosterSchema = z.object({
  driver_order: z.array(z.string().min(2).max(5)).min(1).max(22),
});

const scoreRaceSchema = z.object({
  results: z.array(
    z.object({
      driver_abbreviation: z.string().min(2).max(5),
      position: z.number().int().min(1).max(30),
    })
  ).min(1),
});

describe("Signup validation", () => {
  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      given_name: "John",
      family_name: "Doe",
      nickname: "JohnD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "securepassword",
      given_name: "John",
      family_name: "Doe",
      nickname: "JohnD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "short",
      given_name: "John",
      family_name: "Doe",
      nickname: "JohnD",
    });
    expect(result.success).toBe(false);
  });
});

describe("SetRoster validation", () => {
  it("accepts valid driver order", () => {
    const result = setRosterSchema.safeParse({
      driver_order: ["VER", "NOR", "PIA", "HAM", "LEC", "RUS", "SAI", "ALO", "STR", "GAS"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty driver order", () => {
    const result = setRosterSchema.safeParse({ driver_order: [] });
    expect(result.success).toBe(false);
  });

  it("rejects too many drivers", () => {
    const result = setRosterSchema.safeParse({
      driver_order: Array(23).fill("VER"),
    });
    expect(result.success).toBe(false);
  });
});

describe("ScoreRace validation", () => {
  it("accepts valid results", () => {
    const result = scoreRaceSchema.safeParse({
      results: [
        { driver_abbreviation: "VER", position: 1 },
        { driver_abbreviation: "NOR", position: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid position 0", () => {
    const result = scoreRaceSchema.safeParse({
      results: [{ driver_abbreviation: "VER", position: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty results", () => {
    const result = scoreRaceSchema.safeParse({ results: [] });
    expect(result.success).toBe(false);
  });
});
