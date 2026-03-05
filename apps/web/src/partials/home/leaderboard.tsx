import { useEffect, useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { LeaderboardEntry } from "@f1/shared";
import { api } from "../../api/client";
import { useAuthStore } from "../../store/auth";

const PODIUM_STYLES: Record<number, { border: string; icon: string }> = {
  0: { border: "border-l-yellow-400", icon: "text-yellow-400" },
  1: { border: "border-l-gray-400", icon: "text-gray-400" },
  2: { border: "border-l-amber-600", icon: "text-amber-600" },
};

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    api.leaderboard.get().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="f1-card">
      <h1 className="font-[Racing_Sans_One] text-2xl text-gray-700 dark:text-gray-200 mb-4">
        Leaderboard
      </h1>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-center py-6">No players yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u, i) => {
            const podium = PODIUM_STYLES[i];
            const isMe = currentUser?.id === u.id;

            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition duration-150 hover:bg-red-50 dark:hover:bg-gray-700
                  ${podium ? `border-l-4 ${podium.border}` : "border-l-4 border-l-transparent"}
                  ${isMe ? "ring-2 ring-red-500/40 bg-red-50/50 dark:bg-red-950/20" : "bg-white dark:bg-gray-800"}
                  border-gray-200 dark:border-gray-700`}
              >
                <div className="w-8 text-center flex-shrink-0">
                  {podium ? (
                    <EmojiEventsIcon fontSize="small" className={podium.icon} />
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`dark:text-gray-200 truncate block ${i < 3 ? "font-semibold" : ""}`}>
                    {u.nickname}
                    {isMe && (
                      <span className="ml-1.5 text-xs text-red-500 font-normal">(you)</span>
                    )}
                  </span>
                </div>
                <span className={`font-bold tabular-nums flex-shrink-0 ${i < 3 ? "text-lg dark:text-gray-100" : "text-sm text-gray-600 dark:text-gray-300"}`}>
                  {u.total_points}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
