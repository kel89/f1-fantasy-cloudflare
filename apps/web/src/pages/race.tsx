import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import Chip from "@mui/material/Chip";
import type { Driver, RaceWithDetails, Roster } from "@f1/shared";
import { api } from "../api/client";
import { Layout } from "../utils/layout";
import YourRoster from "../partials/race/yourRoster";
import RosterList from "../partials/race/rosterList";
import ResultsPreview from "../partials/race/resultsPreview";
import { countryFlags } from "../utils/countryFlags";

export default function Race() {
  const { id } = useParams<{ id: string }>();
  const [race, setRace] = useState<RaceWithDetails | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.races.get(id), api.drivers.list()]).then(([raceData, driverData]) => {
      setRace(raceData);
      setDrivers(driverData);
      setLoading(false);
    });
  }, [id]);

  const handleRosterUpdated = (updatedRoster: Roster) => {
    if (!race) return;
    const existingIdx = race.rosters.findIndex((r) => r.id === updatedRoster.id);
    if (existingIdx >= 0) {
      const newRosters = [...race.rosters];
      newRosters[existingIdx] = { ...newRosters[existingIdx], ...updatedRoster };
      setRace({ ...race, rosters: newRosters });
    } else {
      api.races.get(id!).then(setRace);
    }
  };

  const STATUS_COLOR = {
    upcoming: "default",
    locked: "warning",
    scored: "success",
  } as const;

  return (
    <Layout pageName={race ? race.city : "Race"}>
      <div className="f1-bg bg-gray-100 dark:bg-gray-900 min-h-screen">
        {loading || !race ? (
          <div className="p-6">
            <Skeleton variant="text" width={200} height={40} className="mb-2" />
            <Skeleton variant="text" width={150} height={24} className="mb-1" />
            <Skeleton variant="text" width={250} height={20} className="mb-4" />
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
              <Skeleton variant="rounded" height={300} />
              <Skeleton variant="rounded" height={300} />
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-gray-900 via-red-900 to-gray-900 px-6 py-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-[Racing_Sans_One] text-sm">{race.round}</span>
                </div>
                <h1 className="text-2xl font-[Racing_Sans_One] text-white">{race.name}</h1>
                <Chip
                  label={race.status}
                  color={STATUS_COLOR[race.status] ?? "default"}
                  size="small"
                />
              </div>
              <div className="text-red-200 text-sm ml-13">
                {countryFlags[race.country] ?? ""} {race.city}, {race.country}
                <span className="mx-2">·</span>
                {new Date(race.race_date).toLocaleString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="p-6 grid sm:grid-cols-2 grid-cols-1 gap-4">
              <div>
                <YourRoster
                  race={race}
                  drivers={drivers}
                  onRosterUpdated={handleRosterUpdated}
                />
              </div>
              <div className="flex flex-col gap-4">
                <RosterList race={race} drivers={drivers} />
                {race.results.length > 0 && (
                  <ResultsPreview results={race.results} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
