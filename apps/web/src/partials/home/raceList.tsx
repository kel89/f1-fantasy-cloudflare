import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import type { Race } from "@f1/shared";
import { api } from "../../api/client";
import RaceCard from "./raceCard";
import { countryFlags } from "../../utils/countryFlags";

export default function RaceList() {
  const navigate = useNavigate();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.races.list().then((data) => {
      setRaces(data);
      setLoading(false);
    });
  }, []);

  const sorted = [...races].sort((a, b) => a.round - b.round);
  const now = new Date();
  const nextRace = sorted.find((r) => new Date(r.race_date) >= now);

  return (
    <div className="f1-card">
      <h1 className="font-[Racing_Sans_One] text-2xl text-gray-700 dark:text-gray-200 mb-4">
        Race Calendar
      </h1>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={72} />
          ))}
        </div>
      ) : races.length === 0 ? (
        <p className="text-gray-400 text-center py-6">No races scheduled yet.</p>
      ) : (
        <div>
          {nextRace && (
            <div
              onClick={() => navigate(`/race/${nextRace.id}`)}
              className="mb-5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 p-4 text-white shadow-lg cursor-pointer transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 hover:from-red-500 hover:to-red-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse-dot" />
                <span className="text-xs font-bold uppercase tracking-widest">Next Race</span>
              </div>
              <div className="text-xl font-bold">{nextRace.name}</div>
              <div className="text-red-100 text-sm mt-1">
                {countryFlags[nextRace.country] ?? ""} {nextRace.city}, {nextRace.country}
                <span className="mx-2">·</span>
                {new Date(nextRace.race_date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              All Races
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto race-list-scroll pr-1">
            {sorted.map((race) => (
              <RaceCard data={race} key={race.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
