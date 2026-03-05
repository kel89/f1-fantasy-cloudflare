import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import type { Driver, RaceWithDetails } from "@f1/shared";
import RosterPreview from "./rosterPreview";
import HeadToHead from "./headToHead";
import { useAuthStore } from "../../store/auth";

interface RosterListProps {
  race: RaceWithDetails;
  drivers: Driver[];
}

type RaceRoster = RaceWithDetails["rosters"][number];

export default function RosterList({ race, drivers }: RosterListProps) {
  const [selected, setSelected] = useState<RaceRoster | null>(null);
  const [compareTarget, setCompareTarget] = useState<RaceRoster | null>(null);
  const { user } = useAuthStore();

  const results = race.results;
  const myRoster = user ? race.rosters.find((r) => r.user_id === user.id) : null;

  return (
    <>
      <div className="f1-card">
        <h2 className="font-[Racing_Sans_One] text-xl text-gray-500 dark:text-gray-300 mb-2">Other Rosters</h2>
        {race.rosters.length === 0 ? (
          <p className="text-gray-400 text-sm">No rosters submitted yet.</p>
        ) : (
          <div>
            {[...race.rosters]
              .sort((a, b) => (b.total_points ?? -1) - (a.total_points ?? -1))
              .map((roster) => (
                <div
                  key={roster.id}
                  className="w-full border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700 py-2.5 px-2 rounded transition duration-150"
                  onClick={() => setSelected(roster)}
                >
                  <span className="text-gray-700 dark:text-gray-200">{roster.user.nickname}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      {roster.total_points != null ? `${roster.total_points} pts` : "—"}
                    </span>
                    {myRoster && roster.user_id !== user?.id && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareTarget(roster);
                        }}
                      >
                        <CompareArrowsIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
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
                roster={selected}
                drivers={drivers}
                results={results}
              />
            </DialogContent>
          </>
        )}
      </Dialog>

      {myRoster && compareTarget && (
        <HeadToHead
          open={!!compareTarget}
          onClose={() => setCompareTarget(null)}
          myRoster={myRoster}
          theirRoster={compareTarget}
          race={race}
          drivers={drivers}
        />
      )}
    </>
  );
}
