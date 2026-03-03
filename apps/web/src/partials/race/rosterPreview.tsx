import type { Driver, Roster, Result } from "@f1/shared";
import { DriverImage } from "../../utils/driverImage";

interface RosterPreviewProps {
  roster: Roster;
  drivers: Driver[];
  results?: Array<Result & { driver: Driver }>;
}

export default function RosterPreview({ roster, drivers, results }: RosterPreviewProps) {
  const driverOrder = roster.driver_order;
  const breakdown = roster.breakdown;

  // Build result lookup: abbreviation → position
  const resultMap: Record<string, number> = {};
  if (results) {
    for (const r of results) {
      resultMap[r.driver.abbreviation] = r.position;
    }
  }

  return (
    <div className="flex flex-col w-full gap-1">
      {driverOrder.slice(0, 10).map((abbr, i) => {
        const driver = drivers.find((d) => d.abbreviation === abbr);
        const pts = breakdown?.[i];
        const actualPos = resultMap[abbr];
        const isCorrect = actualPos !== undefined && actualPos === i + 1;
        const isScored = results && results.length > 0;

        let rowBg = "";
        if (isScored) {
          rowBg = isCorrect ? "bg-green-100" : "bg-red-50";
        }

        return (
          <div
            key={abbr}
            className={`flex gap-3 items-center border-t border-gray-100 py-1 transition duration-200 ${rowBg}`}
          >
            <div className="font-bold text-gray-800 text-lg w-6 text-right">{i + 1}</div>
            <DriverImage abbreviation={abbr} className="h-10 w-10 object-cover" />
            <div className="flex-1">
              <div className="text-sm font-medium">
                {driver ? `${driver.first_name} ${driver.last_name}` : abbr}
              </div>
              {driver && <div className="text-xs text-gray-400">{driver.team}</div>}
            </div>
            {isScored && (
              <div className="text-sm font-semibold text-gray-700 min-w-8 text-right">
                {pts !== undefined ? (pts > 0 ? `+${pts}` : "0") : ""}
              </div>
            )}
          </div>
        );
      })}
      {breakdown && (
        <div className="mt-2 text-right text-sm font-bold text-gray-700">
          Total: {roster.total_points ?? 0} pts
        </div>
      )}
    </div>
  );
}
