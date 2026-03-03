import { useEffect, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
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
        <h1 className="font-[Racing_Sans_One] text-2xl text-gray-700">Leaderboard</h1>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? (
          <div className="flex justify-center py-4">
            <CircularProgress color="error" size={32} />
          </div>
        ) : (
          <table className="table-auto w-full">
            <thead className="border-b">
              <tr className="text-left bg-gray-100">
                <th className="text-gray-900 px-3 py-2">#</th>
                <th className="text-gray-900 px-3 py-2">Player</th>
                <th className="text-gray-900 px-3 py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-b even:bg-gray-50 transition duration-150 hover:bg-red-50"
                >
                  <td className="px-3 py-2 text-gray-500 text-sm">{i + 1}</td>
                  <td className="px-3 py-2">{u.nickname}</td>
                  <td className="px-3 py-2 font-semibold">{u.total_points}</td>
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
