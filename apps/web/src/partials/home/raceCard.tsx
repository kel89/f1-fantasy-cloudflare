import LockClockIcon from "@mui/icons-material/LockClock";
import LockOpenIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Chip from "@mui/material/Chip";
import { useNavigate } from "react-router-dom";
import type { Race } from "@f1/shared";

interface RaceCardProps {
  data: Race;
}

const STATUS_COLORS = {
  upcoming: "default",
  locked: "warning",
  scored: "success",
} as const;

export default function RaceCard({ data }: RaceCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/race/${data.id}`)}
      className="w-full border border-gray-200 dark:border-gray-700 shadow-lg p-3 flex justify-between items-center cursor-pointer transition ease-in-out duration-300 hover:border-2 hover:border-red-500 bg-white dark:bg-gray-800 rounded"
    >
      <div>
        <div className="text-lg font-medium dark:text-gray-100">{data.name}</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {data.city}, {data.country}
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">
          {new Date(data.race_date).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Chip
          label={data.status}
          color={STATUS_COLORS[data.status] ?? "default"}
          size="small"
        />
        {data.status === "upcoming" ? (
          <LockOpenIcon fontSize="small" className="text-gray-400" />
        ) : data.status === "locked" ? (
          <LockClockIcon fontSize="small" className="text-orange-400" />
        ) : (
          <CheckCircleIcon fontSize="small" className="text-green-500" />
        )}
      </div>
    </div>
  );
}
