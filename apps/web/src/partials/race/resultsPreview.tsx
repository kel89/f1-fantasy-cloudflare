import type { Result, Driver } from "@f1/shared";
import { DriverImage } from "../../utils/driverImage";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

interface ResultsPreviewProps {
  results: Array<Result & { driver: Driver }>;
}

const PODIUM_ICON: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-400",
  3: "text-amber-600",
};

export default function ResultsPreview({ results }: ResultsPreviewProps) {
  const sorted = [...results].sort((a, b) => a.position - b.position).slice(0, 10);

  return (
    <div className="f1-card">
      <h1 className="text-xl text-gray-500 dark:text-gray-300 font-[Racing_Sans_One] mb-3">Race Results</h1>
      <div className="flex flex-col gap-1">
        {sorted.map((result) => {
          const podium = PODIUM_ICON[result.position];
          return (
            <div
              key={result.id}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg transition duration-150 hover:bg-red-50 dark:hover:bg-gray-700
                ${podium ? "border-l-4 border-l-current" : ""}
                ${result.position === 1 ? "border-l-yellow-400" : result.position === 2 ? "border-l-gray-400" : result.position === 3 ? "border-l-amber-600" : ""}`}
            >
              <div className="w-7 text-center flex-shrink-0">
                {podium ? (
                  <EmojiEventsIcon fontSize="small" className={podium} />
                ) : (
                  <span className="text-sm text-gray-400 font-medium">{result.position}</span>
                )}
              </div>
              <DriverImage
                abbreviation={result.driver.abbreviation}
                className="h-8 w-8 object-cover"
              />
              <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                {result.driver.first_name} {result.driver.last_name}
              </span>
              <span className={`font-semibold text-sm tabular-nums ${result.position <= 3 ? "text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                {result.points} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
