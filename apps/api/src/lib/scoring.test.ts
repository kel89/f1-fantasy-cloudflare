import { describe, it, expect } from "vitest";
import { calculateRosterPoints } from "@f1/shared";

describe("calculateRosterPoints", () => {
  it("awards 0 when no drivers match", () => {
    const driverOrder = ["VER", "NOR", "PIA", "HAM", "LEC", "RUS", "SAI", "ALO", "STR", "GAS"];
    // All actual positions outside top 10 — none match predicted positions
    const results: Record<string, number> = {
      VER: 11, NOR: 12, PIA: 13, HAM: 14, LEC: 15, RUS: 16, SAI: 17, ALO: 18, STR: 19, GAS: 20,
    };
    const { total, breakdown } = calculateRosterPoints(driverOrder, results);
    expect(total).toBe(0);
    expect(breakdown.every((p) => p === 0)).toBe(true);
  });

  it("awards full points when all drivers match", () => {
    const driverOrder = ["VER", "NOR", "PIA", "HAM", "LEC", "RUS", "SAI", "ALO", "STR", "GAS"];
    const results: Record<string, number> = {
      VER: 1, NOR: 2, PIA: 3, HAM: 4, LEC: 5, RUS: 6, SAI: 7, ALO: 8, STR: 9, GAS: 10,
    };
    const { total, breakdown } = calculateRosterPoints(driverOrder, results);
    expect(total).toBe(25 + 18 + 15 + 12 + 10 + 8 + 6 + 4 + 2 + 1);
    expect(breakdown[0]).toBe(25);
    expect(breakdown[1]).toBe(18);
    expect(breakdown[9]).toBe(1);
  });

  it("awards partial points for partial matches", () => {
    const driverOrder = ["VER", "NOR", "PIA", "HAM", "LEC", "RUS", "SAI", "ALO", "STR", "GAS"];
    // Only P1 (VER) and P3 (PIA) match; all others finish outside top 10
    const results: Record<string, number> = {
      VER: 1, NOR: 11, PIA: 3, HAM: 12, LEC: 13, RUS: 14, SAI: 15, ALO: 16, STR: 17, GAS: 18,
    };
    const { total, breakdown } = calculateRosterPoints(driverOrder, results);
    // VER at P1 = 25, PIA at P3 = 15
    expect(breakdown[0]).toBe(25); // VER P1 correct
    expect(breakdown[1]).toBe(0);  // NOR P2 wrong (actual P11)
    expect(breakdown[2]).toBe(15); // PIA P3 correct
    expect(total).toBe(40);
  });

  it("handles driver not in results", () => {
    const driverOrder = ["VER", "NOR"];
    const results: Record<string, number> = { VER: 1 }; // NOR missing
    const { total, breakdown } = calculateRosterPoints(driverOrder, results);
    expect(breakdown[0]).toBe(25);
    expect(breakdown[1]).toBe(0);
    expect(total).toBe(25);
  });

  it("awards 0 for positions 11+ even if correct", () => {
    const driverOrder = Array.from({ length: 22 }, (_, i) => `D${i + 1}`);
    const results: Record<string, number> = {};
    for (let i = 0; i < 22; i++) results[`D${i + 1}`] = i + 1;
    const { total, breakdown } = calculateRosterPoints(driverOrder, results);
    // Positions 1-10 earn points, 11+ earn 0
    expect(breakdown[0]).toBe(25);
    expect(breakdown[10]).toBe(0);
    expect(breakdown[11]).toBe(0);
    expect(total).toBe(25 + 18 + 15 + 12 + 10 + 8 + 6 + 4 + 2 + 1);
  });
});
