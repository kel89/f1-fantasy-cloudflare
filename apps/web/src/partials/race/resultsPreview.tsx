import type { Result, Driver } from "@f1/shared";
import { DriverImage } from "../../utils/driverImage";

interface ResultsPreviewProps {
  results: Array<Result & { driver: Driver }>;
}

export default function ResultsPreview({ results }: ResultsPreviewProps) {
  const sorted = [...results].sort((a, b) => a.position - b.position).slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 shadow-lg rounded">
      <h1 className="text-xl text-gray-500 dark:text-gray-300 font-[Racing_Sans_One] mb-2">Race Results</h1>
      <table className="table-auto w-full">
        <thead className="border-b">
          <tr className="text-left">
            <th className="text-gray-600 dark:text-gray-300 px-2 py-2 text-sm">P</th>
            <th className="text-gray-600 dark:text-gray-300 px-2 py-2 text-sm">Driver</th>
            <th className="text-gray-600 dark:text-gray-300 px-2 py-2 text-sm">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result) => (
            <tr
              key={result.id}
              className="border-b even:bg-gray-50 dark:even:bg-gray-700 transition duration-150 hover:bg-red-50 dark:hover:bg-gray-600"
            >
              <td className="px-2 py-2 font-bold text-gray-800 dark:text-gray-200">{result.position}</td>
              <td className="px-2 py-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DriverImage
                  abbreviation={result.driver.abbreviation}
                  className="h-8 w-8 object-cover"
                />
                <span className="text-sm">
                  {result.driver.first_name} {result.driver.last_name}
                </span>
              </td>
              <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{result.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
