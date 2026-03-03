import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import type { Driver, Roster, RaceWithDetails } from "@f1/shared";
import RosterPreview from "./rosterPreview";
import SetRosterDialog from "./setRosterDialog";
import { useAuthStore } from "../../store/auth";

interface YourRosterProps {
  race: RaceWithDetails;
  drivers: Driver[];
  onRosterUpdated: (roster: Roster) => void;
}

export default function YourRoster({ race, drivers, onRosterUpdated }: YourRosterProps) {
  const { user } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) return null;

  const myRoster = race.rosters.find((r) => r.user_id === user.id) as
    | (Roster & { user: { id: string; nickname: string } })
    | undefined;

  const isLocked = race.status !== "upcoming";
  const results = race.results;

  return (
    <>
      <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded">
        <div className="flex justify-between items-center mb-3">
          <h1 className="font-[Racing_Sans_One] text-xl text-gray-800 dark:text-gray-100">Your Roster</h1>
          {myRoster && !isLocked && (
            <IconButton onClick={() => setDialogOpen(true)} size="small">
              <EditIcon />
            </IconButton>
          )}
        </div>

        {!myRoster && !isLocked ? (
          <button
            className="w-full text-center py-3 border-2 rounded-lg border-dashed border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition duration-200 font-medium"
            onClick={() => setDialogOpen(true)}
          >
            Set Your Roster!
          </button>
        ) : !myRoster && isLocked ? (
          <p className="text-gray-500 dark:text-gray-400 font-[Racing_Sans_One] text-lg">
            You never set a roster!
          </p>
        ) : myRoster && isLocked ? (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your roster is locked in.</p>
            <RosterPreview roster={myRoster} drivers={drivers} results={results} />
          </div>
        ) : (
          <RosterPreview roster={myRoster!} drivers={drivers} />
        )}
      </div>

      <SetRosterDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        raceId={race.id}
        existingRoster={myRoster ?? null}
        drivers={drivers}
        onSaved={onRosterUpdated}
      />
    </>
  );
}
