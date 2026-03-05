import LockClockIcon from "@mui/icons-material/LockClock";
import LockOpenIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Chip from "@mui/material/Chip";
import { useNavigate } from "react-router-dom";
import type { Race } from "@f1/shared";
import { countryFlags } from "../../utils/countryFlags";

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
  const flag = countryFlags[data.country] ?? "";

  return (
    <div
      onClick={() => navigate(`/race/${data.id}`)}
      className="w-full border border-gray-200 dark:border-gray-700 border-l-4 border-l-red-600 shadow-md p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 bg-white dark:bg-gray-800 rounded-lg"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center">
        <span className="text-white font-[Racing_Sans_One] text-sm">{data.round}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-medium dark:text-gray-100 truncate">{data.name}</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {flag && <span className="mr-1">{flag}</span>}
          {data.city}, {data.country}
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-xs">
          {new Date(data.race_date).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
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
