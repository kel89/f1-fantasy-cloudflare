// Scoring algorithm shared between frontend and backend

export const POSITION_POINTS: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

/**
 * Calculate points for a single roster against race results.
 * @param driverOrder - Array of driver abbreviations in predicted order (index 0 = P1)
 * @param results - Map of driver abbreviation → actual finishing position
 * @returns { total, breakdown } where breakdown[i] is points earned for position i+1
 */
export function calculateRosterPoints(
  driverOrder: string[],
  results: Record<string, number>
): { total: number; breakdown: number[] } {
  let total = 0;
  const breakdown: number[] = [];

  for (let i = 0; i < driverOrder.length; i++) {
    const abbr = driverOrder[i];
    const predictedPos = i + 1;
    const actualPos = results[abbr];

    let pts = 0;
    if (actualPos !== undefined && predictedPos === actualPos) {
      pts = POSITION_POINTS[predictedPos] ?? 0;
    }
    breakdown.push(pts);
    total += pts;
  }

  return { total, breakdown };
}
