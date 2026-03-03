import { Layout } from "../utils/layout";
import { POSITION_POINTS } from "@f1/shared";

const ORDINALS: Record<number, string> = {
  1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th",
  6: "6th", 7: "7th", 8: "8th", 9: "9th", 10: "10th",
};

export default function About() {
  return (
    <Layout pageName="About">
      <div className="p-6 gap-8 bg-gray-100 dark:bg-gray-900 min-h-screen w-full flex justify-center">
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-sm p-5 w-full max-w-3xl shadow-lg">
          <h1 className="text-3xl font-[Racing_Sans_One] text-gray-700 dark:text-gray-200 mb-2">
            How To Play
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            For each race, set your driver roster to match your prediction for
            the finishing order—that's it! Only the top 10 finishers earn
            points, and points are awarded based on your predicted position. You
            can make changes to your roster up until the race start time, after
            which the roster will be locked.
          </p>

          <h1 className="text-3xl font-[Racing_Sans_One] text-gray-700 dark:text-gray-200 mb-2">
            Points Breakdown
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Points are awarded only when you correctly predict a driver's
            finishing position:
          </p>
          <table className="table-auto mb-4">
            <thead className="border-b">
              <tr>
                <th className="text-gray-700 dark:text-gray-200 px-3 py-2 text-left">Position</th>
                <th className="text-gray-700 dark:text-gray-200 px-3 py-2 text-left">Points</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(POSITION_POINTS).map(([pos, pts]) => (
                <tr
                  key={pos}
                  className="border-b odd:bg-gray-50 dark:odd:bg-gray-700 hover:bg-red-50 dark:hover:bg-gray-600 transition duration-150"
                >
                  <td className="px-3 py-1 text-gray-600 dark:text-gray-300 text-sm">{ORDINALS[+pos]}</td>
                  <td className="px-3 py-1 text-gray-600 dark:text-gray-300 text-sm font-semibold">{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h1 className="text-3xl font-[Racing_Sans_One] text-gray-700 dark:text-gray-200 mb-2">
            Why We Play
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The official F1 Fantasy game is overly complex with budgets, turbo
            drivers, streaks, and teammate comparisons—when really all we want
            to do is root for our favorites and see who can predict a winner.
            This game strips it back to exactly that.
          </p>

          <h1 className="text-3xl font-[Racing_Sans_One] text-gray-700 dark:text-gray-200 mb-2">
            Issues?
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Deal with it—or call me</p>
        </div>
      </div>
    </Layout>
  );
}
