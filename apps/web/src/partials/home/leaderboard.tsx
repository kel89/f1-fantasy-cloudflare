import { useEffect, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Skeleton from "@mui/material/Skeleton";
import type { LeaderboardEntry } from "@f1/shared";
import { api } from "../../api/client";

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    api.leaderboard.get().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <h1 className="font-[Racing_Sans_One] text-2xl text-gray-700 dark:text-gray-200">Leaderboard</h1>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? (
          <div className="flex flex-col gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={36} />
            ))}
          </div>
        ) : (
          <table className="table-auto w-full">
            <thead className="border-b">
              <tr className="text-left bg-gray-100 dark:bg-gray-700">
                <th className="text-gray-900 dark:text-gray-100 px-3 py-2">#</th>
                <th className="text-gray-900 dark:text-gray-100 px-3 py-2">Player</th>
                <th className="text-gray-900 dark:text-gray-100 px-3 py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-b even:bg-gray-50 dark:even:bg-gray-700 transition duration-150 hover:bg-red-50 dark:hover:bg-gray-600"
                >
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">{i + 1}</td>
                  <td className="px-3 py-2 dark:text-gray-200">{u.nickname}</td>
                  <td className="px-3 py-2 font-semibold dark:text-gray-100">{u.total_points}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-400">
                    No players yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
