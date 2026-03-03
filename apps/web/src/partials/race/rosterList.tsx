import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { Driver, Roster, Result, RaceWithDetails } from "@f1/shared";
import RosterPreview from "./rosterPreview";

interface RosterListProps {
  race: RaceWithDetails;
  drivers: Driver[];
}

type RaceRoster = RaceWithDetails["rosters"][number];

export default function RosterList({ race, drivers }: RosterListProps) {
  const [selected, setSelected] = useState<RaceRoster | null>(null);

  const results = race.results as Array<Result & { driver: Driver }>;

  return (
    <>
      <div className="p-4 bg-white border shadow-lg rounded">
        <h2 className="font-[Racing_Sans_One] text-xl text-gray-500 mb-2">Other Rosters</h2>
        {race.rosters.length === 0 ? (
          <p className="text-gray-400 text-sm">No rosters submitted yet.</p>
        ) : (
          <div>
            {[...race.rosters]
              .sort((a, b) => (b.total_points ?? -1) - (a.total_points ?? -1))
              .map((roster) => (
                <div
                  key={roster.id}
                  className="w-full border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 py-2 px-1"
                  onClick={() => setSelected(roster)}
                >
                  <span className="text-gray-700">{roster.user.nickname}</span>
                  <span className="font-semibold text-gray-600">
                    {roster.total_points != null ? `${roster.total_points} pts` : "—"}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="xs"
      >
        {selected && (
          <>
            <DialogTitle>
              <span className="font-[Racing_Sans_One]">{selected.user.nickname}'s Roster</span>
            </DialogTitle>
            <DialogContent>
              <RosterPreview
                roster={selected as unknown as Roster}
                drivers={drivers}
                results={results}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}
