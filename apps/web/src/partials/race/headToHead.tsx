import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import type { Driver, RaceWithDetails } from "@f1/shared";
import RosterPreview from "./rosterPreview";

type RaceRoster = RaceWithDetails["rosters"][number];

interface HeadToHeadProps {
  open: boolean;
  onClose: () => void;
  myRoster: RaceRoster;
  theirRoster: RaceRoster;
  race: RaceWithDetails;
  drivers: Driver[];
}

export default function HeadToHead({
  open,
  onClose,
  myRoster,
  theirRoster,
  race,
  drivers,
}: HeadToHeadProps) {
  const isScored = race.results.length > 0;
  const results = race.results;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span className="font-[Racing_Sans_One] text-lg">
            Head-to-Head
          </span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>
        {isScored && (
          <div className="text-sm mt-1 font-normal">
            <span
              className={
                (myRoster.total_points ?? 0) >= (theirRoster.total_points ?? 0)
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              You: {myRoster.total_points ?? 0} pts
            </span>
            {" vs "}
            <span
              className={
                (theirRoster.total_points ?? 0) >= (myRoster.total_points ?? 0)
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              {theirRoster.user.nickname}: {theirRoster.total_points ?? 0} pts
            </span>
          </div>
        )}
      </DialogTitle>
      <DialogContent>
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Your Roster</h3>
            <RosterPreview
              roster={myRoster}
              drivers={drivers}
              results={results}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {theirRoster.user.nickname}'s Roster
            </h3>
            <RosterPreview
              roster={theirRoster}
              drivers={drivers}
              results={results}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
